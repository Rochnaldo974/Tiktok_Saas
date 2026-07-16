'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Video } from '@/lib/data';
import { DIFFICULTY_LABELS } from '@/lib/data';
import {
  GOAL_LABELS,
  STYLE_LABELS,
  type ContentStyle,
  type PrimaryGoal,
} from '@/lib/content/types';
import {
  contentToText,
  defaultFilmingChecklist,
  generateContent,
  hookVariant,
  rewriteContent,
  type GeneratedDraft,
} from '@/lib/content/generator';
import { addContent } from '@/lib/content/store';
import { useProfile } from '@/lib/content/use-store';
import { track } from '@/lib/analytics';
import { toast } from '@/components/toaster';
import { Check, Copy, Save, Wand, X, Bolt } from '@/components/icons';
import { openCopilot } from '@/components/copilot/context-copilot';

/* « Adapter cette idée » : parcours guidé (sujet → objectif → style) →
   génération locale instantanée → script complet prêt à tourner.
   Signal reprend la MÉCANIQUE de la tendance, jamais le contenu d'un
   autre créateur — et ne fabrique jamais la vidéo finale. */

const ADAPT_EVENT = 'signal:adapt';

export function openAdaptation(video: Video, presetSubject?: string): void {
  window.dispatchEvent(new CustomEvent(ADAPT_EVENT, { detail: { video, presetSubject } }));
}

type Step = 'subject' | 'objective' | 'style' | 'generating' | 'result';

const GOALS = Object.keys(GOAL_LABELS) as PrimaryGoal[];
const STYLES = Object.keys(STYLE_LABELS) as ContentStyle[];

