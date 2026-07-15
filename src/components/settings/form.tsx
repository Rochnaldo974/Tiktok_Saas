'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COUNTRIES, TIMEFRAMES, NICHES, type Timeframe } from '@/lib/data';
import { writePrefs } from '@/lib/prefs-client';
import { sanitizeNiche, MAX_NICHES, type Prefs } from '@/lib/prefs-shared';
import { getSupabaseBrowser } from '@/lib/supabase/client';
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
  const [country, setCountry] = useState(initial.country);
  const [tf, setTf] = useState<Timeframe>(initial.tf);
  const [niches, setNiches] = useState<string[]>(initial.niches);
  const [customInput, setCustomInput] = useState('');
  const [busy, setBusy] = useState(false);

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

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-lg" onClick={save} disabled={busy}>
          {busy ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </button>
      </div>
    </div>
  );
}
