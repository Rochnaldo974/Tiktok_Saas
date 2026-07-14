'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, NICHES } from '@/lib/data';
import { writePrefs } from '@/lib/prefs-client';
import { Bolt, Check, Chevron } from '@/components/icons';
import { toast } from '@/components/toaster';

/* Première visite : on demande les niches du créateur avant de
   montrer le dashboard — c'est ce qui rend tout le produit pertinent. */

export function Onboarding() {
  const router = useRouter();
  const [country, setCountry] = useState('France');
  const [niches, setNiches] = useState<string[]>([]);

  function toggle(name: string) {
    setNiches((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }

  function start() {
    if (!niches.length) {
      toast('Choisissez au moins une niche pour personnaliser votre Signal');
      return;
    }
    writePrefs({ country, tf: "Aujourd'hui", niches });
    router.refresh();
  }

  return (
    <section className="hero reveal" aria-labelledby="onboarding-title" style={{ maxWidth: 860, margin: '40px auto' }}>
      <p className="eyebrow">
        <span className="logo-mark" style={{ width: 22, height: 22, borderRadius: 7 }}><Bolt style={{ width: 12, height: 12 }} /></span>
        Bienvenue sur Signal
      </p>
      <h1 className="hero-title" id="onboarding-title">
        Sur quoi créez-vous du contenu ?
      </h1>
      <div className="hero-brief">
        <p>
          Signal surveille TikTok en continu. Dites-nous vos niches : votre brief quotidien,
          vos idées et vos alertes seront calculés <strong>pour votre contenu</strong> — pas
          pour celui des autres.
        </p>
      </div>

      <div className="chip-row" style={{ marginTop: 24 }} role="group" aria-label="Vos niches">
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
