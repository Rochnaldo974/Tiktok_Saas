'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COUNTRIES, TIMEFRAMES, NICHES, type Timeframe } from '@/lib/data';
import { writePrefs } from '@/lib/prefs-client';
import { PREFS_COOKIE, sanitizeNiche, MAX_NICHES, type Prefs } from '@/lib/prefs-shared';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  GOAL_LABELS,
  FREQUENCY_LABELS,
  type PostingFrequency,
  type PrimaryGoal,
} from '@/lib/content/types';
import { resetAll, saveProfile } from '@/lib/content/store';
import { useProfile } from '@/lib/content/use-store';
import { track } from '@/lib/analytics';
import { ProfileAnalyzer } from '@/components/profile-analyzer';
import type { ProfileAnalysis } from '@/lib/profile-analysis';
import { Chevron } from '@/components/icons';
import { toast } from '@/components/toaster';

export function SettingsForm({
  initial,
  userEmail,
  tiktokHandle,
  tiktokAnalysis,
}: {
  initial: Prefs;
  userEmail: string | null;
  tiktokHandle?: string | null;
  tiktokAnalysis?: ProfileAnalysis | null;
}) {
  const router = useRouter();
  const profile = useProfile();
  const [country, setCountry] = useState(initial.country);
  const [tf, setTf] = useState<Timeframe>(initial.tf);
  const [niches, setNiches] = useState<string[]>(initial.niches);
  const [customInput, setCustomInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [goal, setGoal] = useState<PrimaryGoal>('grow_audience');
  const [frequency, setFrequency] = useState<PostingFrequency>('three_four_week');
  const [profileLoaded, setProfileLoaded] = useState(false);

  /* Objectif et rythme vivent dans le profil localStorage —
     synchronisés pendant le rendu (pattern officiel), pas en effet. */
  if (profile && !profileLoaded) {
    setProfileLoaded(true);
    setGoal(profile.primaryGoal);
    setFrequency(profile.postingFrequency);
  }

  function toggleNiche(name: string) {
    setNiches((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name].slice(0, MAX_NICHES),
    );
  }

  function addCustom() {
    const clean = sanitizeNiche(customInput);
    if (!clean) {
      toast('Nom de niche invalide — 2 à 30 caractères, lettres et chiffres');
      return;
    }
    if (!niches.includes(clean)) setNiches((prev) => [...prev, clean].slice(0, MAX_NICHES));
    setCustomInput('');
  }

  async function save() {
    if (!niches.length) {
      toast('Choisissez au moins une niche à suivre');
      return;
    }
    setBusy(true);
    try {
      writePrefs({ country, tf, niches });
      saveProfile({
        primaryNiche: niches[0],
        secondaryNiches: niches.slice(1, 3),
        market: country,
        primaryGoal: goal,
        postingFrequency: frequency,
      });
      track('settings_updated', { goal, frequency });
      const supabase = getSupabaseBrowser();
      if (supabase && userEmail) {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          const { error } = await supabase
            .from('profiles')
            .update({
              default_country: country,
              default_timeframe: tf,
              followed_niches: niches,
              updated_at: new Date().toISOString(),
            })
            .eq('id', auth.user.id);
          if (error) {
            toast('Impossible de synchroniser le profil — réessayez');
            return;
          }
        }
      }
      router.refresh();
      toast('Préférences enregistrées');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    toast('Vous êtes déconnecté');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card rail-card reveal" style={{ padding: 24 }}>
        <h4>Marché par défaut</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label htmlFor="pref-country">Pays</label>
            <select id="pref-country" value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
            <Chevron className="caret" />
          </div>
          <div className="field">
            <label htmlFor="pref-tf">Période</label>
            <select id="pref-tf" value={tf} onChange={(e) => setTf(e.target.value as Timeframe)}>
              {TIMEFRAMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <Chevron className="caret" />
          </div>
        </div>
      </div>

      <div className="card rail-card reveal" style={{ padding: 24, animationDelay: '60ms' }}>
        <h4>Niches suivies</h4>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
          Elles alimentent votre brief quotidien, la page Alertes et les recommandations du copilote.
          Toutes les niches sont possibles — ajoutez la vôtre.
        </p>
        <div className="chip-row">
          {niches.filter((n) => !NICHES.some((x) => x.name === n)).map((name) => (
            <button key={name} className="pill on" aria-pressed onClick={() => toggleNiche(name)}>
              {name} ✕
            </button>
          ))}
          {NICHES.map((n) => (
            <button
              key={n.name}
              className={`pill${niches.includes(n.name) ? ' on' : ''}`}
              aria-pressed={niches.includes(n.name)}
              onClick={() => toggleNiche(n.name)}
            >
              {n.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, maxWidth: 420 }}>
          <div className="field" style={{ flex: 1 }}>
            <input
              aria-label="Autre niche"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Autre niche : danse, coiffure, magie..."
              onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
            />
          </div>
          <button className="btn btn-secondary" onClick={addCustom} style={{ flex: 'none' }}>
            Ajouter
          </button>
        </div>
      </div>

      <div className="card rail-card reveal" style={{ padding: 24, animationDelay: '75ms' }}>
        <h4>Objectif &amp; rythme</h4>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
          Ils pilotent le classement des opportunités et la mission du jour.
        </p>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Résultat recherché</label>
        </div>
        <div className="chip-row" role="radiogroup" aria-label="Objectif principal">
          {(Object.keys(GOAL_LABELS) as PrimaryGoal[]).map((g) => (
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
        <div className="field" style={{ margin: '16px 0 8px' }}>
          <label>Fréquence de publication</label>
        </div>
        <div className="chip-row" role="radiogroup" aria-label="Fréquence de publication">
          {(Object.keys(FREQUENCY_LABELS) as PostingFrequency[]).map((f) => (
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
      </div>

      <div className="card rail-card reveal" style={{ padding: 24, animationDelay: '90ms' }}>
        <h4>Profil TikTok</h4>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
          L&apos;IA lit votre profil public, détecte vos niches et vous conseille.
          {userEmail ? " L'analyse est mémorisée dans votre compte." : ''}
        </p>
        <ProfileAnalyzer
          initialHandle={tiktokHandle ?? ''}
          initialAnalysis={tiktokAnalysis ?? null}
          onAnalysis={(r) => {
            setNiches((prev) => [...new Set([...r.analysis.niches, ...prev])].slice(0, MAX_NICHES));
            toast('Niches détectées ajoutées — pensez à enregistrer');
          }}
        />
      </div>

      <div className="card rail-card reveal" style={{ padding: 24, animationDelay: '120ms' }}>
        <h4>Compte</h4>
        {userEmail ? (
          <>
            <div className="rail-row">
              <span className="k">Connecté en tant que</span>
              <span className="v">{userEmail}</span>
            </div>
            <div className="rail-row">
              <span className="k">Vos préférences</span>
              <span className="v">Synchronisées<small>stockées dans votre profil</small></span>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={logout}>
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>
              Sans compte, vos préférences restent sur cet appareil. Créez-en un pour
              les retrouver partout et sauvegarder sons, hooks et idées.
            </p>
            <Link className="btn btn-primary btn-sm" href="/connexion">
              Se connecter / créer un compte
            </Link>
          </>
        )}
      </div>

      <div className="card rail-card reveal" style={{ padding: 24, animationDelay: '140ms' }}>
        <h4>Application</h4>
        <div className="rail-row">
          <span className="k">Copilote &amp; recherche</span>
          <span className="v">Mode démonstration<small>réponses générées localement</small></span>
        </div>
        <div className="rail-row">
          <span className="k">Tendances</span>
          <span className="v">Vraies données TikTok<small>repli démo automatique</small></span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '12px 0' }}>
          Réinitialiser l&apos;onboarding efface votre profil local et vos contenus
          (localStorage de cet appareil), puis relance le parcours de démarrage.
        </p>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (!window.confirm('Réinitialiser l’onboarding ? Profil et contenus locaux seront effacés.')) return;
            resetAll();
            document.cookie = `${PREFS_COOKIE}=; path=/; max-age=0`;
            toast('Onboarding réinitialisé');
            router.push('/');
            router.refresh();
          }}
        >
          Réinitialiser l&apos;onboarding
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-lg" onClick={save} disabled={busy}>
          {busy ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </button>
      </div>
    </div>
  );
}
