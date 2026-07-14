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
