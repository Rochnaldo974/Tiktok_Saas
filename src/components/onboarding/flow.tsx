'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/lib/data';
import { sanitizeNiche } from '@/lib/prefs-shared';
import { writePrefs } from '@/lib/prefs-client';
import {
  GOAL_LABELS,
  FREQUENCY_LABELS,
  type PostingFrequency,
  type PrimaryGoal,
  type TiktokConnectionType,
} from '@/lib/content/types';
import { completeOnboarding } from '@/lib/content/store';
import { track } from '@/lib/analytics';
import { ProfileAnalyzer } from '@/components/profile-analyzer';
import { Bolt, Check, ArrowRight } from '@/components/icons';

/* Onboarding : court, guidé, immédiatement utile. Aucune création de
   compte. TikTok est FACULTATIF (3 chemins, aucun n'est inférieur, pas
   de faux OAuth). 4 étapes max, puis le plan du jour. Écrit à la fois
   le profil localStorage (personnalisation client) et le cookie
   sig-prefs (les pages serveur en dépendent). */

type Step = 'intro' | 'tiktok' | 'niches' | 'goal' | 'market' | 'generating';

const SUGGESTED_NICHES = [
  'Immobilier', 'Finance', 'Fitness', 'Beauté', 'Cuisine',
  'E-commerce', 'Marketing', 'Éducation', 'Voyage', 'Lifestyle',
];
const MAX_ONBOARDING_NICHES = 3;
const GOALS = Object.keys(GOAL_LABELS) as PrimaryGoal[];
const FREQUENCIES = Object.keys(FREQUENCY_LABELS) as PostingFrequency[];
const STEP_INDEX: Record<Step, number> = { intro: 0, tiktok: 1, niches: 2, goal: 3, market: 4, generating: 4 };

