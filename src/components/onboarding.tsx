'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, NICHES } from '@/lib/data';
import { sanitizeNiche, MAX_NICHES } from '@/lib/prefs-shared';
import { writePrefs } from '@/lib/prefs-client';
import { ProfileAnalyzer } from '@/components/profile-analyzer';
import { Bolt, Check, Chevron } from '@/components/icons';
import { toast } from '@/components/toaster';

/* Première visite. Deux chemins, du plus magique au plus manuel :
   1. « Colle ton @ TikTok » — l'IA lit le profil et détecte les niches.
   2. Choix manuel : niches suggérées + champ libre (danse, poterie,
      coiffure... tous les métiers ont leur place). */

export function Onboarding() {
  const router = useRouter();
  const [country, setCountry] = useState('France');
  const [niches, setNiches] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  function toggle(name: string) {
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

  function start() {
    if (!niches.length) {
      toast('Choisissez au moins une niche pour personnaliser votre Signal');
      return;
    }
    writePrefs({ country, tf: "Aujourd'hui", niches });
    router.refresh();
  }

  const customs = niches.filter((n) => !NICHES.some((x) => x.name === n));

  return (
    <section className="hero reveal" aria-labelledby="onboarding-title" style={{ maxWidth: 880, margin: '40px auto' }}>
      <p className="eyebrow">
        <span className="logo-mark" style={{ width: 22, height: 22, borderRadius: 7 }}><Bolt style={{ width: 12, height: 12 }} /></span>
        Bienvenue sur Signal
      </p>
      <h1 className="hero-title" id="onboarding-title">
        Sur quoi créez-vous du contenu ?
      </h1>
      <div className="hero-brief">
        <p>
          Danse, cuisine, finance, poterie... <strong>toutes les niches ont leur place.</strong>{' '}
          Votre brief quotidien, vos idées et vos alertes seront calculés pour votre contenu — pas
          pour celui des autres.
        </p>
      </div>

      {/* Chemin magique : analyse du profil */}
      <div className="script-block" style={{ marginTop: 26 }}>
        <h5>Le plus simple <span>l&apos;IA lit votre profil public</span></h5>
        <ProfileAnalyzer
          onAnalysis={(r) => {
            setNiches((prev) => [...new Set([...r.analysis.niches, ...prev])].slice(0, MAX_NICHES));
            toast('Niches détectées et sélectionnées — ajustez si besoin');
          }}
        />
      </div>

      {/* Chemin manuel */}
      <div style={{ marginTop: 24 }}>
        <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 12 }}>
          Ou choisissez vous-même
        </h5>
        <div className="chip-row" role="group" aria-label="Vos niches">
          {customs.map((name) => (
            <button key={name} className="pill on" aria-pressed onClick={() => toggle(name)}>
              {name} ✕
            </button>
          ))}
          {NICHES.map((n) => (
            <button
              key={n.name}
              className={`pill${niches.includes(n.name) ? ' on' : ''}`}
              aria-pressed={niches.includes(n.name)}
              onClick={() => toggle(n.name)}
            >
              {n.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, maxWidth: 420 }}>
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

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', marginTop: 28, flexWrap: 'wrap' }}>
        <div className="field" style={{ width: 220 }}>
          <label htmlFor="onb-country">Votre marché principal</label>
          <select id="onb-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
          <Chevron className="caret" />
        </div>
        <button className="btn btn-primary btn-lg" onClick={start}>
          <Check /> Personnaliser mon Signal
        </button>
      </div>
      <p style={{ color: 'var(--faint)', fontSize: 12.5, marginTop: 16 }}>
        Modifiable à tout moment dans les réglages.
      </p>
    </section>
  );
}
