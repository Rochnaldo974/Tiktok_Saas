'use client';

import type { Sound } from '@/lib/data';
import { fmt, dur } from '@/lib/data';
import { artworkStyle } from '@/lib/visuals';
import { Music, Save } from '@/components/icons';
import { saveItem } from '@/lib/library';

export function SoundCard({ sound: s, delay = 0 }: { sound: Sound; delay?: number }) {
  return (
    <article className="card sound-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="sound-top">
        <div className="artwork" style={artworkStyle(s.hue)}>
          <Music />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="sound-name">{s.name}</div>
          <div className="sound-artist">{s.artist} · {dur(s.duration)}</div>
        </div>
        <div className="eq" aria-hidden="true"><i /><i /><i /><i /></div>
      </div>
      <div className="sound-meta">
        <span className="up">+{s.growth} % de croissance</span>
        <span>{fmt(s.videos)} vidéos</span>
        {s.rising && <span className="chip hot" style={{ marginLeft: 'auto' }}>Fenêtre de tir</span>}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>{s.note}</p>
      <div className="card-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() =>
            saveItem(
              'sound',
              s.id,
              { name: s.name, artist: s.artist, growth: s.growth, videos: s.videos, note: s.note },
              `« ${s.name} » ajouté à votre bibliothèque`,
            )
          }
        >
          <Save /> Sauvegarder le son
        </button>
      </div>
    </article>
  );
}
