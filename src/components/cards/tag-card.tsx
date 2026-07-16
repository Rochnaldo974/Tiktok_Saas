import Link from 'next/link';
import type { Hashtag } from '@/lib/data';
import { fmt } from '@/lib/data';
import { Up, Down } from '@/components/icons';

export function TagCard({
  tag: t,
  country,
  timeframe,
  delay = 0,
}: {
  tag: Hashtag;
  country: string;
  timeframe: string;
  delay?: number;
}) {
  const up = t.growth >= 0;

  /* Hashtag réel : lien direct vers la page du tag sur TikTok. */
  if (t.real) {
    return (
      <a
        href={`https://www.tiktok.com/tag/${encodeURIComponent(t.tag.slice(1))}`}
        target="_blank"
        rel="noopener noreferrer"
        className="card tag-card hoverable reveal"
        style={{ animationDelay: `${delay}ms` }}
        title="Ouvrir le hashtag sur TikTok"
      >
        <div className="tag-name"><span>#</span>{t.tag.slice(1)}</div>
        <div className="tag-meta">
          <span>{fmt(t.views ?? 0)} vues dans vos tendances</span>
          <span>{t.niche}</span>
        </div>
        <div className="tag-foot">
          <span className="trend-dir up"><Up /> cette semaine</span>
          <span className="chip cyan">Réel</span>
        </div>
      </a>
    );
  }

  const href = `/idees?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}&q=${encodeURIComponent(t.niche)}`;
  return (
    <Link href={href} className="card tag-card hoverable reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="tag-name"><span>#</span>{t.tag.slice(1)}</div>
      <div className="tag-meta">
        <span>{fmt(t.videos)} vidéos</span>
        <span>{t.niche}</span>
      </div>
      <div className="tag-foot">
        <span className={`trend-dir ${up ? 'up' : 'down'}`}>
          {up ? <Up /> : <Down />} {up ? '+' : ''}{t.growth} %
        </span>
      </div>
    </Link>
  );
}
