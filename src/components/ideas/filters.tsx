'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from '@/components/icons';
import { NICHES, TREND_STATUS } from '@/lib/data';

const SUGGESTIONS = ['Finance', 'Food', 'Beauty', 'Gaming', 'Marketing'];

export function IdeasFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const niche = params.get('niche') ?? '';
  const status = params.get('status') ?? '';
  const [text, setText] = useState(q);
  const [prevQ, setPrevQ] = useState(q);

  // Re-sync the input when the URL changes from outside (back button, ⌘K).
  if (q !== prevQ) {
    setPrevQ(q);
    setText(q);
  }

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  // Debounced text search so typing doesn't spam navigation.
  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => apply({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div>
      <div className="ideas-search">
        <Search />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search a niche, topic, sound or hook — “finance”, “meal prep”, “pov”..."
          aria-label="Search ideas"
        />
        {text && (
          <button className="kbd" onClick={() => setText('')} aria-label="Clear search">clear</button>
        )}
      </div>
      <div className="suggest-row">
        <span className="lbl">Try</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className={`pill${q === s ? ' on' : ''}`}
            onClick={() => setText(q === s ? '' : s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="filter-bar" style={{ marginTop: 22 }}>
        <button className={`pill${!niche ? ' on' : ''}`} onClick={() => apply({ niche: '' })}>
          All niches
        </button>
        {NICHES.map((n) => (
          <button
            key={n.name}
            className={`pill${niche === n.name ? ' on' : ''}`}
            onClick={() => apply({ niche: niche === n.name ? '' : n.name })}
          >
            {n.name}
          </button>
        ))}
        <span className="sep" aria-hidden="true" />
        {TREND_STATUS.map((s) => (
          <button
            key={s}
            className={`pill${status === s ? ' on' : ''}`}
            onClick={() => apply({ status: status === s ? '' : s })}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
