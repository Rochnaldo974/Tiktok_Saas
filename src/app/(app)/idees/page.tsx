import Link from 'next/link';
import { dataset, resolveCountry, resolveTimeframe } from '@/lib/data';
import { getPrefs } from '@/lib/prefs';
import { IdeasFilters } from '@/components/ideas/filters';
import { IdeaCard } from '@/components/ideas/idea-card';
import { Scan } from '@/components/icons';
import { Suspense } from 'react';

type Search = Promise<{
  country?: string;
  tf?: string;
  q?: string;
  niche?: string;
  status?: string;
}>;

export const metadata = { title: 'Idées' };

export default async function IdeasPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const prefs = await getPrefs();
  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;
  const q = (params.q ?? '').trim().toLowerCase();
  const niche = params.niche ?? '';
  const status = params.status ?? '';

  const d = dataset(country, timeframe);
  const ideas = d.videos
    .filter((v) => {
      if (niche && v.niche !== niche) return false;
      if (status && v.status !== status) return false;
      if (q) {
        const haystack = `${v.title} ${v.niche} ${v.sound.name} ${v.hook.text} ${v.creator.handle} ${v.contentType}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .slice(0, 12);

  const baseQuery = `?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 36 }}>
        <header>
          <p className="eyebrow">Moteur à idées — {country} · {timeframe}</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Que filmer aujourd&apos;hui ?</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Chaque idée ci-dessous s&apos;appuie sur une vidéo qui monte en ce moment en {country},
            avec le hook, le son et le plan de production pour faire votre version.
          </p>
          <Suspense fallback={null}>
            <IdeasFilters />
          </Suspense>
        </header>

        {ideas.length ? (
          <div className="idea-feed">
            {ideas.map((v, i) => (
              <IdeaCard key={v.id} video={v} delay={i * 50} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Scan />
            <h4>Aucun signal fort pour ce filtre</h4>
            <p>Essayez une autre niche ou une autre période — ou effacez la recherche pour voir tout ce qui bouge en {country}.</p>
            <Link className="btn btn-secondary" href={`/idees${baseQuery}`}>Effacer les filtres</Link>
          </div>
        )}
      </div>
    </div>
  );
}
