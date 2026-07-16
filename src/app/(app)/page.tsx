import Link from 'next/link';
import { dataset, fmt, resolveCountry, resolveTimeframe, type Video } from '@/lib/data';
import { getRealVideos, getGlobalRealVideos, getRealSounds, getRealHooks } from '@/lib/providers/tiktok';
import { getPrefsState } from '@/lib/prefs';
import { getSupabaseServer } from '@/lib/supabase/server';
import { OnboardingFlow } from '@/components/onboarding/flow';
import { TodayClient } from '@/components/today/today-client';
import { DiagnosticCard } from '@/components/today/diagnostic-card';
import { NextActionCard } from '@/components/today/next-action';
import { ArrowRight, Radar, Music, Quote, Clock } from '@/components/icons';

type Search = Promise<{ country?: string; tf?: string }>;

export const metadata = { title: "Aujourd'hui" };

export default async function TodayPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const { prefs, configured, user } = await getPrefsState();

  /* Première visite : l'onboarding construit le plan du jour. */
  if (!configured) {
    return (
      <div className="page" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content"><OnboardingFlow /></div>
      </div>
    );
  }

  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;
  const d = dataset(country, timeframe, prefs.niches);
  const followed = prefs.niches;
  const inNiches = (niche: string) => followed.includes(niche);

  /* Le serveur collecte les VRAIES tendances (tikwm → EnsembleData →
     démo) ; la personnalisation fine (objectif, statut du contenu du
     jour) se joue côté client sur ces données sérialisées. */
  const [realVideos, globalReal, realSounds, realHooks] = await Promise.all([
    getRealVideos(followed, country),
    getGlobalRealVideos(country),
    getRealSounds(followed, country),
    getRealHooks(followed, country),
  ]);
  const mine = realVideos.length ? realVideos : d.videos.filter((v) => inNiches(v.niche));
  const viral = globalReal.length ? globalReal : d.videos.slice(0, 8);
  const seen = new Set<string>();
  const candidates: Video[] = [...mine, ...viral]
    .filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))
    .slice(0, 24);
  const sounds = realSounds.length ? realSounds : d.sounds.slice(0, 6);
  const hooks = realHooks.length ? realHooks : d.hooks.slice(0, 6);
  const topSound = sounds[0];
  const topHook = hooks[0];

  /* Score du dernier audit (Supabase) — nourrit le diagnostic. */
  let profileScore: number | null = null;
  let profileHandle: string | null = null;
  if (user) {
    const supabase = await getSupabaseServer();
    const { data: profileData } = await supabase!
      .from('profiles')
      .select('tiktok_handle, tiktok_analysis')
      .eq('id', user.id)
      .single();
    const analysis = profileData?.tiktok_analysis as { score?: number } | null;
    if (typeof analysis?.score === 'number') {
      profileScore = analysis.score;
      profileHandle = profileData?.tiktok_handle ?? null;
    }
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="page">
      <div className="content">
        <header style={{ marginBottom: -24 }}>
          <h1 className="section-title" style={{ fontSize: 28 }}>Bonjour, voici votre plan pour aujourd&apos;hui.</h1>
          <p className="section-sub">
            Recommandations pour les créateurs en {followed.slice(0, 3).join(', ')}, sur le marché {country}.
          </p>
        </header>

        <TodayClient
          videos={candidates}
          sounds={sounds}
          hooks={hooks}
          fallbackNiches={followed}
          country={country}
        />
      </div>

      {/* rail droit */}
      <aside className="rail">
        <NextActionCard />
        <DiagnosticCard profileScore={profileScore} profileHandle={profileHandle} />
        <div className="card rail-card reveal" style={{ animationDelay: '80ms' }}>
          <h4>{country} · {timeframe}</h4>
          {topSound && (
            <div className="rail-row">
              <span className="k"><Music /> Son à saisir</span>
              <span className="v" style={{ maxWidth: 170, textAlign: 'right' }}>
                « {topSound.name.slice(0, 30)}{topSound.name.length > 30 ? '…' : ''} »
                {topSound.real && topSound.trendCount ? <small>{topSound.trendCount} tendance{topSound.trendCount > 1 ? 's' : ''} cette semaine</small> : null}
              </span>
            </div>
          )}
          <div className="rail-row">
            <span className="k"><Radar /> Vidéos analysées</span>
            <span className="v">{fmt(d.videos.length * 214)}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Clock /> Brief mis à jour</span>
            <span className="v">{today}</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--faint)', lineHeight: 1.5 }}>
            {realVideos.length
              ? 'Vidéos, sons, hooks et hashtags de vos niches sont de vraies données TikTok des 7 derniers jours (badge « Réel »).'
              : 'Données en cours de chargement ou indisponibles — tendances simulées affichées en attendant.'}
          </p>
          <Link className="section-link" style={{ marginTop: 10 }} href="/opportunites">
            Sons, hooks et hashtags <ArrowRight />
          </Link>
        </div>
        {topHook && (
          <div className="card rail-quote reveal" style={{ animationDelay: '160ms' }}>
            <p>{topHook.text}</p>
            <span>
              <Quote style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} />{' '}
              {topHook.real
                ? `Hook réel · ${fmt(topHook.views ?? 0)} vues cette semaine`
                : 'Hook qui retient en ce moment'}
            </span>
          </div>
        )}
      </aside>
    </div>
  );
}
