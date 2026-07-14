'use client';

import type { Video } from '@/lib/data';
import { fmt, dur, ago, STATUS_LABELS, DIFFICULTY_LABELS, SATURATION_LABELS } from '@/lib/data';
import { avatarStyle } from '@/lib/visuals';
import { ThumbBg } from '@/components/cards/thumb';
import { Up, Play, Sparkle, Music, Check, X, Copy, Wand } from '@/components/icons';
import { toast } from '@/components/toaster';

export function IdeaCard({ video: v, delay = 0 }: { video: Video; delay?: number }) {
  return (
    <article className="card idea-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="thumb">
        <ThumbBg hue={v.hue} angle={v.angle} id={v.id} />
        <div className="thumb-top">
          <span className="badge green"><Up /> +{v.growth} %</span>
          <span className="badge">{dur(v.duration)}</span>
        </div>
        <div className="play-hint">
          <span className="circle"><Play /></span>
        </div>
        <div className="thumb-bottom">
          <div className="thumb-meta">
            <span>{v.niche}</span><span>·</span><span>{ago(v.uploadedH)}</span>
          </div>
        </div>
      </div>

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
          <div className="fact"><b className="up">{v.viralScore}</b><span>Score viral</span></div>
          <div className="fact"><b>{v.opportunity}</b><span>Opportunité</span></div>
          <div className="fact"><b>{DIFFICULTY_LABELS[v.difficulty]}</b><span>Difficulté</span></div>
          <div className="fact"><b>{v.prodTime}</b><span>Production</span></div>
          <div className="fact"><b>{v.budget}</b><span>Budget</span></div>
          <div className="fact"><b>{SATURATION_LABELS[v.saturation]}</b><span>Saturation</span></div>
        </div>

        <div className="ai-note">
          <Sparkle />
          <span>{v.summary} <strong>{v.context}</strong></span>
        </div>

        <div className="chip-row">
          {v.chips.map((c) => <span key={c} className="chip good">{c}</span>)}
          <span className="chip"><Music /> {v.sound.name}</span>
          {v.emotions.map((e) => <span key={e} className="chip">{e}</span>)}
        </div>

        <div className="copy-list">
          <h5>Votre version</h5>
          <ul>
            <li className="yes"><Check /> Ouvrir avec : « {v.hook.text} »</li>
            <li className="yes"><Check /> {v.prodReason}</li>
            <li className="yes"><Check /> Conclure avec : « {v.cta} »</li>
            <li className="no"><X /> {v.satReason}</li>
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
          <button
            className="btn btn-primary btn-sm"
            onClick={() => toast('Brouillon de script ajouté à vos idées')}
          >
            <Wand /> Générer mon script
          </button>
        </div>
      </div>
    </article>
  );
}
