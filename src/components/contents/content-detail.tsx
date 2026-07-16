'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DIFFICULTY_LABELS } from '@/lib/data';
import { CONTENT_STATUS_LABELS, STATUS_META } from '@/lib/content/status';
import { GOAL_LABELS, STYLE_LABELS, type Scene } from '@/lib/content/types';
import { contentToText } from '@/lib/content/generator';
import { setContentStatus, updateContent } from '@/lib/content/store';
import { useContent, useHydrated } from '@/lib/content/use-store';
import { track } from '@/lib/analytics';
import { toast } from '@/components/toaster';
import { Bolt, Check, Copy, Film, Sparkle, Wand, ArrowRight } from '@/components/icons';
import { openCopilot } from '@/components/copilot/context-copilot';

/* Éditeur du script : hook + scènes éditables directement (le texte vit
   dans le DOM contentEditable, relu à la sauvegarde — même pattern que
   l'ancien panneau). Le CTA principal suit la machine d'états. */

export function ContentDetail({ id, loggedIn }: { id: string; loggedIn: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const content = useContent(id);
  const editorRef = useRef<HTMLDivElement>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  if (!hydrated) {
    return <div className="skeleton" style={{ height: 420, borderRadius: 'var(--r-lg)' }} />;
  }
  if (!content) {
    return (
      <div className="empty">
        <Film />
        <h4>Contenu introuvable</h4>
        <p>Il a peut-être été supprimé, ou créé sur un autre appareil (stockage local).</p>
        <Link className="btn btn-secondary" href="/contenus">Retour à Mes contenus</Link>
      </div>
    );
  }

  const meta = STATUS_META[content.status];
  const editable = ['idea', 'script_draft', 'script_ready', 'to_film', 'filming'].includes(content.status);

  /* Relit hook + scènes depuis le DOM (source de vérité pendant l'édition). */
  function currentScenes(): { hook: string; scenes: Scene[] } {
    const root = editorRef.current;
    if (!root || !content) return { hook: content?.hook ?? '', scenes: content?.scenes ?? [] };
    const hook = root.querySelector('[data-hook-text]')?.textContent?.trim() || content.hook;
    const scenes = content.scenes.map((s) => {
      const scene = root.querySelector(`[data-scene="${s.index}"]`);
      return {
        ...s,
        visual: scene?.querySelector('[data-field="visual"]')?.textContent?.trim() || s.visual,
        spoken: scene?.querySelector('[data-field="spoken"]')?.textContent?.trim() || s.spoken,
        onScreen: scene?.querySelector('[data-field="onScreen"]')?.textContent?.trim() ?? s.onScreen,
      };
    });
    return { hook, scenes };
  }

  function persistEdits(message = 'Modifications enregistrées') {
    const { hook, scenes } = currentScenes();
    updateContent(id, { hook, scenes });
    toast(message);
  }

  function copyAll() {
    const { scenes } = currentScenes();
    navigator.clipboard?.writeText(contentToText({ ...content!, scenes }));
    toast('Script copié dans le presse-papiers');
    track('content_copied', {});
  }

  async function generateWithAI() {
    if (!content || aiBusy) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title.slice(0, 90),
          niche: content.niche,
          hook: content.hook.slice(0, 160),
          sound: content.sound.slice(0, 60),
          cta: content.cta.slice(0, 120),
          contentType: STYLE_LABELS[content.style],
          summary: content.concept.slice(0, 200),
          duration: content.duration,
        }),
      });
      const data = (await res.json()) as {
        sections?: { label: string; time: string; text: string }[];
        error?: string;
      };
      if (!res.ok || !data.sections) {
        toast(
          res.status === 401
            ? 'Connectez-vous pour la rédaction IA — le script local reste disponible'
            : (data.error ?? 'Génération IA indisponible — le script local reste utilisable'),
        );
        return;
      }
      const scenes = content.scenes.map((s, i) => {
        const section = data.sections![i];
        return section ? { ...s, spoken: section.text, timeRange: section.time } : s;
      });
      updateContent(id, { scenes, hook: scenes[0]?.spoken.slice(0, 160) ?? content.hook });
      setAiDone(true);
      toast('Script rédigé par l’IA — relisez et ajustez');
    } catch {
      toast('Génération IA indisponible — le script local reste utilisable');
    } finally {
      setAiBusy(false);
    }
  }

  function toggleCheck(itemId: string) {
    if (!content) return;
    updateContent(id, {
      filmingChecklist: content.filmingChecklist.map((i) =>
        i.id === itemId ? { ...i, done: !i.done } : i,
      ),
    });
  }

  function primaryAction() {
    switch (meta.primaryCta.kind) {
      case 'open_script':
      case 'finish_script':
        persistEdits('Script enregistré');
        if (content!.status === 'script_draft') {
          setContentStatus(id, 'script_ready');
          track('content_marked_ready', {});
          toast('Script prêt à tourner');
        }
        break;
      case 'mark_filmed':
        persistEdits();
        if (content!.status !== 'filming') setContentStatus(id, 'filming');
        setContentStatus(id, 'video_uploaded');
        track('content_marked_filmed', {});
        router.push(`/contenus/${id}/verifier`);
        break;
      case 'verify_video':
      case 'view_corrections':
        router.push(`/contenus/${id}/verifier`);
        break;
      case 'mark_published':
        router.push('/contenus');
        break;
      default:
        router.push('/contenus');
    }
  }

  return (
    <>
      <header>
        <p className="eyebrow">
          <Link href="/contenus" style={{ color: 'inherit' }}>Mes contenus</Link> · {CONTENT_STATUS_LABELS[content.status]}
        </p>
        <h1 className="page-title" style={{ marginTop: 12, fontSize: 'clamp(26px, 4vw, 38px)' }}>
          {content.title}
        </h1>
        <p className="page-sub" style={{ marginTop: 12 }}>{content.concept}</p>
      </header>

      <div className="gen-facts">
        <div className="gen-fact"><span>Durée</span><b>{content.duration} s</b></div>
        <div className="gen-fact"><span>Difficulté</span><b>{DIFFICULTY_LABELS[content.difficulty]}</b></div>
        <div className="gen-fact"><span>Tournage</span><b>{content.productionTime}</b></div>
        <div className="gen-fact"><span>Objectif</span><b>{GOAL_LABELS[content.objective]}</b></div>
      </div>

      <div ref={editorRef} style={{ display: 'grid', gap: 14 }}>
        <div className="script-block">
          <h5>Hook <span>— les 2 premières secondes{editable ? ' · modifiable' : ''}</span></h5>
          <p
            data-hook-text
            contentEditable={editable}
            suppressContentEditableWarning
            style={{ marginTop: 6, fontWeight: 600, outline: 'none' }}
          >
            {content.hook}
          </p>
        </div>
        {content.scenes.map((s) => (
          <div className="script-block scene-card" key={s.index} data-scene={s.index}>
            <h5>Scène {s.index} <span>— {s.timeRange}{editable ? ' · modifiable' : ''}</span></h5>
            <div className="scene-field">
              <span>Visuel</span>
              <p data-field="visual" contentEditable={editable} suppressContentEditableWarning style={{ outline: 'none' }}>{s.visual}</p>
            </div>
            <div className="scene-field">
              <span>Texte prononcé</span>
              <p data-field="spoken" contentEditable={editable} suppressContentEditableWarning style={{ outline: 'none' }}>{s.spoken}</p>
            </div>
            <div className="scene-field">
              <span>Texte à l&apos;écran</span>
              <p data-field="onScreen" contentEditable={editable} suppressContentEditableWarning style={{ outline: 'none' }}>{s.onScreen || '—'}</p>
            </div>
          </div>
        ))}
        <div className="script-block">
          <h5>CTA</h5>
          <p style={{ marginTop: 6 }}>« {content.cta} »</p>
        </div>
      </div>

      <div className="rail-row"><span className="k">Matériel</span><span className="v" style={{ maxWidth: 320, textAlign: 'right' }}>{content.equipment}</span></div>
      <div className="rail-row"><span className="k">Son recommandé</span><span className="v" style={{ maxWidth: 320 }}>« {content.sound} »</span></div>
      <div className="rail-row"><span className="k">Créneau suggéré</span><span className="v">{content.suggestedTime}</span></div>
      <div className="rail-row"><span className="k">Hashtags indicatifs</span><span className="v">{content.hashtags.join(' ')}</span></div>

      {content.tips.length > 0 && (
        <div className="ai-note" style={{ display: 'grid', gap: 6 }}>
          {content.tips.map((tip) => (
            <span key={tip} style={{ display: 'flex', gap: 8 }}><Sparkle style={{ flex: 'none' }} /> {tip}</span>
          ))}
        </div>
      )}

      {editable && content.filmingChecklist.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <h4 style={{ fontSize: 14, marginBottom: 10 }}><Film style={{ width: 14, height: 14 }} /> Avant de tourner</h4>
          <div style={{ display: 'grid', gap: 8 }}>
            {content.filmingChecklist.map((item) => (
              <label key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5, cursor: 'pointer', color: item.done ? 'var(--faint)' : 'var(--text)' }}>
                <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item.id)} />
                <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="card-actions" style={{ position: 'sticky', bottom: 12, background: 'var(--surface)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={primaryAction}>
          {meta.primaryCta.kind === 'open_script' || meta.primaryCta.kind === 'finish_script'
            ? content.status === 'script_draft' ? 'Marquer le script prêt' : 'Enregistrer le script'
            : meta.primaryCta.label}
          <ArrowRight />
        </button>
        {editable && (
          <button className="btn btn-secondary" onClick={() => { persistEdits(); if (content.status !== 'filming') setContentStatus(id, 'filming'); setContentStatus(id, 'video_uploaded'); track('content_marked_filmed', {}); toast('Marquée comme tournée'); }}>
            <Check /> Marquer comme tournée
          </button>
        )}
        <button className="btn btn-secondary" onClick={copyAll}>
          <Copy /> Copier le script
        </button>
        {editable && (
          <button className="btn btn-secondary" onClick={generateWithAI} disabled={aiBusy || aiDone} title={loggedIn ? undefined : 'Nécessite un compte (coût IA réel)'}>
            <Wand /> {aiBusy ? 'Rédaction…' : aiDone ? 'Rédigé par l’IA' : 'Rédiger avec l’IA'}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => openCopilot('script', content.title)}>
          <Bolt style={{ width: 13, height: 13 }} /> Demander à Signal
        </button>
      </div>
    </>
  );
}
