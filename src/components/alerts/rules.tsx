'use client';

import { useState } from 'react';
import { toast } from '@/components/toaster';

const RULES = [
  { id: 'sounds', label: 'Sons en fenêtre de tir', desc: 'Moins de 5 000 vidéos et forte croissance' },
  { id: 'peaks', label: 'Formats au pic', desc: 'Dans vos niches suivies uniquement' },
  { id: 'hooks', label: 'Nouveaux hooks de référence', desc: 'Rétention supérieure à 90 %' },
  { id: 'creators', label: 'Créateurs qui accélèrent', desc: 'Croissance hebdo supérieure à 8 %' },
] as const;

export function AlertRules() {
  const [on, setOn] = useState<Record<string, boolean>>({
    sounds: true,
    peaks: true,
    hooks: true,
    creators: false,
  });

  return (
    <div className="card rail-card reveal">
      <h4>Règles d&apos;alerte</h4>
      {RULES.map((r) => (
        <div key={r.id} className="rail-row">
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{r.label}</span>
            <span style={{ display: 'block', color: 'var(--faint)', fontSize: 11.5 }}>{r.desc}</span>
          </span>
          <button
            role="switch"
            aria-checked={on[r.id]}
            aria-label={r.label}
            className="switch"
            onClick={() => {
              const next = !on[r.id];
              setOn((prev) => ({ ...prev, [r.id]: next }));
              toast(next ? `Alerte « ${r.label} » activée` : `Alerte « ${r.label} » désactivée`);
            }}
          />
        </div>
      ))}
    </div>
  );
}
