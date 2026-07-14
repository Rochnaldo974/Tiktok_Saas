'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, TIMEFRAMES, NICHES, type Timeframe } from '@/lib/data';
import { writePrefs } from '@/lib/prefs-client';
import type { Prefs } from '@/lib/prefs-shared';
import { Chevron } from '@/components/icons';
import { toast } from '@/components/toaster';

export function SettingsForm({ initial }: { initial: Prefs }) {
  const router = useRouter();
  const [country, setCountry] = useState(initial.country);
  const [tf, setTf] = useState<Timeframe>(initial.tf);
  const [niches, setNiches] = useState<string[]>(initial.niches);

  function toggleNiche(name: string) {
    setNiches((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function save() {
    if (!niches.length) {
      toast('Choisissez au moins une niche à suivre');
      return;
    }
    writePrefs({ country, tf, niches });
    router.refresh();
    toast('Préférences enregistrées');
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
          Elles alimentent la page Alertes et les recommandations du copilote.
        </p>
        <div className="chip-row">
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
      </div>

      <div className="card rail-card reveal" style={{ padding: 24, animationDelay: '120ms' }}>
        <h4>Compte</h4>
        <div className="rail-row">
          <span className="k">Profil</span>
          <span className="v">ER — session locale</span>
        </div>
        <div className="rail-row">
          <span className="k">Connexion</span>
          <span className="v">Bientôt disponible<small>authentification Supabase en préparation</small></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-lg" onClick={save}>
          Enregistrer les préférences
        </button>
      </div>
    </div>
  );
}