const GEN_MESSAGES = [
  'Analyse de votre marché',
  'Sélection des opportunités',
  'Préparation de vos recommandations',
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [tiktokPath, setTiktokPath] = useState<'handle' | null>(null);
  const [tiktokHandle, setTiktokHandle] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<TiktokConnectionType>('none');
  const [niches, setNiches] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [goal, setGoal] = useState<PrimaryGoal>('grow_audience');
  const [market, setMarket] = useState('France');
  const [frequency, setFrequency] = useState<PostingFrequency>('three_four_week');
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      track('onboarding_started', {});
    }
  }, []);

  function next(to: Step, completed: string) {
    track('onboarding_step_completed', { step: completed });
    setStep(to);
  }

  function toggleNiche(name: string) {
    setNiches((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length >= MAX_ONBOARDING_NICHES
          ? prev
          : [...prev, name],
    );
  }

  function addCustom() {
    const clean = sanitizeNiche(customInput);
    if (!clean) return;
    setCustomInput('');
    toggleNiche(clean);
  }

  function finish() {
    setStep('generating');
    /* Double écriture : profil localStorage + cookie serveur. */
    completeOnboarding({
      primaryNiche: niches[0],
      secondaryNiches: niches.slice(1),
      market,
      primaryGoal: goal,
      postingFrequency: frequency,
      tiktokHandle,
      tiktokConnectionType: connectionType,
    });
    writePrefs({ country: market, tf: "Aujourd'hui", niches });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => router.refresh(), reduced ? 150 : 2400);
  }

  const progress = (STEP_INDEX[step] / 4) * 100;

  /* ---------- écran d'introduction ---------- */
  if (step === 'intro') {
    return (
      <section className="hero reveal" style={{ maxWidth: 720, margin: '4vh auto 0' }}>
        <p className="eyebrow">Votre copilote TikTok</p>
        <h1 className="hero-title">Trouvez quoi publier aujourd&apos;hui.</h1>
        <div className="hero-brief">
          <p>
            En moins d&apos;une minute, Signal sélectionne les meilleures opportunités pour votre
            activité et transforme la plus pertinente en contenu prêt à tourner.
          </p>
          <p style={{ marginTop: 14, fontWeight: 600, color: 'var(--text)' }}>Vous recevrez :</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 8 }}>
            {[
              '3 opportunités adaptées à votre niche',
              '1 recommandation claire pour aujourd’hui',
              '1 contenu prêt à personnaliser',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14.5 }}>
                <Check style={{ width: 15, height: 15, color: 'var(--green)', flex: 'none' }} /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => next('tiktok', 'intro')}>
            Construire mon plan du jour <ArrowRight />
          </button>
        </div>
      </section>
    );
  }

  /* ---------- génération ---------- */
  if (step === 'generating') {
    return (
      <section className="hero reveal onb-gen" style={{ maxWidth: 620, margin: '10vh auto 0', minHeight: 260 }} aria-live="polite">
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em' }}>
          <Bolt style={{ width: 18, height: 18, display: 'inline', verticalAlign: '-2px', color: 'var(--accent)' }} />{' '}
          Signal prépare votre plan du jour…
        </p>
        {GEN_MESSAGES.map((msg, i) => (
          <div className="onb-gen-row" key={msg} style={{ animationDelay: `${i * 600}ms` }}>
            <span className="pulse" /> {msg}
          </div>
        ))}
      </section>
    );
  }

  /* ---------- étapes ---------- */
  return (
    <section className="hero reveal" style={{ maxWidth: 720, margin: '3vh auto 0' }}>
      <div className="onb-progress" style={{ margin: '0 0 26px' }} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {step === 'tiktok' && (
        <>
          <p className="eyebrow">Étape 1 sur 4 · facultative</p>
          <h1 className="hero-title" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>
            Utilisez-vous déjà TikTok ?
          </h1>
          <p className="hero-brief" style={{ marginBottom: 18 }}>
            Votre compte permet à Signal d&apos;affiner ses recommandations. Vous pouvez aussi
            commencer sans le connecter.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            <button className="onb-choice" disabled title="L'authentification TikTok officielle n'est pas encore disponible">
              <b>Connecter mon compte TikTok <span className="chip" style={{ marginLeft: 6 }}>Bientôt disponible</span></b>
              <p>
                Utilisez votre compte pour personnaliser votre diagnostic et, lorsque les
                autorisations le permettent, suivre vos contenus.
              </p>
            </button>
            <button
              className={`onb-choice${tiktokPath === 'handle' ? ' on' : ''}`}
              onClick={() => {
                setTiktokPath(tiktokPath === 'handle' ? null : 'handle');
                track('tiktok_connection_selected', { type: 'public_handle' });
              }}
              aria-expanded={tiktokPath === 'handle'}
            >
              <b>Entrer mon identifiant</b>
              <p>Signal utilisera uniquement les informations publiques disponibles.</p>
            </button>
            {tiktokPath === 'handle' && (
              <div style={{ padding: '4px 2px' }}>
                <ProfileAnalyzer
                  onAnalysis={(r) => {
                    setTiktokHandle(r.handle);
                    setConnectionType('public_handle');
                    setNiches(r.analysis.niches.slice(0, MAX_ONBOARDING_NICHES));
                    track('tiktok_handle_submitted', { handle: r.handle ?? '' });
                    next('niches', 'tiktok');
                  }}
                />
              </div>
            )}
            <button
              className="onb-choice"
              onClick={() => {
                setConnectionType('manual');
                track('onboarding_skipped_tiktok', {});
                next('niches', 'tiktok');
              }}
            >
              <b>Continuer sans compte</b>
              <p>
                Indiquez simplement votre niche, votre marché et votre objectif. Idéal si vous
                créez pour une marque, des clients — ou si vous débutez.
              </p>
            </button>
          </div>
        </>
      )}

      {step === 'niches' && (
        <>
          <p className="eyebrow">Étape 2 sur 4</p>
          <h1 className="hero-title" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>
            Sur quoi créez-vous du contenu ?
          </h1>
          <p className="hero-brief" style={{ marginBottom: 18 }}>
            Jusqu&apos;à 3 niches — la première choisie devient votre niche principale.
          </p>
          <div className="chip-row" role="group" aria-label="Niches suggérées">
            {[...new Set([...niches, ...SUGGESTED_NICHES])].map((name) => {
              const selected = niches.includes(name);
              const isPrimary = niches[0] === name;
              return (
                <button
                  key={name}
                  className={`pill${selected ? ' on' : ''}`}
                  aria-pressed={selected}
                  onClick={() => toggleNiche(name)}
                >
                  {name}{isPrimary ? ' · principale' : ''}
                </button>
              );
            })}
          </div>
          <div className="field" style={{ marginTop: 16, maxWidth: 340 }}>
            <label htmlFor="onb-custom">Autre niche</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="onb-custom"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                placeholder="Danse, poterie, barbier…"
                maxLength={30}
              />
              <button className="btn btn-secondary" onClick={addCustom} disabled={!customInput.trim()}>
                Ajouter
              </button>
            </div>
          </div>
          <div className="hero-actions">
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('tiktok')}>Retour</button>
            <button
              className="btn btn-primary btn-lg"
              disabled={!niches.length}
              onClick={() => next('goal', 'niches')}
            >
              Continuer <ArrowRight />
            </button>
          </div>
        </>
      )}

      {step === 'goal' && (
        <>
          <p className="eyebrow">Étape 3 sur 4</p>
          <h1 className="hero-title" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>
            Quel résultat recherchez-vous ?
          </h1>
          <div className="chip-row" role="radiogroup" aria-label="Objectif principal" style={{ marginTop: 18 }}>
            {GOALS.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={goal === g}
                className={`pill${goal === g ? ' on' : ''}`}
                onClick={() => setGoal(g)}
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
          <div className="hero-actions">
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('niches')}>Retour</button>
            <button className="btn btn-primary btn-lg" onClick={() => next('market', 'goal')}>
              Continuer <ArrowRight />
            </button>
          </div>
        </>
      )}

      {step === 'market' && (
        <>
          <p className="eyebrow">Étape 4 sur 4</p>
          <h1 className="hero-title" style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>
            Quel est votre marché principal ?
          </h1>
          <div className="chip-row" role="radiogroup" aria-label="Marché" style={{ marginTop: 18 }}>
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                role="radio"
                aria-checked={market === c.name}
                className={`pill${market === c.name ? ' on' : ''}`}
                onClick={() => setMarket(c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 22 }}>
            <label>À quelle fréquence souhaitez-vous publier ?</label>
          </div>
          <div className="chip-row" role="radiogroup" aria-label="Fréquence de publication">
            {FREQUENCIES.map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={frequency === f}
                className={`pill${frequency === f ? ' on' : ''}`}
                onClick={() => setFrequency(f)}
              >
                {FREQUENCY_LABELS[f]}
              </button>
            ))}
          </div>
          <div className="hero-actions">
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('goal')}>Retour</button>
            <button className="btn btn-primary btn-lg" onClick={finish}>
              Voir mon plan du jour <ArrowRight />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
