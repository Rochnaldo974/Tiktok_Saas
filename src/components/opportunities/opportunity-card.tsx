'use client';

import type { Video } from '@/lib/data';
import { fmt, dur, ago, STATUS_LABELS, DIFFICULTY_LABELS, SATURATION_LABELS } from '@/lib/data';
import { avatarStyle } from '@/lib/visuals';
import { ThumbBg } from '@/components/cards/thumb';
import { Up, Play, Sparkle, Wand, Heart, Comment, Share } from '@/components/icons';
import { openTrendPanel } from '@/components/trend-panel';
import { openAdaptation } from '@/components/adaptation/adaptation-flow';
import {
  computeOpportunityScore,
  personalReason,
  LEVEL_LABELS,
  SCORE_TOOLTIP,
  type ScoreContext,
} from '@/lib/content/opportunity-score';
import { useProfile } from '@/lib/content/use-store';
import { track } from '@/lib/analytics';

/* Carte d'opportunité : hiérarchie stricte — concept, Score
   d'opportunité, statut, raison personnalisée, temps, saturation.
   Le reste (stats, hook, son, structure) vit dans le panneau détail. */

export function OpportunityCard({
  video: v,
  delay = 0,
  tagLabel,
  fallbackNiches = [],
}: {
  video: Video;
  delay?: number;
  /* étiquette de classement (« Meilleure opportunité »...) */
  tagLabel?: string;
  /* niches suivies côté serveur, avant hydratation du profil */
  fallbackNiches?: string[];
}) {
  const profile = useProfile();
  const ctx: ScoreContext = profile
    ? {
        niches: [profile.primaryNiche, ...profile.secondaryNiches].filter(Boolean),
        primaryNiche: profile.primaryNiche || null,
        goal: profile.primaryGoal,
      }
    : { niches: fallbackNiches, primaryNiche: fallbackNiches[0] ?? null, goal: null };
  const score = computeOpportunityScore(v, ctx);
  const reason = personalReason(v, ctx);

  return (
    <article className="card idea-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <a
        className="thumb"
        href={v.url ?? `https://www.tiktok.com/search?q=${encodeURIComponent(v.title)}`}
        target="_blank"
        rel="noopener noreferrer"
        title={v.real ? 'Ouvrir la vidéo sur TikTok' : 'Voir les vidéos de ce sujet sur TikTok'}
        aria-label={`Ouvrir « ${v.title} » sur TikTok`}
        style={{ display: 'block', cursor: 'pointer' }}
      >
        {v.cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={v.cover} alt="" className="thumb-bg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <ThumbBg hue={v.hue} angle={v.angle} id={v.id} />
        )}
        <div className="thumb-top">
          <span className="badge green"><Up /> +{v.growth} %</span>
          <span style={{ display: 'flex', gap: 6 }}>
            {v.real && <span className="badge cyan">Réel</span>}
            <span className="badge">{dur(v.duration)}</span>
          </span>
        </div>
        <div className="play-hint">
          <span className="circle"><Play /></span>
        </div>
        <div className="tt-rail" aria-hidden="true">
          <span className="avatar-sm" style={avatarStyle(v.creator.hue)}>{v.creator.initials}</span>
          <span className="tt-act"><Heart /><span className="num">{fmt(v.likes)}</span></span>
          <span className="tt-act"><Comment /><span className="num">{fmt(v.comments)}</span></span>
          <span className="tt-act"><Share /><span className="num">{fmt(v.shares)}</span></span>
        </div>
        <div className="thumb-bottom" style={{ right: 52 }}>
          <div className="thumb-meta">
            <span>{v.niche}</span><span>·</span><span>{ago(v.uploadedH)}</span>
          </div>
        </div>
      </a>

      <div className="idea-body">
        {tagLabel ? <p className="eyebrow" style={{ marginBottom: -4 }}>{tagLabel}</p> : null}
        <div className="idea-head">
          <div style={{ minWidth: 0 }}>
            <h3 className="idea-title">{v.title}</h3>
            <div className="creator-line" style={{ marginTop: 8 }}>
              <span className="who">{v.creator.handle}</span>
              <span className="what">· {fmt(v.views)} vues · {v.contentType}</span>
            </div>
          </div>
          <span className={`status-tag status-${v.status}`}>{STATUS_LABELS[v.status]}</span>
        </div>

        <div className="fact-row">
          <div
            className="fact"
            title={SCORE_TOOLTIP}
            aria-label={`Score d'opportunité : ${score.score} sur 100 — ${LEVEL_LABELS[score.level]}. ${SCORE_TOOLTIP}`}
          >
            <b className={`score-badge ${score.level}`}>{score.score}/100</b>
            <span>Score d&apos;opportunité</span>
          </div>
          <div className="fact"><b>{v.prodTime} · {DIFFICULTY_LABELS[v.difficulty]}</b><span>Production</span></div>
          <div className="fact"><b>{SATURATION_LABELS[v.saturation]}</b><span>Saturation</span></div>
        </div>

        <div className="ai-note">
          <Sparkle />
          <span><strong>Pour vous :</strong> {reason}</span>
        </div>

        <div className="card-actions">
          <button className="btn btn-primary btn-sm" onClick={() => openAdaptation(v)}>
            <Wand /> Adapter cette idée
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              track('opportunity_opened', { id: v.id, real: Boolean(v.real) });
              openTrendPanel(v, 'analyse');
            }}
          >
            Comprendre pourquoi
          </button>
        </div>
      </div>
    </article>
  );
}
