import Link from 'next/link';
import { dataset, resolveCountry, resolveTimeframe } from '@/lib/data';
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

export const metadata = { title: 'Ideas' };

export default async function IdeasPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const country = resolveCountry(params.country);
  const timeframe = resolveTimeframe(params.tf);
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
          <p className="eyebrow">Idea engine — {country} · {timeframe}</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>What should you film today?</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Every idea below is backed by a video currently growing in {country}, with the
            hook, sound and production plan to make your version.
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
            <h4>No strong signals for this filter</h4>
            <p>Try another niche or timeframe — or clear the search to see everything moving in {country}.</p>
            <Link className="btn btn-secondary" href={`/ideas${baseQuery}`}>Clear filters</Link>
          </div>
        )}
      </div>
    </div>
  );
}
