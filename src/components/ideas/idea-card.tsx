'use client';

import type { Video } from '@/lib/data';
import { fmt, dur, ago, STATUS_LABELS, DIFFICULTY_LABELS, SATURATION_LABELS } from '@/lib/data';
import { avatarStyle } from '@/lib/visuals';
import { ThumbBg } from '@/components/cards/thumb';
import { Up, Play, Sparkle, Check, Copy, Wand } from '@/components/icons';
import { toast } from '@/components/toaster';
import { openTrendPanel } from '@/components/trend-panel';

export function IdeaCard({ video: v, delay = 0 }: { video: Video; delay?: number }) {
  return (
    <article className="card idea-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <a
        className="thumb"
        href={`https://www.tiktok.com/search?q=${encodeURIComponent(v.title)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Voir les vidéos de ce sujet sur TikTok"
        aria-label={`Voir les vidéos « ${v.title} » sur TikTok`}
        style={{ display: 'block', cursor: 'pointer' }}
      >
        <ThumbBg hue={v.hue} angle={v.angle} id={v.id} />
        <div className="thumb-top">
          <span className="badge green"><Up /> +{v.growth} %</span>
          <span className="badge">{dur(v.duration)}</span>
        </div>
        <div className="play-hint">
          <span className="circle"><Play /></span>
          <span className="badge" style={{ position: 'absolute', bottom: '38%' }}>Voir sur TikTok</span>
        </div>
        <div className="thumb-bottom">
          <div className="thumb-meta">
            <span>{v.niche}</span><span>·</span><span>{ago(v.uploadedH)}</span>
          </div>
        </div>
      </a>

      <div className="idea-body">
        <div className="idea-head">
          <div style={{ minWidth: 0 }}>
            <h3 className="idea-title">{v.title}</h3>
            <div className="creator-line" style={{ marginTop: 8 }}>
              <span className="avatar-sm" style={{ width: 24, height: 24, fontSize: 8, ...avatarStyle(v.creator.hue) }}>
                {v.creator.initials}
              </span>
              <span className="who">{v.creator.handle}</span>
              <span className="what">· {fmt(v.views)} vues · {v.contentType}</span>
            </div>
          </div>
          <span className={`status-tag status-${v.status}`}>{STATUS_LABELS[v.status]}</span>
        </div>

        <div className="fact-row">
          <div className="fact"><b className="up">{v.viralScore}/100</b><span>Score viral</span></div>
          <div className="fact"><b>{v.prodTime} · {DIFFICULTY_LABELS[v.difficulty]}</b><span>Production</span></div>
          <div className="fact"><b>{SATURATION_LABELS[v.saturation]}</b><span>Saturation</span></div>
        </div>

        <div className="ai-note">
          <Sparkle />
          <span>{v.summary} <strong>{v.context}</strong></span>
        </div>

        <div className="copy-list">
          <h5>Votre version, en 3 étapes</h5>
          <ul>
            <li className="yes"><Check /> Ouvrir avec : « {v.hook.text} »</li>
            <li className="yes"><Check /> Filmer avec le son « {v.sound.name} » — {v.prodReason.toLowerCase()}</li>
            <li className="yes"><Check /> Conclure avec : « {v.cta} »</li>
          </ul>
        </div>

        <div className="card-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              navigator.clipboard?.writeText(v.hook.text);
              toast('Hook copié dans le presse-papiers');
            }}
          >
            <Copy /> Copier le hook
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openTrendPanel(v, 'script')}>
            <Wand /> Créer mon script
          </button>
        </div>
      </div>
    </article>
  );
}