export function AdaptationFlow() {
  const router = useRouter();
  const profile = useProfile();
  const [video, setVideo] = useState<Video | null>(null);
  const [step, setStep] = useState<Step>('subject');
  const [subject, setSubject] = useState('');
  const [objective, setObjective] = useState<PrimaryGoal>('grow_audience');
  const [style, setStyle] = useState<ContentStyle>('direct');
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [variantStep, setVariantStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ video: Video; presetSubject?: string }>).detail;
      setVideo(detail.video);
      setSubject(
        detail.presetSubject ??
          (profile?.primaryNiche
            ? `${detail.video.title.slice(0, 60)} — version ${profile.primaryNiche}`
            : detail.video.title.slice(0, 70)),
      );
      setObjective(profile?.primaryGoal ?? 'grow_audience');
      setStyle('direct');
      setDraft(null);
      setVariantStep(0);
      setMoreOpen(false);
      setStep('subject');
      track('adaptation_started', { source: detail.video.id, real: Boolean(detail.video.real) });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener(ADAPT_EVENT, onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(ADAPT_EVENT, onOpen);
      document.removeEventListener('keydown', onKey);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [profile?.primaryNiche, profile?.primaryGoal]);

  function close() {
    setVideo(null);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }

  function generate() {
    if (!video) return;
    setStep('generating');
    track('adaptation_step_completed', { step: 'style' });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timerRef.current = window.setTimeout(
      () => {
        setDraft(generateContent(video, { subject, objective, style }));
        setStep('result');
        track('content_generated', { style, objective });
      },
      reduced ? 50 : 1600,
    );
  }

  function applyHookVariant(mode: 'variant' | 'more_direct' | 'more_intriguing') {
    if (!draft) return;
    const next = hookVariant(draft.hook, mode, variantStep);
    setVariantStep((s) => s + 1);
    setDraft({
      ...draft,
      hook: next,
      scenes: draft.scenes.map((s) =>
        s.index === 1 ? { ...s, spoken: next, onScreen: next.split(' ').slice(0, 5).join(' ') } : s,
      ),
    });
    track('hook_variant_requested', { mode });
  }

  function applyRewrite(mode: 'simplify' | 'shorten' | 'other_angle') {
    if (!draft) return;
    const next = rewriteContent(draft, mode);
    setDraft({ ...draft, ...next });
    setMoreOpen(false);
    toast(
      mode === 'shorten'
        ? 'Version raccourcie générée'
        : mode === 'simplify'
          ? 'Version simplifiée générée'
          : 'Nouvel angle généré',
    );
  }

  function copyScript() {
    if (!draft) return;
    navigator.clipboard?.writeText(contentToText({ ...draft }));
    toast('Script copié dans le presse-papiers');
    track('content_copied', {});
  }

  function save() {
    if (!draft || saving) return;
    setSaving(true);
    const content = addContent({
      ...draft,
      status: 'script_ready',
      scheduledBucket: null,
      scheduledDate: null,
      filmingChecklist: defaultFilmingChecklist(),
      videoMetadata: null,
      videoReview: null,
      publishedAt: null,
      publishedUrl: null,
      performanceMetrics: null,
      performanceInsights: [],
    });
    toast('Ajouté à Mes contenus — prêt à tourner');
    close();
    setSaving(false);
    router.push(`/contenus/${content.id}`);
  }

  if (!video) return null;

  const stepIndex = step === 'subject' ? 1 : step === 'objective' ? 2 : 3;

  return (
    <>
      <div className="overlay open" onClick={close} aria-hidden="true" />
      <aside className="panel open" role="dialog" aria-modal="true" aria-label="Adapter cette idée">
        <header className="panel-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="eyebrow">Transformons cette tendance en contenu original</p>
            <h3 className="panel-title">
              {step === 'result' ? 'Votre contenu est prêt' : `« ${video.title} »`}
            </h3>
            <p className="panel-sub">
              {step === 'result'
                ? 'Une version originale inspirée de la mécanique de la tendance, adaptée à votre activité.'
                : 'Signal reprend la mécanique qui fonctionne, jamais le contenu d’un autre créateur.'}
            </p>
          </div>
          <button className="icon-btn" aria-label="Fermer" onClick={close}>
            <X />
          </button>
        </header>

        {step !== 'result' && step !== 'generating' && (
          <div className="onb-progress" aria-hidden="true">
            <span style={{ width: `${(stepIndex / 3) * 100}%` }} />
          </div>
        )}

        {step === 'subject' && (
          <div className="panel-body">
            <div className="field">
              <label htmlFor="adapt-subject">Quel sujet voulez-vous traiter ?</label>
              <input
                id="adapt-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={90}
                autoFocus
              />
            </div>
            <p style={{ color: 'var(--faint)', fontSize: 12.5 }}>
              Suggestion préremplie depuis votre niche — reformulez-la avec vos mots.
            </p>
            <div className="panel-foot" style={{ marginTop: 'auto' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={subject.trim().length < 3}
                onClick={() => {
                  setStep('objective');
                  track('adaptation_step_completed', { step: 'subject' });
                }}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 'objective' && (
          <div className="panel-body">
            <div className="field">
              <label>Que souhaitez-vous obtenir avec cette vidéo ?</label>
            </div>
            <div className="chip-row" role="radiogroup" aria-label="Objectif">
              {GOALS.map((g) => (
                <button
                  key={g}
                  role="radio"
                  aria-checked={objective === g}
                  className={`pill${objective === g ? ' on' : ''}`}
                  onClick={() => setObjective(g)}
                >
                  {GOAL_LABELS[g]}
                </button>
              ))}
            </div>
            <div className="panel-foot" style={{ marginTop: 'auto' }}>
              <button className="btn btn-secondary" onClick={() => setStep('subject')}>
                Retour
              </button>
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={() => {
                  setStep('style');
                  track('adaptation_step_completed', { step: 'objective' });
                }}
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 'style' && (
          <div className="panel-body">
            <div className="field">
              <label>Quel style vous ressemble le plus ?</label>
            </div>
            <div className="chip-row" role="radiogroup" aria-label="Style">
              {STYLES.map((s) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={style === s}
                  className={`pill${style === s ? ' on' : ''}`}
                  onClick={() => setStyle(s)}
                >
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="panel-foot" style={{ marginTop: 'auto' }}>
              <button className="btn btn-secondary" onClick={() => setStep('objective')}>
                Retour
              </button>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={generate}>
                <Wand /> Générer mon script
              </button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="panel-body onb-gen" aria-live="polite">
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
              Signal crée votre version originale…
            </p>
            <div className="onb-gen-row"><span className="pulse" /> Analyse de la mécanique du format</div>
            <div className="onb-gen-row" style={{ animationDelay: '400ms' }}><span className="pulse" /> Adaptation à votre sujet et votre objectif</div>
            <div className="onb-gen-row" style={{ animationDelay: '800ms' }}><span className="pulse" /> Rédaction du script scène par scène</div>
          </div>
        )}

        {step === 'result' && draft && (
          <div className="panel-body">
            <div className="script-block">
              <h5>Concept</h5>
              <p style={{ marginTop: 6 }}>{draft.concept}</p>
            </div>

            <div className="script-block">
              <h5>Hook <span>— les 2 premières secondes</span></h5>
              <p style={{ marginTop: 6, fontWeight: 600 }}>« {draft.hook} »</p>
              <div className="chip-row" style={{ marginTop: 10 }}>
                <button className="chip" style={{ cursor: 'pointer' }} onClick={() => { navigator.clipboard?.writeText(draft.hook); toast('Hook copié'); }}>
                  <Copy style={{ width: 11, height: 11 }} /> Copier
                </button>
                <button className="chip" style={{ cursor: 'pointer' }} onClick={() => applyHookVariant('variant')}>
                  Générer une variante
                </button>
                <button className="chip" style={{ cursor: 'pointer' }} onClick={() => applyHookVariant('more_direct')}>
                  Rendre plus direct
                </button>
                <button className="chip" style={{ cursor: 'pointer' }} onClick={() => applyHookVariant('more_intriguing')}>
                  Rendre plus intrigant
                </button>
              </div>
            </div>

            {draft.scenes.map((s) => (
              <div className="script-block scene-card" key={s.index}>
                <h5>Scène {s.index} <span>— {s.timeRange}</span></h5>
                <div className="scene-field"><span>Visuel</span><p>{s.visual}</p></div>
                <div className="scene-field"><span>Texte prononcé</span><p>{s.spoken}</p></div>
                {s.onScreen ? <div className="scene-field"><span>Texte à l&apos;écran</span><p>{s.onScreen}</p></div> : null}
              </div>
            ))}

            <div className="gen-facts">
              <div className="gen-fact"><span>Durée</span><b>{draft.duration} s</b></div>
              <div className="gen-fact"><span>Difficulté</span><b>{DIFFICULTY_LABELS[draft.difficulty]}</b></div>
              <div className="gen-fact"><span>Tournage</span><b>{draft.productionTime}</b></div>
              <div className="gen-fact"><span>Créneau suggéré</span><b>{draft.suggestedTime}</b></div>
            </div>
            <div className="rail-row">
              <span className="k">Matériel</span>
              <span className="v" style={{ maxWidth: 300, textAlign: 'right' }}>{draft.equipment}</span>
            </div>
            <div className="rail-row">
              <span className="k">Son recommandé</span>
              <span className="v" style={{ maxWidth: 300 }}>« {draft.sound} »</span>
            </div>
            <div className="rail-row">
              <span className="k">Hashtags indicatifs</span>
              <span className="v">{draft.hashtags.join(' ')}</span>
            </div>

            <div className="script-block">
              <h5>Conseils de réalisation</h5>
              <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {draft.tips.map((tip) => (
                  <li key={tip} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: 'var(--muted)' }}>
                    <Check style={{ width: 14, height: 14, color: 'var(--green)', flex: 'none', marginTop: 2 }} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-foot" style={{ position: 'sticky', bottom: 0 }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={save} disabled={saving}>
                <Save /> Ajouter à mes contenus
              </button>
              <button className="btn btn-secondary" onClick={copyScript}>
                <Copy /> Copier le script
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary"
                  aria-haspopup="true"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                >
                  …
                </button>
                {moreOpen && (
                  <div className="menu" role="menu" style={{ right: 0, bottom: '110%', top: 'auto' }}>
                    <button role="menuitem" onClick={() => applyRewrite('simplify')}>Simplifier</button>
                    <button role="menuitem" onClick={() => applyRewrite('shorten')}>Raccourcir</button>
                    <button role="menuitem" onClick={() => applyRewrite('other_angle')}>Générer un autre angle</button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMoreOpen(false);
                        openCopilot('script', draft.title);
                      }}
                    >
                      <Bolt style={{ width: 12, height: 12 }} /> Demander à Signal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
