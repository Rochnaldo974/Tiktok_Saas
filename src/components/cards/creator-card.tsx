'use client';

import type { Creator } from '@/lib/data';
import { fmt } from '@/lib/data';
import { avatarStyle } from '@/lib/visuals';
import { Sparkle } from '@/components/icons';
import { toast } from '@/components/toaster';

export function CreatorCard({ creator: c, delay = 0 }: { creator: Creator; delay?: number }) {
  return (
    <article className="card creator-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="creator-head">
        <span className="avatar-sm avatar-lg" style={avatarStyle(c.hue)}>{c.initials}</span>
        <div style={{ minWidth: 0 }}>
          <div className="creator-handle">{c.handle}</div>
          <div className="chip-row" style={{ marginTop: 4 }}>
            <span className="chip">{c.niche}</span>
            <span className="chip good">+{c.growth}% this week</span>
          </div>
        </div>
      </div>
      <div className="creator-stats">
        <div className="cstat"><b>{fmt(c.followers)}</b><span>Followers</span></div>
        <div className="cstat"><b>{fmt(c.avgViews)}</b><span>Avg views</span></div>
        <div className="cstat"><b className="up">{c.engagement}%</b><span>Engage</span></div>
      </div>
      <div className="ai-note">
        <Sparkle />
        <span>{c.reason}</span>
      </div>
      <div className="card-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => toast(`Creator report for ${c.handle} is being prepared`)}
        >
          Full report
        </button>
      </div>
    </article>
  );
}
