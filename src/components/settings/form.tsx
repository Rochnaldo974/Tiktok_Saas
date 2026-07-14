'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COUNTRIES, TIMEFRAMES, NICHES, type Timeframe } from '@/lib/data';
import { writePrefs } from '@/lib/prefs-client';
import type { Prefs } from '@/lib/prefs-shared';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Chevron } from '@/components/icons';
import { toast } from '@/components/toaster';

export function SettingsForm({ initial, userEmail }: { initial: Prefs; userEmail: string | null }) {
  const router = useRouter();
  const [country, setCountry] = useState(initial.country);
  const [tf, setTf] = useState<Timeframe>(initial.tf);
  const [niches, setNiches] = useState<string[]>(initial.niches);
  const [busy, setBusy] = useState(false);

  function toggleNiche(name: string) {
    setNiches((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
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
