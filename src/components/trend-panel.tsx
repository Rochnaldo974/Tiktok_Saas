'use client';

import { useEffect, useRef, useState } from 'react';
import type { Video } from '@/lib/data';
import { fmt, dur, STATUS_LABELS, DIFFICULTY_LABELS, SATURATION_LABELS } from '@/lib/data';
import { buildScript, scriptToText, type ScriptSection } from '@/lib/script';
import { saveItem } from '@/lib/library';
import { toast } from '@/components/toaster';
import { X, Copy, Save, Sparkle, Music, Quote, Eye, Up, Wand } from '@/components/icons';

/* Panneau latéral Analyse + Script : le dernier maillon insight → action.
   Ouvrable depuis n'importe quelle carte via openTrendPanel() (événement
   global, même pattern que les toasts). */

type Tab = 'analyse' | 'script';
const PANEL_EVENT = 'signal:trend-panel';

export function openTrendPanel(video: Video, tab: Tab = 'analyse') {
  window.dispatchEvent(new CustomEvent(PANEL_EVENT, { detail: { video, tab } }));
}

export function TrendPanel() {
  const [video, setVideo] = useState<Video | null>(null);
  const [tab, setTab] = useState<Tab>('analyse');
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const scriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOpen(e: Event) {
      const { video, tab } = (e as CustomEvent<{ video: Video; tab: Tab }>).detail;
      setVideo(video);
      setTab(tab);
      setSections(buildScript(video));
      setAiGenerated(false);
      setOpen(true);
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

  async function generateWithAI() {
    if (aiBusy) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: v.title,
          niche: v.niche,
          hook: v.hook.text,
          sound: v.sound.name,
          cta: v.cta,
          contentType: v.contentType,
          duration: v.duration,
          summary: v.summary,
        }),
      });
      const data = (await res.json()) as { sections?: ScriptSection[]; error?: string };
      if (!res.ok || !data.sections) {
        toast(data.error ?? 'Génération impossible — le script local reste disponible.');
        return;
      }
      setSections(data.sections);
      setAiGenerated(true);
      toast('Script généré par l’IA — relisez et adaptez à votre voix');
    } catch {
      toast('Génération impossible — vérifiez votre connexion.');
    } finally {
      setAiBusy(false);
    }
  }

  /* Le script est éditable : la copie/sauvegarde lit le texte réellement affiché. */
  function currentScript(): string {
    const blocks = scriptRef.current?.querySelectorAll('[data-script-text]');
    if (!blocks?.length) return scriptToText(v, sections);
    const edited = Array.from(blocks).map((el, i) => ({
      ...sections[i],
      text: el.textContent ?? sections[i].text,
    }));
    return scriptToText(v, edited);
  }

  function copyScript() {
    navigator.clipboard?.writeText(currentScript());
    toast('Script copié — bon tournage !');
  }

  function saveScript() {
    saveItem(
      'idea',
      v.id,
      {
        title: v.title,
        niche: v.niche,
        hook: v.hook.text,
        sound: v.sound.name,
        cta: v.cta,
        growth: v.growth,
        prodTime: v.prodTime,
        script: currentScript(),
      },
      'Script sauvegardé dans votre bibliothèque',
    );
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
          <div className="panel-tabs">
            <button className={`panel-tab${tab === 'analyse' ? ' on' : ''}`} onClick={() => setTab('analyse')}>
              Pourquoi ça marche
            </button>
            <button className={`panel-tab${tab === 'script' ? ' on' : ''}`} onClick={() => setTab('script')}>
              Mon script
            </button>
          </div>
        </div>

        {tab === 'analyse' ? (
          <div className="panel-body">
            <div className="ai-note">
              <Sparkle />
              <span>{v.summary} <strong>{v.context}</strong></span>
            </div>
            <div className="gen-facts">
              <div className="gen-fact"><span>Score viral</span><b>{v.viralScore}/100</b></div>
              <div className="gen-fact"><span>Opportunité</span><b>{v.opportunity}/100</b></div>
              <div className="gen-fact"><span>Vues</span><b>{fmt(v.views)} · {fmt(v.likes)} <Eye style={{ width: 11, height: 11, display: 'inline' }} /></b></div>
              <div className="gen-fact"><span>Engagement</span><b>{fmt(v.comments)} comm. · {fmt(v.shares)} partages</b></div>
            </div>
            <div className="script-block">
              <h5>Difficulté <span>{DIFFICULTY_LABELS[v.difficulty]} · {v.prodTime}</span></h5>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{v.diffReason} {v.prodReason}</p>
            </div>
            <div className="script-block">
              <h5>Saturation <span>{SATURATION_LABELS[v.saturation]}</span></h5>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{v.satReason}</p>
            </div>
            <div>
              <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 10 }}>
                Les ressorts du format
              </h5>
              <div className="chip-row">
                {v.chips.map((c) => <span key={c} className="chip good">{c}</span>)}
                {v.emotions.map((e) => <span key={e} className="chip">{e}</span>)}
              </div>
            </div>
            <div className="rail-row">
              <span className="k"><Music /> Son à utiliser</span>
              <span className="v">« {v.sound.name} »<small>+{v.sound.growth} % · {fmt(v.sound.videos)} vidéos</small></span>
            </div>
            <div className="rail-row">
              <span className="k"><Quote /> Hook d&apos;ouverture</span>
              <span className="v" style={{ maxWidth: 280 }}>« {v.hook.text} »<small>{v.hook.performance} % de rétention</small></span>
            </div>
          </div>
        ) : (
          <div className="panel-body" ref={scriptRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, flex: 1, minWidth: 200 }}>
                {aiGenerated
                  ? 'Script rédigé par l’IA à partir de la tendance — chaque bloc reste modifiable.'
                  : `Plan de tournage minuté sur ${dur(v.duration)} avec le son « ${v.sound.name} » — modifiable au clic.`}
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={generateWithAI}
                disabled={aiBusy}
                style={{ flex: 'none' }}
              >
                <Wand /> {aiBusy ? 'Génération...' : aiGenerated ? 'Regénérer' : 'Rédiger avec l’IA'}
              </button>
            </div>
            {aiBusy && (
              <div className="script-block" aria-live="polite">
                <h5>Rédaction en cours <span className="typing" style={{ padding: 0 }}><i /><i /><i /></span></h5>
                <p style={{ fontSize: 13, color: 'var(--faint)' }}>
                  L&apos;IA écrit vos répliques à partir de la tendance...
                </p>
              </div>
            )}
            {sections.map((s, i) => (
              <div className="script-block" key={`${aiGenerated ? 'ai' : 'local'}-${i}`}>
                <h5>{s.label} <span>{s.time}</span></h5>
                <p
                  data-script-text
                  contentEditable
                  suppressContentEditableWarning
                  style={{ fontSize: 14, color: 'var(--text)', outline: 'none', lineHeight: 1.55 }}
                >
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="panel-foot">
          {tab === 'script' ? (
            <>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={copyScript}>
                <Copy /> Copier le script
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveScript}>
                <Save /> Sauvegarder
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  navigator.clipboard?.writeText(v.hook.text);
                  toast('Hook copié dans le presse-papiers');
                }}
              >
                <Copy /> Copier le hook
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setTab('script')}>
                <Up /> Créer ma version
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
