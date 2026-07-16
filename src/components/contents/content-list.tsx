'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { GeneratedContent, ScheduleBucket } from '@/lib/content/types';
import { BUCKET_LABELS } from '@/lib/content/types';
import {
  CONTENT_STATUS_LABELS,
  SECTION_LABELS,
  SECTION_ORDER,
  STATUS_META,
  sectionOf,
  type ContentSection,
  type CtaKind,
} from '@/lib/content/status';
import {
  duplicateContent,
  removeContent,
  setContentStatus,
  updateContent,
} from '@/lib/content/store';
import { useContents, useHydrated } from '@/lib/content/use-store';
import { deriveInsights } from '@/lib/content/insights';
import { track } from '@/lib/analytics';
import { toast } from '@/components/toaster';
import { Film, Check, X, Calendar, Sparkle } from '@/components/icons';
import { PublishDialog, MetricsDialog } from './publish-dialogs';

/* Mes contenus : tout le cycle au même endroit, groupé par étape.
   Le CTA de chaque carte dépend du statut (machine d'états). Stocké en
   localStorage — aucun compte requis, la page n'est jamais bloquée. */

const SECTION_HINTS: Record<ContentSection, string> = {
  prepare: 'Scripts à terminer avant tournage.',
  film: 'Prêts à tourner — ouvrez le script et lancez-vous.',
  review: 'Vidéos tournées, à vérifier avant publication.',
  publish: 'Il ne reste qu’à publier.',
  published: 'Publiées — ajoutez vos résultats pour en tirer des enseignements.',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function bucketDate(bucket: ScheduleBucket): string {
  const d = new Date();
  if (bucket === 'this_week') d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 3));
  if (bucket === 'later') d.setDate(d.getDate() + 10);
  return d.toISOString().slice(0, 10);
}

