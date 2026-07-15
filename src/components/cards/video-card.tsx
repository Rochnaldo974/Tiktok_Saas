'use client';

import type { Video } from '@/lib/data';
import { fmt, dur, ago } from '@/lib/data';
import { avatarStyle } from '@/lib/visuals';
import { ThumbBg } from '@/components/cards/thumb';
import { Up, Play, Eye, Heart, Sparkle, Music, Comment, Share } from '@/components/icons';
import { openTrendPanel } from '@/components/trend-panel';

export function VideoCard({
  video: v,
  delay = 0,
  outside = false,
}: {
  video: Video;
  delay?: number;
  /* Vrai quand la vidéo sort des niches suivies par l'utilisateur. */
  outside?: boolean;
}) {
  return (
    <article className="card video-card reveal" style={{ animationDelay: `${delay}ms` }}>
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
          <span className="badge" style={{ position: 'absolute', bottom: '38%' }}>
            {v.real ? 'Ouvrir sur TikTok' : 'Voir sur TikTok'}
          </span>
        </div>
        <div className="tt-rail" aria-hidden="true">
          <span className="avatar-sm" style={avatarStyle(v.creator.hue)}>{v.creator.initials}</span>
          <span className="tt-act"><Heart /><span className="num">{fmt(v.likes)}</span></span>
          <span className="tt-act"><Comment /><span className="num">{fmt(v.comments)}</span></span>
          <span className="tt-act"><Share /><span className="num">{fmt(v.shares)}</span></span>
        </div>
        <div className="thumb-bottom" style={{ right: 52 }}>
          <div className="thumb-title">{v.title}</div>
          <div className="thumb-meta">
            <span>{v.niche}</span><span>·</span><span>{v.country}</span><span>·</span><span>{ago(v.uploadedH)}</span>
          </div>
        </div>
      </a>
      <div className="video-body">
        <div className="creator-line">
          <span className="avatar-sm" style={{ width: 26, height: 26, fontSize: 9, ...avatarStyle(v.creator.hue) }}>
            {v.creator.initials}
          </span>
          <span className="who">{v.creator.handle}</span>
          {v.creator.followers > 0 && <span className="what">· {fmt(v.creator.followers)} abonnés</span>}
        </div>
        <div className="video-stats">
          <span><Eye />{fmt(v.views)}</span>
          <span><Heart />{fmt(v.likes)}</span>
          <span className="up"><Up />Viral {v.viralScore}</span>
        </div>
        <div className="ai-note">
          <Sparkle />
          <span>{v.summary} <strong>{v.context}</strong></span>
        </div>
        <div className="chip-row">
          {outside && <span className="chip warn">Hors de vos niches</span>}
          <span className="chip"><Music /> {v.sound.name}</span>
          <span className="chip">Hook : {v.hook.type}</span>
        </div>
        <div className="card-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => openTrendPanel(v, 'analyse')}>
            Analyser
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openTrendPanel(v, 'script')}>
            Créer ma version
          </button>
        </div>
      </div>
    </article>
  );
}
