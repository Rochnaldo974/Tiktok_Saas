import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase/server';
import { normalizeNiches } from '@/lib/prefs-shared';
import type { ProfileAnalysis, ProfileAnalysisResponse, ProfileStats } from '@/lib/profile-analysis';

/* Analyse de profil TikTok par IA.
   - Entrée : un @handle TikTok public (on lit la page publique : bio,
     stats) OU une description libre du contenu (fallback quand le
     profil est inaccessible ou inexistant).
   - Sortie : niches détectées + résumé + forces + conseils, en français.
   - Accessible sans compte (c'est l'accroche de l'onboarding), mais
     protégée par un rate limit par IP — l'appel IA a un coût réel.
   - Si l'utilisateur est connecté, le résultat est mémorisé dans son
     profil (`tiktok_handle`, `tiktok_analysis`). */

export const runtime = 'nodejs';

const RATE_LIMIT = 10; // analyses / heure / IP
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

interface TikTokProfile {
  handle: string;
  nickname: string | null;
  bio: string | null;
  verified: boolean;
  stats: ProfileStats;
}

async function fetchTikTokProfile(handle: string): Promise<TikTokProfile | null> {
  const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(handle)}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/s,
  );
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    const info = data?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
    if (!info || info.statusCode !== 0 || !info.userInfo?.user) return null;
    const user = info.userInfo.user;
    const stats = info.userInfo.stats ?? {};
    const num = (v: unknown) => (typeof v === 'number' && v >= 0 ? v : null);
    return {
      handle,
      nickname: typeof user.nickname === 'string' ? user.nickname : null,
      bio: typeof user.signature === 'string' && user.signature.trim() ? user.signature.trim() : null,
      verified: Boolean(user.verified),
      stats: {
        followers: num(stats.followerCount),
        videos: num(stats.videoCount),
        likes: num(stats.heartCount),
      },
    };
  } catch {
    return null;
  }
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    niches: {
      type: 'array',
      items: { type: 'string', description: 'Niche courte (1 à 3 mots), ex. « Danse », « Cuisine vegan »' },
      description: '1 à 3 niches principales du créateur',
    },
    summary: { type: 'string', description: 'Résumé du positionnement du créateur en 2 phrases' },
    strengths: { type: 'array', items: { type: 'string' }, description: '2 à 3 forces observées ou probables' },
    advice: { type: 'array', items: { type: 'string' }, description: '3 conseils concrets et actionnables pour croître' },
  },
  required: ['niches', 'summary', 'strengths', 'advice'],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "L'analyse IA n'est pas configurée (ANTHROPIC_API_KEY manquante)." },
      { status: 503 },
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Trop d’analyses depuis cette adresse — réessayez dans une heure.' },
      { status: 429 },
    );
  }

  let handle: string | null = null;
  let description: string | null = null;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.handle === 'string') {
      const cleaned = body.handle.trim().replace(/^@/, '');
      if (/^[a-zA-Z0-9._]{2,24}$/.test(cleaned)) handle = cleaned;
    }
    if (typeof body.description === 'string') {
      const cleaned = body.description.trim().slice(0, 600);
      if (cleaned.length >= 10) description = cleaned;
    }
  } catch {
    /* corps invalide → géré ci-dessous */
  }
  if (!handle && !description) {
    return NextResponse.json(
      { error: 'Indiquez un @handle TikTok valide ou décrivez votre contenu (10 caractères minimum).' },
      { status: 400 },
    );
  }

  let profile: TikTokProfile | null = null;
  if (handle) {
    try {
      profile = await fetchTikTokProfile(handle);
    } catch {
      profile = null;
    }
    if (!profile && !description) {
      return NextResponse.json(
        {
          error:
            'Profil introuvable ou inaccessible pour le moment. Vérifiez le @handle, ou décrivez votre contenu en quelques mots.',
          fallback: 'description',
        },
        { status: 424 },
      );
    }
  }

  const context = profile
    ? [
        `Handle : @${profile.handle}`,
        profile.nickname ? `Nom affiché : ${profile.nickname}` : null,
        profile.bio ? `Bio : ${profile.bio}` : 'Bio : (vide)',
        profile.stats.followers !== null ? `Abonnés : ${profile.stats.followers}` : null,
        profile.stats.videos !== null ? `Vidéos publiées : ${profile.stats.videos}` : null,
        profile.stats.likes !== null ? `Likes cumulés : ${profile.stats.likes}` : null,
        profile.verified ? 'Compte vérifié' : null,
        description ? `Description donnée par le créateur : ${description}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : `Description donnée par le créateur : ${description}`;

  const client = new Anthropic();
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: ANALYSIS_SCHEMA },
      },
      system:
        "Tu es un consultant senior en stratégie TikTok, en français. À partir des informations publiques d'un profil (bio, stats) et/ou de la description du créateur, tu identifies ses niches précises (courtes, ex. « Danse », « Cuisine réunionnaise », « Coiffure afro ») et tu donnes des conseils concrets, actionnables aujourd'hui, adaptés à sa taille d'audience. Sois direct et utile, jamais générique.",
      messages: [
        {
          role: 'user',
          content: `Analyse ce créateur TikTok et détecte ses niches :\n\n${context}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'Analyse refusée — réessayez.' }, { status: 502 });
    }
    const text = response.content.find((b) => b.type === 'text')?.text ?? '';
    const raw = JSON.parse(text) as ProfileAnalysis;
    const analysis: ProfileAnalysis = {
      niches: normalizeNiches(raw.niches).slice(0, 3),
      summary: String(raw.summary ?? '').slice(0, 600),
      strengths: (raw.strengths ?? []).map(String).slice(0, 3),
      advice: (raw.advice ?? []).map(String).slice(0, 4),
    };
    if (!analysis.niches.length) {
      return NextResponse.json({ error: 'Analyse inexploitable — réessayez.' }, { status: 502 });
    }

    const result: ProfileAnalysisResponse = {
      handle: profile?.handle ?? null,
      nickname: profile?.nickname ?? null,
      stats: profile?.stats ?? null,
      analysis,
    };

    // Mémorise dans le profil si l'utilisateur est connecté.
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase
          .from('profiles')
          .update({
            tiktok_handle: result.handle,
            tiktok_analysis: { ...analysis, analyzed_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          })
          .eq('id', auth.user.id);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Service saturé — réessayez dans une minute.' }, { status: 429 });
    }
    console.error('Profile analysis error', error);
    return NextResponse.json({ error: 'Analyse indisponible pour le moment.' }, { status: 502 });
  }
}
