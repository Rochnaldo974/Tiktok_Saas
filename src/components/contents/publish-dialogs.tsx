'use client';

import { useEffect, useRef, useState } from 'react';
import type { PerformanceMetrics } from '@/lib/content/types';
import { X } from '@/components/icons';

/* Dialogues du cycle de publication. Signal ne publie PAS sur TikTok :
   l'utilisateur publie lui-même puis le confirme ici. Le lien et les
   métriques sont facultatifs — saisie manuelle, source « manual ». */

function DialogShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="overlay open" onClick={onClose} aria-hidden="true" style={{ zIndex: 'var(--z-modal)' }} />
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="dialog-head">
          <h3>{title}</h3>
          <button className="icon-btn" aria-label="Fermer" onClick={onClose}><X /></button>
        </div>
        {children}
      </div>
    </>
  );
}

export function PublishDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (url: string | null) => void;
}) {
  const [url, setUrl] = useState('');
  const valid = !url || /^https:\/\/(www\.|vm\.)?tiktok\.com\//.test(url);
  return (
    <DialogShell title="Marquer comme publiée" onClose={onClose}>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.55 }}>
        Vous avez publié la vidéo sur TikTok ? Collez son lien si vous voulez le retrouver
        ici — c&apos;est facultatif.
      </p>
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="pub-url">Lien TikTok (facultatif)</label>
        <input
          id="pub-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.tiktok.com/@vous/video/…"
          inputMode="url"
        />
        {!valid && <p style={{ color: 'var(--orange)', fontSize: 12, marginTop: 6 }}>Ce lien ne ressemble pas à une URL TikTok.</p>}
      </div>
      <div className="card-actions" style={{ marginTop: 18 }}>
        <button className="btn btn-primary" disabled={!valid} onClick={() => onConfirm(url.trim() || null)}>
          Confirmer la publication
        </button>
        <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </DialogShell>
  );
}

const METRIC_FIELDS: { key: keyof Omit<PerformanceMetrics, 'source' | 'recordedAt'>; label: string }[] = [
  { key: 'views', label: 'Vues' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Commentaires' },
  { key: 'shares', label: 'Partages' },
  { key: 'followersGained', label: 'Nouveaux abonnés' },
  { key: 'leads', label: 'Prospects / ventes' },
];

export function MetricsDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (metrics: PerformanceMetrics) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const hasAny = Object.values(values).some((v) => v.trim() !== '');

  function confirm() {
    const metrics: PerformanceMetrics = {
      views: null,
      likes: null,
      comments: null,
      shares: null,
      followersGained: null,
      leads: null,
      source: 'manual',
      recordedAt: new Date().toISOString(),
    };
    for (const f of METRIC_FIELDS) {
      const raw = (values[f.key] ?? '').replace(/[^\d]/g, '');
      if (raw !== '') metrics[f.key] = Number(raw);
    }
    onConfirm(metrics);
  }

  return (
    <DialogShell title="Vos premiers résultats" onClose={onClose}>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.55 }}>
        Recopiez les chiffres visibles sur TikTok. Remplissez seulement ce que vous connaissez —
        Signal en tire des pistes, jamais des certitudes.
      </p>
      <div className="metrics-grid">
        {METRIC_FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`m-${f.key}`}>{f.label}</label>
            <input
              id={`m-${f.key}`}
              inputMode="numeric"
              placeholder="—"
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="card-actions" style={{ marginTop: 18 }}>
        <button className="btn btn-primary" disabled={!hasAny} onClick={confirm}>
          Enregistrer les résultats
        </button>
        <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
      </div>
    </DialogShell>
  );
}
