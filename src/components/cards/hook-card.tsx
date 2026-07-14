'use client';

import type { Hook } from '@/lib/data';
import { Copy } from '@/components/icons';
import { toast } from '@/components/toaster';

export function HookCard({ hook: h, delay = 0 }: { hook: Hook; delay?: number }) {
  return (
    <article className="card hook-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="chip-row">
        <span className="chip hot">{h.type}</span>
        {h.industries.map((n) => <span key={n} className="chip">{n}</span>)}
      </div>
      <p className="hook-text">{h.text}</p>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>{h.explanation}</p>
      <div className="hook-meta">
        <span>{h.performance}% retention</span>
        <span className="perf-bar"><i style={{ width: `${h.performance}%` }} /></span>
        <span>~{h.avgDuration}s videos</span>
      </div>
      <div className="card-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            navigator.clipboard?.writeText(h.text);
            toast('Hook copied to clipboard');
          }}
        >
          <Copy /> Copy hook
        </button>
      </div>
    </article>
  );
}
