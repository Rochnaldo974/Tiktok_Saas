'use client';

import { useEffect, useState } from 'react';
import type { Video } from '@/lib/data';
import { fmt, dur, STATUS_LABELS, DIFFICULTY_LABELS, SATURATION_LABELS } from '@/lib/data';
import {
  computeOpportunityScore,
  personalReason,
  LEVEL_LABELS,
  SCORE_TOOLTIP,
  type ScoreContext,
} from '@/lib/content/opportunity-score';
import { toggleSavedOpportunity } from '@/lib/content/store';
import { useProfile } from '@/lib/content/use-store';
import { openAdaptation } from '@/components/adaptation/adaptation-flow';
import { openCopilot } from '@/components/copilot/context-copilot';
import { track } from '@/lib/analytics';
import { toast } from '@/components/toaster';
import { X, Save, Sparkle, Music, Quote, Up, Wand, Check, Bolt } from '@/components/icons';

/* Panneau de détail d'une opportunité : comprendre pourquoi ça marche,
   pourquoi ça VOUS correspond, quoi reprendre et quoi personnaliser —
   puis agir (« Adapter cette idée »). Ouvrable depuis n'importe quelle
   carte via openTrendPanel() (événement global, pattern des toasts). */

type Tab = 'analyse' | 'script';
const PANEL_EVENT = 'signal:trend-panel';

export function openTrendPanel(video: Video, tab: Tab = 'analyse') {
  window.dispatchEvent(new CustomEvent(PANEL_EVENT, { detail: { video, tab } }));
}

