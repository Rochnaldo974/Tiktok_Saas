'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from '@/components/icons';
import { NICHES, TREND_STATUS, STATUS_LABELS, DIFFICULTY_LABELS, SATURATION_LABELS } from '@/lib/data';
import { track } from '@/lib/analytics';

/* Filtres de la page Opportunités : recherche orientée intention,
   3 modes de classement, filtres essentiels visibles, le reste sous
   « Plus de filtres ». Tout vit dans l'URL (vues partageables). */

const SEARCH_SUGGESTIONS = [
  'Vidéo pour obtenir des prospects immobiliers',
  'Idée facile à tourner aujourd’hui',
  'Format éducatif pour la finance',
  'Son émergent pour une marque beauté',
];

export const RANK_MODES = [
  { id: '', label: 'Recommandées pour vous' },
  { id: 'emerging', label: 'Émergentes' },
  { id: 'easy', label: 'Faciles à produire' },
] as const;

export function OpportunityFilters({ followedNiches = [] }: { followedNiches?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const niche = params.get('niche') ?? '';
  const status = params.get('status') ?? '';
  const diff = params.get('diff') ?? '';
  const sat = params.get('sat') ?? '';
  const mode = params.get('mode') ?? '';
  const [text, setText] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  const [moreOpen, setMoreOpen] = useState(Boolean(diff || sat || status));

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
    track('filter_used', patch);
  }

  // Recherche avec debounce pour ne pas spammer la navigation.
  useEffect(() => {
    if (text === q) return;
    const t = setTimeout(() => {
      apply({ q: text });
      if (text) track('search_used', { q: text });
    }, 350);
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
          placeholder="Décrivez ce que vous voulez créer…"
          aria-label="Rechercher une opportunité"
        />
        {text && (
          <button className="kbd" onClick={() => setText('')} aria-label="Effacer la recherche">effacer</button>
        )}
      </div>
      <div className="suggest-row">
        <span className="lbl">Essayez</span>
        {SEARCH_SUGGESTIONS.map((s) => (
          <button key={s} className="pill" onClick={() => setText(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="segmented" role="tablist" aria-label="Classement" style={{ marginTop: 22 }}>
        {RANK_MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? 'on' : ''}
            onClick={() => apply({ mode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="filter-bar" style={{ marginTop: 16 }}>
        <button className={`pill${!niche ? ' on' : ''}`} onClick={() => apply({ niche: '' })}>
          Toutes les niches
        </button>
        {[...new Set([...followedNiches, ...NICHES.map((n) => n.name)])].slice(0, 12).map((name) => (
          <button
            key={name}
            className={`pill${niche === name ? ' on' : ''}`}
            onClick={() => apply({ niche: niche === name ? '' : name })}
          >
            {name}
          </button>
        ))}
        <span className="sep" aria-hidden="true" />
        <button
          className={`pill${moreOpen ? ' on' : ''}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          Plus de filtres
        </button>
      </div>

      {moreOpen && (
        <div className="filter-bar" style={{ marginTop: 10 }}>
          {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
            <button
              key={d}
              className={`pill${diff === d ? ' on' : ''}`}
              onClick={() => apply({ diff: diff === d ? '' : d })}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
          <span className="sep" aria-hidden="true" />
          {(['Low', 'Medium', 'High'] as const).map((s) => (
            <button
              key={s}
              className={`pill${sat === s ? ' on' : ''}`}
              onClick={() => apply({ sat: sat === s ? '' : s })}
            >
              Saturation {SATURATION_LABELS[s].toLowerCase()}
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
      )}
    </div>
  );
}
