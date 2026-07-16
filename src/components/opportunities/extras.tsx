'use client';

import type { Hook, Sound, Video } from '@/lib/data';
import { fmt, dur } from '@/lib/data';
import { artworkStyle } from '@/lib/visuals';
import { Music, Copy, Wand } from '@/components/icons';
import { toast } from '@/components/toaster';
import { openAdaptation } from '@/components/adaptation/adaptation-flow';

/* Sons et hooks ne sont plus des sections autonomes : ils vivent dans
   Opportunités avec une action utile — chaque élément débouche sur la
   préparation d'un contenu. */

function videoFor(videos: Video[], niche?: string): Video | null {
  if (!videos.length) return null;
  return (niche && videos.find((v) => v.niche === niche)) || videos[0];
}

export function SoundOpportunities({ sounds, videos }: { sounds: Sound[]; videos: Video[] }) {
  if (!sounds.length) return null;
  return (
    <section aria-labelledby="opp-sounds-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">Radar audio</p>
          <h2 className="section-title" id="opp-sounds-title">Sons à prendre maintenant</h2>
          <p className="section-sub">Chaque son débouche sur une idée prête à préparer.</p>
        </div>
      </div>
      <div className="sound-grid">
        {sounds.slice(0, 6).map((s, i) => {
          const source = videoFor(videos, undefined);
          return (
            <article className="card sound-card reveal" key={s.id} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="sound-top">
                <div className="artwork" style={artworkStyle(s.hue)}>
                  {s.cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={s.cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    <Music />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="sound-name">{s.name}</div>
                  <div className="sound-artist">{s.artist} · {dur(s.duration)}</div>
                </div>
              </div>
              <div className="sound-meta">
                {s.real ? (
                  <>
                    <span className="up">{s.trendCount} tendance{(s.trendCount ?? 0) > 1 ? 's' : ''} cette semaine</span>
                    {s.videos > 0 && <span>{fmt(s.videos)} vidéos au total</span>}
                    <span className="chip cyan" style={{ marginLeft: 'auto' }}>Réel</span>
                  </>
                ) : (
                  <>
                    <span className="up">+{s.growth} % de croissance</span>
                    <span>{fmt(s.videos)} vidéos</span>
                  </>
                )}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{s.note}</p>
              <div className="card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (!source) return;
                    openAdaptation(source, `une vidéo sur le son « ${s.name} »`);
                  }}
                  disabled={!source}
                >
                  <Wand /> Créer une idée avec ce son
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HookOpportunities({ hooks, videos }: { hooks: Hook[]; videos: Video[] }) {
  if (!hooks.length) return null;
  return (
    <section aria-labelledby="opp-hooks-title">
      <div className="section-head">
        <div>
          <p className="eyebrow">Ingénierie de rétention</p>
          <h2 className="section-title" id="opp-hooks-title">Hooks qui retiennent</h2>
          <p className="section-sub">Copiez-les, ou adaptez-les directement à votre niche.</p>
        </div>
      </div>
      <div className="hook-grid">
        {hooks.slice(0, 6).map((h, i) => {
          const source = videoFor(videos, h.industries[0]);
          return (
            <article className="card hook-card reveal" key={h.id} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="chip-row">
                <span className="chip hot">{h.type}</span>
                {h.industries.slice(0, 2).map((n) => <span key={n} className="chip">{n}</span>)}
                {h.real && <span className="chip cyan" style={{ marginLeft: 'auto' }}>Réel</span>}
              </div>
              <p className="hook-text">{h.text}</p>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>{h.explanation}</p>
              <div className="card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(h.text);
                    toast('Hook copié dans le presse-papiers');
                  }}
                >
                  <Copy /> Copier
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (!source) return;
                    openAdaptation(source, `une vidéo qui ouvre sur « ${h.text.slice(0, 60)} »`);
                  }}
                  disabled={!source}
                >
                  <Wand /> Adapter à ma niche
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
