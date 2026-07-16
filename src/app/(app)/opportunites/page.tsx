import Link from 'next/link';
import { Suspense } from 'react';
import { dataset, resolveCountry, resolveTimeframe, type Video } from '@/lib/data';
import { getRealVideos, getRealSounds, getRealHooks } from '@/lib/providers/tiktok';
import { getPrefs } from '@/lib/prefs';
import { computeOpportunityScore, type ScoreContext } from '@/lib/content/opportunity-score';
import { OpportunityFilters } from '@/components/opportunities/filters';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import { SoundOpportunities, HookOpportunities } from '@/components/opportunities/extras';
import { Scan } from '@/components/icons';

type Search = Promise<{
  country?: string;
  tf?: string;
  q?: string;
  niche?: string;
  status?: string;
  diff?: string;
  sat?: string;
  mode?: string;
}>;

export const metadata = { title: 'Opportunités' };

export default async function OpportunitiesPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const prefs = await getPrefs();
  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;
  const q = (params.q ?? '').trim().toLowerCase();
  const niche = params.niche ?? '';
  const status = params.status ?? '';
  const diff = params.diff ?? '';
  const sat = params.sat ?? '';
  const mode = params.mode ?? '';

  const d = dataset(country, timeframe, prefs.niches);
  const [realVideos, realSounds, realHooks] = await Promise.all([
    getRealVideos(prefs.niches, country),
    getRealSounds(prefs.niches, country),
    getRealHooks(prefs.niches, country),
  ]);

  /* Tri serveur : contexte du cookie (niches), objectif neutre — le
     score personnalisé complet est recalculé côté client sur chaque
     carte (même formule, déterministe). */
  const ctx: ScoreContext = {
    niches: prefs.niches,
    primaryNiche: prefs.niches[0] ?? null,
    goal: null,
  };

  const pool = [...realVideos, ...d.videos].filter((v) => {
    if (niche && v.niche !== niche) return false;
    if (status && v.status !== status) return false;
    if (diff && v.difficulty !== diff) return false;
    if (sat && v.saturation !== sat) return false;
    if (mode === 'emerging' && !((v.status === 'New' || v.status === 'Growing') && v.uploadedH <= 48)) return false;
    if (mode === 'easy' && v.difficulty !== 'Easy') return false;
    if (q) {
      const haystack = `${v.title} ${v.niche} ${v.sound.name} ${v.hook.text} ${v.creator.handle} ${v.contentType}`.toLowerCase();
      /* recherche d'intention : chaque mot significatif peut matcher */
      const words = q.split(/\s+/).filter((w) => w.length > 3);
      const matches = words.length
        ? words.some((w) => haystack.includes(w))
        : haystack.includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const scoreOf = new Map<string, number>(
    pool.map((v) => [v.id, computeOpportunityScore(v, ctx).score]),
  );
  const opportunities: Video[] = pool
    .sort(
      (a, b) =>
        (scoreOf.get(b.id) ?? 0) - (scoreOf.get(a.id) ?? 0) || a.id.localeCompare(b.id),
    )
    .slice(0, 12);

  const baseQuery = `?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 44 }}>
        <header>
          <p className="eyebrow">Opportunités — {country} · {timeframe}</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Trouvez une idée qui mérite votre temps.</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Chaque opportunité est évaluée selon son potentiel, sa saturation et sa facilité
            de production — avant qu&apos;elle ne devienne trop saturée.
          </p>
          <Suspense fallback={null}>
            <OpportunityFilters followedNiches={prefs.niches} />
          </Suspense>
        </header>

        {opportunities.length ? (
          <div className="idea-feed">
            {opportunities.map((v, i) => (
              <OpportunityCard key={v.id} video={v} delay={i * 50} fallbackNiches={prefs.niches} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Scan />
            <h4>Aucune opportunité trouvée</h4>
            <p>Essayez une niche plus large ou réduisez vos filtres.</p>
            <Link className="btn btn-secondary" href={`/opportunites${baseQuery}`}>
              Réinitialiser les filtres
            </Link>
          </div>
        )}

        <SoundOpportunities
          sounds={realSounds.length ? realSounds : d.sounds.slice(0, 6)}
          videos={opportunities}
        />
        <HookOpportunities
          hooks={realHooks.length ? realHooks : d.hooks.slice(0, 6)}
          videos={opportunities.length ? opportunities : d.videos.slice(0, 6)}
        />
      </div>
    </div>
  );
}
