'use client';

import type { Hook } from '@/lib/data';
import { fmt } from '@/lib/data';
import { Copy, Save, Up } from '@/components/icons';
import { toast } from '@/components/toaster';
import { saveItem } from '@/lib/library';

export function HookCard({ hook: h, delay = 0 }: { hook: Hook; delay?: number }) {
  return (
    <article className="card hook-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="chip-row">
        <span className="chip hot">{h.type}</span>
        {h.industries.map((n) => <span key={n} className="chip">{n}</span>)}
        {h.real && <span className="chip cyan" style={{ marginLeft: 'auto' }}>Réel</span>}
      </div>
      <p className="hook-text">{h.text}</p>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>{h.explanation}</p>
      <div className="hook-meta">
        {h.real ? (
          <>
            <span>{fmt(h.views ?? 0)} vues</span>
            <span className="perf-bar"><i style={{ width: `${Math.min(100, h.performance * 6)}%` }} /></span>
            <span>{h.performance} % de likes</span>
          </>
        ) : (
          <>
            <span>{h.performance} % de rétention</span>
            <span className="perf-bar"><i style={{ width: `${h.performance}%` }} /></span>
            <span>vidéos de ~{h.avgDuration} s</span>
          </>
        )}
      </div>
      <div className="card-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            navigator.clipboard?.writeText(h.text);
            toast('Hook copié dans le presse-papiers');
          }}
        >
          <Copy /> Copier
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() =>
            saveItem(
              'hook',
              h.id,
              { text: h.text, type: h.type, performance: h.performance, explanation: h.explanation },
              'Hook ajouté à votre bibliothèque',
            )
          }
        >
          <Save /> Sauvegarder
        </button>
        {h.real && h.url && (
          <a className="btn btn-secondary btn-sm" href={h.url} target="_blank" rel="noopener noreferrer">
            <Up /> La vidéo
          </a>
        )}
      </div>
    </article>
  );
}
