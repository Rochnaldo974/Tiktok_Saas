import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUser } from '@/lib/supabase/server';

/* Génération de script par l'API Claude.
   - Réservée aux utilisateurs connectés (l'appel a un coût réel).
   - Entrée validée en liste blanche ; sortie contrainte par un
     JSON Schema (structured outputs) → toujours parsable.
   - Sans ANTHROPIC_API_KEY configurée : 503, le client garde le
     script local (dégradation propre). */

export const runtime = 'nodejs';

interface ScriptRequest {
  title: string;
  niche: string;
  hook: string;
  sound: string;
  cta: string;
  contentType: string;
  duration: number;
  summary: string;
}

function parseBody(data: unknown): ScriptRequest | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const str = (v: unknown, max: number) =>
    typeof v === 'string' && v.length > 0 && v.length <= max ? v : null;
  const title = str(d.title, 200);
  const niche = str(d.niche, 40);
  const hook = str(d.hook, 300);
  const sound = str(d.sound, 100);
  const cta = str(d.cta, 200);
  const contentType = str(d.contentType, 40);
  const summary = str(d.summary, 500);
  const duration =
    typeof d.duration === 'number' && d.duration >= 5 && d.duration <= 120
      ? Math.round(d.duration)
      : null;
  if (!title || !niche || !hook || !sound || !cta || !contentType || !summary || !duration) return null;
  return { title, niche, hook, sound, cta, contentType, summary, duration };
}

const SCRIPT_SCHEMA = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Nom court de la section (ex. Hook, CTA)' },
          time: { type: 'string', description: 'Fenêtre temporelle, ex. « 0–3 s »' },
          text: {
            type: 'string',
            description:
              'Contenu de la section : répliques exactes à dire entre guillemets + indications de tournage concrètes',
          },
        },
        required: ['label', 'time', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['sections'],
  additionalProperties: false,
} as const;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "La génération IA n'est pas configurée (ANTHROPIC_API_KEY manquante)." },
      { status: 503 },
    );
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Connectez-vous pour générer un script avec l’IA.' },
      { status: 401 },
    );
  }

  let body: ScriptRequest | null;
  try {
    body = parseBody(await request.json());
  } catch {
    body = null;
  }
  if (!body) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: SCRIPT_SCHEMA },
      },
      system:
        "Tu es un scénariste senior spécialisé TikTok, en français. Tu écris des scripts prêts à tourner pour des créateurs solo : des répliques exactes à dire face caméra (naturelles, orales, tutoiement) et des indications de tournage concrètes (plans, texte incrusté, rythme de coupe). Chaque section est minutée. Reste dans la durée totale imposée. Pas de hashtags, pas d'émojis.",
      messages: [
        {
          role: 'user',
          content: `Écris le script complet d'une vidéo TikTok de ${body.duration} secondes en 5 sections (Hook, Mise en place, Développement, Révélation, CTA).

Contexte de la tendance à adapter :
- Sujet : ${body.title} (niche ${body.niche})
- Format : ${body.contentType}
- Hook imposé (à utiliser tel quel en ouverture) : « ${body.hook} »
- Son : « ${body.sound} »
- CTA imposé (à utiliser en clôture) : « ${body.cta} »
- Pourquoi l'original fonctionne : ${body.summary}

Pour chaque section : la fenêtre temporelle (ex. « 0–3 s »), les répliques exactes entre guillemets, et une indication de tournage en une phrase.`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: 'Génération refusée — réessayez avec une autre tendance.' },
        { status: 502 },
      );
    }

    const text = response.content.find((b) => b.type === 'text')?.text ?? '';
    const parsed = JSON.parse(text) as { sections: { label: string; time: string; text: string }[] };
    if (!Array.isArray(parsed.sections) || !parsed.sections.length) {
      return NextResponse.json({ error: 'Réponse IA inattendue.' }, { status: 502 });
    }
    return NextResponse.json({ sections: parsed.sections.slice(0, 8) });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Trop de générations en cours — réessayez dans une minute.' },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error('Claude API error', error.status, error.message);
      return NextResponse.json({ error: 'Le service IA est indisponible.' }, { status: 502 });
    }
    console.error('Script generation error', error);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
