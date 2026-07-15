'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmt } from '@/lib/data';
import Link from 'next/link';
import { readPrefs, writePrefs } from '@/lib/prefs-client';
import { MAX_NICHES } from '@/lib/prefs-shared';
import { addPlanToPlanning } from '@/lib/planning';
import type { ProfileAnalysisResponse } from '@/lib/profile-analysis';
import { Ring } from '@/components/cards/ring';
import { Radar, Sparkle, Check, X, Copy, Wand, Calendar, ArrowRight } from '@/components/icons';
import { toast } from '@/components/toaster';

/* Audit stratégique complet d'un profil TikTok : score, positionnement,
   forces/faiblesses, plan 7 jours, idées de vidéos sur mesure, bio. */

export function DeepAnalyzer({
  initialHandle = '',
  initialResult = null,
}: {
  initialHandle?: string;
  initialResult?: ProfileAnalysisResponse | null;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState(initialHandle);
  const [description, setDescription] = useState('');
  const [needDescription, setNeedDescription] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProfileAnalysisResponse | null>(initialResult);
  const [planAdded, setPlanAdded] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);

  async function analyze() {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: handle.trim() || undefined,
          description: description.trim() || undefined,
          deep: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fallback === 'description') setNeedDescription(true);
        setError(data.error ?? 'Analyse impossible — réessayez.');
        return;
      }
      setResult(data as ProfileAnalysisResponse);
    } catch {
      setError('Analyse impossible — vérifiez votre connexion.');
    } finally {
      setBusy(false);
    }
  }

  function followNiches() {
    if (!result) return;
    const prefs = readPrefs();
    const merged = [...new Set([...result.analysis.niches, ...prefs.niches])].slice(0, MAX_NICHES);
    writePrefs({ ...prefs, niches: merged });
    router.refresh();
    toast('Niches suivies mises à jour — votre dashboard est recalibré');
  }

  const a = result?.analysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card rail-card reveal" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="deep-handle">Votre @ TikTok</label>
            <input
              id="deep-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@moncompte"
              autoComplete="off"
              onKeyDown={(e) => { if (e.key === 'Enter') analyze(); }}
            />
          </div>
          <button className="btn btn-primary btn-lg" onClick={analyze} disabled={busy} style={{ flex: 'none' }}>
            <Radar /> {busy ? 'Audit en cours...' : result ? 'Relancer l’audit' : 'Lancer l’audit complet'}
          </button>
        </div>
        {needDescription && (
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="deep-desc">Ou décrivez votre contenu en une phrase</label>
            <input
              id="deep-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. : je poste des chorégraphies de danse bachata et des tutos pour débutants"
              onKeyDown={(e) => { if (e.key === 'Enter') analyze(); }}
            />
          </div>
        )}
        {error && <p role="alert" style={{ color: 'var(--accent)', fontSize: 13, marginTop: 12 }}>{error}</p>}
        {busy && (
          <div className="ai-note" style={{ marginTop: 14 }} aria-live="polite">
            <Sparkle />
            <span>
              Lecture du profil, calcul du score et rédaction du plan d&apos;action
              <span className="typing" style={{ padding: 0, marginLeft: 6 }}><i /><i /><i /></span>
            </span>
          </div>
        )}
      </div>

      {a && !busy && (
        <>
          {/* Score + positionnement */}
          <div className="card rail-card reveal" style={{ padding: 24 }}>
            <h4>Verdict</h4>
            <div className="score-hero">
              <div style={{ flex: 1 }}>
                <div className="score-num">{a.score ?? '—'}<small>/100</small></div>
                <div className="score-label">
                  Potentiel de croissance{result?.handle ? <> de <b>@{result.handle}</b></> : null}
                  {result?.stats?.followers !== null && result?.stats ? (
                    <> · {fmt(result.stats.followers!)} abonnés</>
                  ) : null}
                </div>
              </div>
              <Ring value={a.score ?? 0} accent />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14, lineHeight: 1.6 }}>{a.summary}</p>
            <div className="chip-row" style={{ marginTop: 12 }}>
              {a.niches.map((n) => <span key={n} className="chip hot">{n}</span>)}
              <button className="pill" onClick={followNiches} style={{ fontSize: 12 }}>
                Suivre ces niches sur mon dashboard
              </button>
            </div>
          </div>

          {/* Forces / axes d'amélioration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="card rail-card reveal" style={{ padding: 24 }}>
              <h4>Vos forces</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(a.strengths ?? []).map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13.5, color: 'var(--muted)' }}>
                    <Check style={{ width: 14, height: 14, color: 'var(--green)', flex: 'none', marginTop: 3 }} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card rail-card reveal" style={{ padding: 24, animationDelay: '60ms' }}>
              <h4>À améliorer</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(a.weaknesses ?? []).map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13.5, color: 'var(--muted)' }}>
                    <X style={{ width: 14, height: 14, color: 'var(--accent)', flex: 'none', marginTop: 3 }} />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Plan 7 jours */}
          {a.plan?.length ? (
            <div className="card brief-card reveal" style={{ padding: 32 }}>
              <div className="brief-plan" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <h4>Votre plan des 7 prochains jours</h4>
                {a.plan.map((step, i) => (
                  <div className="plan-item" key={i}>
                    <span className="n">J{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                {planAdded ? (
                  <Link className="btn btn-primary" href="/planning">
                    <Calendar /> Voir mon planning <ArrowRight />
                  </Link>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={planBusy}
                    onClick={async () => {
                      setPlanBusy(true);
                      const ok = await addPlanToPlanning(a.plan!);
                      setPlanBusy(false);
                      if (ok) setPlanAdded(true);
                    }}
                  >
                    <Calendar /> {planBusy ? 'Ajout...' : 'Ajouter à mon planning'}
                  </button>
                )}
                <span style={{ color: 'var(--faint)', fontSize: 12.5 }}>
                  Une action par jour, à partir d&apos;aujourd&apos;hui — cochable depuis la page Planning.
                </span>
              </div>
            </div>
          ) : null}

          {/* Idées de vidéos sur mesure */}
          {a.videoIdeas?.length ? (
            <div>
              <div className="section-head">
                <div>
                  <p className="eyebrow">Taillées pour votre profil</p>
                  <h2 className="section-title">3 vidéos à tourner cette semaine</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {a.videoIdeas.map((idea, i) => (
                  <div className="card hook-card reveal" key={i} style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="chip-row"><span className="chip good">Idée {i + 1}</span></div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16.5, letterSpacing: '-0.015em' }}>
                      {idea.title}
                    </p>
                    <p className="hook-text" style={{ fontSize: 14.5, fontWeight: 500 }}>{idea.hook}</p>
                    <div className="card-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(`${idea.title}\nHook : ${idea.hook}`);
                          toast('Idée copiée dans le presse-papiers');
                        }}
                      >
                        <Copy /> Copier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Bio optimisée */}
          {a.bioAdvice ? (
            <div className="script-block reveal">
              <h5>Bio optimisée, prête à coller <span>80 caractères max</span></h5>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <p style={{ fontSize: 15, color: 'var(--text)', flex: 1, minWidth: 200 }}>{a.bioAdvice}</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(a.bioAdvice!);
                    toast('Bio copiée — collez-la dans votre profil TikTok');
                  }}
                >
                  <Wand /> Copier la bio
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