function ScheduleMenu({ content }: { content: GeneratedContent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-secondary btn-sm" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Calendar /> {content.scheduledDate ? fmtDate(content.scheduledDate) : 'Planifier'}
      </button>
      {open && (
        <div className="menu" role="menu" style={{ minWidth: 200 }}>
          {(Object.keys(BUCKET_LABELS) as ScheduleBucket[]).map((b) => (
            <button
              key={b}
              role="menuitem"
              className={content.scheduledBucket === b ? 'on' : ''}
              onClick={() => {
                updateContent(content.id, { scheduledBucket: b, scheduledDate: bucketDate(b) });
                track('content_scheduled', { bucket: b });
                toast(`Planifié : ${BUCKET_LABELS[b].toLowerCase()}`);
                setOpen(false);
              }}
            >
              {BUCKET_LABELS[b]}
            </button>
          ))}
          <label style={{ display: 'block', padding: '8px 12px', fontSize: 12, color: 'var(--faint)' }}>
            Date précise
            <input
              type="date"
              style={{ display: 'block', marginTop: 6, width: '100%' }}
              value={content.scheduledDate ?? ''}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                if (!e.target.value) return;
                updateContent(content.id, { scheduledBucket: 'later', scheduledDate: e.target.value });
                track('content_scheduled', { bucket: 'date' });
                setOpen(false);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function ContentCard({ content: c, delay }: { content: GeneratedContent; delay: number }) {
  const router = useRouter();
  const [publishOpen, setPublishOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const meta = STATUS_META[c.status];

  function run(kind: CtaKind) {
    switch (kind) {
      case 'open_script':
      case 'finish_script':
        router.push(`/contenus/${c.id}`);
        break;
      case 'mark_ready':
        setContentStatus(c.id, 'script_ready');
        track('content_marked_ready', {});
        toast('Script marqué prêt à tourner');
        break;
      case 'start_filming':
        setContentStatus(c.id, 'filming');
        break;
      case 'mark_filmed': {
        if (c.status === 'script_ready' || c.status === 'to_film') setContentStatus(c.id, 'filming');
        setContentStatus(c.id, 'video_uploaded');
        track('content_marked_filmed', {});
        toast('Marquée comme tournée — vérifiez-la avant de publier');
        break;
      }
      case 'verify_video':
        router.push(`/contenus/${c.id}/verifier`);
        break;
      case 'skip_review':
        setContentStatus(c.id, 'ready_to_publish');
        toast('Vérification passée — prête à publier');
        break;
      case 'view_corrections':
        router.push(`/contenus/${c.id}/verifier`);
        track('review_issue_opened', {});
        break;
      case 'mark_corrected':
        setContentStatus(c.id, 'ready_to_publish');
        toast('Marquée comme corrigée');
        break;
      case 'mark_published':
        setPublishOpen(true);
        break;
      case 'add_metrics':
        setMetricsOpen(true);
        break;
      case 'view_insights':
        setInsightsOpen((v) => !v);
        track('performance_insights_viewed', {});
        break;
      case 'duplicate': {
        const copy = duplicateContent(c.id);
        if (copy) {
          toast('Variante créée dans « À tourner »');
          track('next_content_started', { from: c.id });
        }
        break;
      }
    }
  }

  return (
    <article className="card content-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="idea-head">
        <div style={{ minWidth: 0 }}>
          <h3 className="idea-title" style={{ fontSize: 17 }}>
            <Link href={`/contenus/${c.id}`}>{c.title}</Link>
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>« {c.hook} »</p>
        </div>
        <span className="status-tag">{CONTENT_STATUS_LABELS[c.status]}</span>
      </div>
      <div className="content-meta">
        <span>{c.duration} s</span>
        <span>· {c.productionTime}</span>
        <span>· {c.niche}</span>
        {c.scheduledDate ? <span>· prévu {fmtDate(c.scheduledDate)}</span> : null}
        {c.sourceTitle ? <span className="content-source">· depuis « {c.sourceTitle.slice(0, 40)}{c.sourceTitle.length > 40 ? '…' : ''} »</span> : null}
      </div>
      <p style={{ color: 'var(--faint)', fontSize: 12.5 }}>{meta.message}</p>

      {c.status === 'corrections_needed' && c.videoReview ? (
        <ul className="review-issues">
          {c.videoReview.issues.map((issue) => (
            <li key={issue}><X style={{ width: 12, height: 12, color: 'var(--orange)' }} /> {issue}</li>
          ))}
        </ul>
      ) : null}

      {insightsOpen && c.performanceInsights.length ? (
        <div className="ai-note" style={{ display: 'grid', gap: 6 }}>
          {c.performanceInsights.map((ins) => (
            <span key={ins} style={{ display: 'flex', gap: 8 }}><Sparkle style={{ flex: 'none' }} /> {ins}</span>
          ))}
        </div>
      ) : null}

      <div className="card-actions" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={() => run(meta.primaryCta.kind)}>
          {meta.primaryCta.label}
        </button>
        {meta.secondary.map((s) => (
          <button key={s.kind} className="btn btn-secondary btn-sm" onClick={() => run(s.kind)}>
            {s.label}
          </button>
        ))}
        {sectionOf(c.status) !== 'published' && <ScheduleMenu content={c} />}
        <button className="btn btn-ghost btn-sm" onClick={() => run('duplicate')}>Dupliquer</button>
        <button
          className="btn btn-ghost btn-sm"
          aria-label={`Supprimer « ${c.title} »`}
          onClick={() => {
            if (window.confirm('Supprimer ce contenu ? Cette action est définitive.')) {
              removeContent(c.id);
              toast('Contenu supprimé');
            }
          }}
        >
          Supprimer
        </button>
      </div>

      {publishOpen && (
        <PublishDialog
          onClose={() => setPublishOpen(false)}
          onConfirm={(url) => {
            if (c.status === 'video_uploaded' || c.status === 'review_in_progress') {
              setContentStatus(c.id, 'ready_to_publish');
            }
            setContentStatus(c.id, 'published');
            if (url) updateContent(c.id, { publishedUrl: url });
            track('content_marked_published', {});
            track('daily_content_completed', {});
            toast('Bravo — contenu marqué comme publié');
            setPublishOpen(false);
          }}
        />
      )}
      {metricsOpen && (
        <MetricsDialog
          onClose={() => setMetricsOpen(false)}
          onConfirm={(metrics) => {
            const insights = deriveInsights(c, metrics);
            updateContent(c.id, { performanceMetrics: metrics, performanceInsights: insights });
            if (c.status === 'published') setContentStatus(c.id, 'performance_pending');
            setContentStatus(c.id, 'performance_available');
            track('publication_metrics_added', {});
            toast('Résultats enregistrés — enseignements disponibles');
            setMetricsOpen(false);
            setInsightsOpen(true);
          }}
        />
      )}
    </article>
  );
}

export function ContentList({ loggedIn }: { loggedIn: boolean }) {
  const contents = useContents();
  const hydrated = useHydrated();
  const [filter, setFilter] = useState<ContentSection | ''>('');

  if (!hydrated) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--r-lg)' }} />
        ))}
      </div>
    );
  }

  const visible = contents.filter((c) => c.status !== 'archived');

  if (!visible.length) {
    return (
      <div className="empty">
        <Film />
        <h4>Créez votre premier contenu</h4>
        <p>Choisissez une opportunité et Signal la transformera en script adapté à votre activité.</p>
        <Link className="btn btn-primary" href="/opportunites">Trouver une opportunité</Link>
      </div>
    );
  }

  const bySection = new Map<ContentSection, GeneratedContent[]>();
  for (const c of visible) {
    const section = sectionOf(c.status);
    bySection.set(section, [...(bySection.get(section) ?? []), c]);
  }

  return (
    <div style={{ display: 'grid', gap: 40 }}>
      {/* filtre de statut — remplace des onglets trop étroits sur mobile */}
      <div className="filter-bar">
        <button className={`pill${!filter ? ' on' : ''}`} onClick={() => setFilter('')}>
          Tout ({visible.length})
        </button>
        {SECTION_ORDER.filter((s) => bySection.has(s)).map((s) => (
          <button
            key={s}
            className={`pill${filter === s ? ' on' : ''}`}
            onClick={() => setFilter(filter === s ? '' : s)}
          >
            {SECTION_LABELS[s]} ({bySection.get(s)!.length})
          </button>
        ))}
      </div>

      {!loggedIn && visible.length >= 3 && (
        <div className="card rail-card" style={{ borderColor: 'rgba(37,244,238,0.25)' }}>
          <h4><Check style={{ width: 13, height: 13 }} /> Vous avez créé {visible.length} contenus</h4>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
            Créez un compte pour les retrouver sur tous vos appareils. Rien ne presse — tout
            reste disponible ici.
          </p>
          <Link className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} href="/connexion">
            Créer un compte
          </Link>
        </div>
      )}

      {SECTION_ORDER.filter((s) => bySection.has(s) && (!filter || filter === s)).map((section) => (
        <section key={section} aria-label={SECTION_LABELS[section]}>
          <div className="content-section-head">
            <h2 className="section-title" style={{ fontSize: 19 }}>{SECTION_LABELS[section]}</h2>
            <span>{bySection.get(section)!.length}</span>
          </div>
          <p className="section-sub" style={{ marginBottom: 14 }}>{SECTION_HINTS[section]}</p>
          <div style={{ display: 'grid', gap: 14 }}>
            {bySection.get(section)!.map((c, i) => (
              <ContentCard key={c.id} content={c} delay={i * 40} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
