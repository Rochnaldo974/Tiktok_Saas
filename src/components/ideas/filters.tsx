'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from '@/components/icons';
import { NICHES, TREND_STATUS, STATUS_LABELS } from '@/lib/data';

const SUGGESTIONS = ['Finance', 'Cuisine', 'Beauté', 'Gaming', 'Marketing'];

export function IdeasFilters({ followedNiches = [] }: { followedNiches?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const niche = params.get('niche') ?? '';
  const status = params.get('status') ?? '';
  const [text, setText] = useState(q);
  const [prevQ, setPrevQ] = useState(q);

  // Resynchronise le champ quand l'URL change de l'extérieur (retour, ⌘K).
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

  // Recherche avec debounce pour ne pas spammer la navigation.
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
          placeholder="Cherchez une niche, un sujet, un son ou un hook — « finance », « meal prep », « pov »..."
          aria-label="Rechercher des idées"
        />
        {text && (
          <button className="kbd" onClick={() => setText('')} aria-label="Effacer la recherche">effacer</button>
        )}
      </div>
      <div className="suggest-row">
        <span className="lbl">Essayez</span>
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
          Toutes les niches
        </button>
        {[...new Set([...followedNiches, ...NICHES.map((n) => n.name)])].map((name) => (
          <button
            key={name}
            className={`pill${niche === name ? ' on' : ''}`}
            onClick={() => apply({ niche: niche === name ? '' : name })}
          >
            {name}
          </button>
        ))}
        <span className="sep" aria-hidden="true" />
        {TREND_STATUS.map((s) => (
          <button
            key={s}
            className={`pill${status === s ? ' on' : ''}`}
            onClick={() => apply({ status: status === s ? '' : s })}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
