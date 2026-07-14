'use client';

import type { Video } from '@/lib/data';
import { fmt, dur, ago } from '@/lib/data';
import { avatarStyle } from '@/lib/visuals';
import { ThumbBg } from '@/components/cards/thumb';
import { Up, Play, Eye, Heart, Sparkle, Music } from '@/components/icons';
import { toast } from '@/components/toaster';

export function VideoCard({ video: v, delay = 0 }: { video: Video; delay?: number }) {
  return (
    <article className="card video-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="thumb">
        <ThumbBg hue={v.hue} angle={v.angle} id={v.id} />
        <div className="thumb-top">
          <span className="badge green"><Up /> +{v.growth}%</span>
          <span className="badge">{dur(v.duration)}</span>
        </div>
        <div className="play-hint">
          <span className="circle"><Play /></span>
        </div>
        <div className="thumb-bottom">
          <div className="thumb-title">{v.title}</div>
          <div className="thumb-meta">
            <span>{v.niche}</span><span>·</span><span>{v.country}</span><span>·</span><span>{ago(v.uploadedH)}</span>
          </div>
        </div>
      </div>
      <div className="video-body">
        <div className="creator-line">
          <span className="avatar-sm" style={{ width: 26, height: 26, fontSize: 9, ...avatarStyle(v.creator.hue) }}>
            {v.creator.initials}
          </span>
          <span className="who">{v.creator.handle}</span>
          <span className="what">· {fmt(v.creator.followers)} followers</span>
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
          <span className="chip"><Music /> {v.sound.name}</span>
          <span className="chip">Hook: {v.hook.type}</span>
        </div>
        <div className="card-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => toast(`Analysis for “${v.title}” is being prepared`)}
          >
            Analyze
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => toast('Script draft added to your ideas')}
          >
            Create my version
          </button>
        </div>
      </div>
    </article>
  );
}