export function TrendPanel() {
  const profile = useProfile();
  const [video, setVideo] = useState<Video | null>(null);
  const [open, setOpen] = useState(false);
  /* dérivé du profil (store) — pas d'état local à synchroniser */
  const saved = Boolean(video && profile?.savedOpportunityIds.includes(video.id));

  useEffect(() => {
    function onOpen(e: Event) {
      const { video, tab } = (e as CustomEvent<{ video: Video; tab: Tab }>).detail;
      /* L'ancien onglet « script » est devenu le parcours d'adaptation. */
      if (tab === 'script') {
        openAdaptation(video);
        return;
      }
      setVideo(video);
      setOpen(true);
      track('opportunity_opened', { id: video.id, real: Boolean(video.real) });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener(PANEL_EVENT, onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(PANEL_EVENT, onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!video) return null;
  const v = video;

  const ctx: ScoreContext = profile
    ? {
        niches: [profile.primaryNiche, ...profile.secondaryNiches].filter(Boolean),
        primaryNiche: profile.primaryNiche || null,
        goal: profile.primaryGoal,
      }
    : { niches: [], primaryNiche: null, goal: null };
  const score = computeOpportunityScore(v, ctx);

  function saveOpportunity() {
    const nowSaved = toggleSavedOpportunity(v.id);
    track('opportunity_saved', { id: v.id, saved: nowSaved });
    toast(nowSaved ? 'Opportunité enregistrée — retrouvez-la depuis Aujourd’hui' : 'Opportunité retirée');
  }

  return (
    <>
      <div className={`overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`panel${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={`Détail : ${v.title}`}>
        <div className="panel-head">
          <div className="row">
            <p className="eyebrow">{v.niche} · +{v.growth} % · {STATUS_LABELS[v.status]}</p>
            <button className="icon-btn" aria-label="Fermer" onClick={() => setOpen(false)}><X /></button>
          </div>
          <h2 className="panel-title">{v.title}</h2>
          <p className="panel-sub">
            {v.creator.handle} · {fmt(v.views)} vues · {dur(v.duration)} · {v.contentType}
          </p>
        </div>

        <div className="panel-body">
          {/* 1. Résumé + score */}
          <div className="gen-facts">
            <div className="gen-fact" title={SCORE_TOOLTIP}>
              <span>Score d&apos;opportunité</span>
              <b className={`score-badge ${score.level}`}>{score.score}/100 · {LEVEL_LABELS[score.level]}</b>
            </div>
            <div className="gen-fact"><span>Production</span><b>{v.prodTime} · {DIFFICULTY_LABELS[v.difficulty]}</b></div>
            <div className="gen-fact"><span>Saturation</span><b>{SATURATION_LABELS[v.saturation]}</b></div>
            <div className="gen-fact"><span>Engagement</span><b>{fmt(v.likes)} likes · {fmt(v.comments)} comm.</b></div>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: -8 }}>{SCORE_TOOLTIP}</p>

          {/* 2. Pourquoi cela fonctionne */}
          <div className="script-block">
            <h5>Pourquoi cela fonctionne</h5>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>{v.summary} {v.context}</p>
            <div className="chip-row" style={{ marginTop: 10 }}>
              {v.chips.map((c) => <span key={c} className="chip good">{c}</span>)}
              {v.emotions.map((e) => <span key={e} className="chip">{e}</span>)}
            </div>
          </div>

          {/* 3. Pourquoi cela vous correspond */}
          <div className="script-block">
            <h5>Pourquoi cela vous correspond</h5>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
              <Sparkle style={{ width: 13, height: 13, display: 'inline', verticalAlign: '-2px', color: 'var(--live)' }} />{' '}
              {personalReason(v, ctx)}
            </p>
          </div>

          {/* 4. Ce que vous pouvez reprendre */}
          <div className="script-block">
            <h5>Ce que vous pouvez reprendre</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 7 }}>
              <li style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--muted)' }}>
                <Check style={{ width: 14, height: 14, color: 'var(--green)', flex: 'none', marginTop: 2 }} />
                La structure : {v.contentType.toLowerCase()}, {dur(v.duration)}, rythme des coupes
              </li>
              <li style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--muted)' }}>
                <Check style={{ width: 14, height: 14, color: 'var(--green)', flex: 'none', marginTop: 2 }} />
                Le type de hook ({v.hook.type.toLowerCase()}) et sa promesse d&apos;ouverture
              </li>
              <li style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--muted)' }}>
                <Check style={{ width: 14, height: 14, color: 'var(--green)', flex: 'none', marginTop: 2 }} />
                La mécanique du CTA : « {v.cta} »
              </li>
            </ul>
          </div>

          {/* 5. Ce que vous devez personnaliser */}
          <div className="script-block">
            <h5>Ce que vous devez personnaliser</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 7 }}>
              {[
                'Votre point de vue et vos exemples — jamais ceux du créateur d’origine',
                'Le message : reliez-le à votre expertise et votre audience',
                'Votre identité visuelle (décor, incrustations, ton)',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--muted)' }}>
                  <Wand style={{ width: 14, height: 14, color: 'var(--accent)', flex: 'none', marginTop: 2 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Ingrédients : son + hook */}
          <div className="rail-row">
            <span className="k"><Music /> Son à utiliser</span>
            <span className="v">« {v.sound.name} »{v.sound.real && v.sound.trendCount ? <small>{v.sound.trendCount} tendance{v.sound.trendCount > 1 ? 's' : ''} cette semaine</small> : null}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Quote /> Hook d&apos;ouverture</span>
            <span className="v" style={{ maxWidth: 280 }}>« {v.hook.text} »<small>{v.hook.real ? `accroche réelle de la vidéo · ${v.hook.performance} % de likes` : v.hook.explanation}</small></span>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a
              className="section-link"
              href={v.url ?? `https://www.tiktok.com/search?q=${encodeURIComponent(v.title)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {v.real ? 'Voir la vidéo source sur TikTok' : 'Voir les vidéos de ce sujet sur TikTok'} <Up />
            </a>
            <button
              className="section-link"
              style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit', padding: 0 }}
              onClick={() => openCopilot('opportunity', v.title)}
            >
              <Bolt style={{ width: 12, height: 12 }} /> Demander à Signal
            </button>
          </div>
        </div>

        <div className="panel-foot">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={saveOpportunity}>
            <Save /> {saved ? 'Enregistrée ✓' : 'Enregistrer'}
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1.4 }}
            onClick={() => {
              setOpen(false);
              openAdaptation(v);
            }}
          >
            <Wand /> Adapter cette idée
          </button>
        </div>
      </aside>
    </>
  );
}
