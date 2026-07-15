'use client';

import { useState } from 'react';
import { fmt } from '@/lib/data';
import type { ProfileAnalysisResponse } from '@/lib/profile-analysis';
import { Radar, Sparkle, Check } from '@/components/icons';

/* Analyse de profil TikTok : colle ton @, l'IA lit ton profil public
   et détecte tes niches. Fallback : décrire son contenu en une phrase
   (profil privé, inexistant, ou TikTok inaccessible). */

export function ProfileAnalyzer({
  initialHandle = '',
  initialAnalysis = null,
  onAnalysis,
}: {
  initialHandle?: string;
  initialAnalysis?: ProfileAnalysisResponse['analysis'] | null;
  onAnalysis?: (result: ProfileAnalysisResponse) => void;
}) {
  const [handle, setHandle] = useState(initialHandle);
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'handle' | 'description'>('handle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProfileAnalysisResponse | null>(
    initialAnalysis ? { handle: initialHandle || null, nickname: null, stats: null, analysis: initialAnalysis } : null,
  );

  async function analyze() {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const body =
        mode === 'handle'
          ? { handle: handle.trim() }
          : { handle: handle.trim() || undefined, description: description.trim() };
      const res = await fetch('/api/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fallback === 'description') setMode('description');
        setError(data.error ?? 'Analyse impossible — réessayez.');
        return;
      }
      const typed = data as ProfileAnalysisResponse;
      setResult(typed);
      onAnalysis?.(typed);
    } catch {
      setError('Analyse impossible — vérifiez votre connexion.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="tt-handle">Votre @ TikTok</label>
          <input
            id="tt-handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@moncompte"
            autoComplete="off"
            onKeyDown={(e) => { if (e.key === 'Enter') analyze(); }}
          />
        </div>
        <button className="btn btn-primary" onClick={analyze} disabled={busy} style={{ flex: 'none' }}>
          <Radar /> {busy ? 'Analyse...' : 'Analyser mon profil'}
        </button>
      </div>

      {mode === 'description' && (
        <div className="field">
          <label htmlFor="tt-desc">Ou décrivez votre contenu en une phrase</label>
          <input
            id="tt-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. : je poste des chorégraphies de danse bachata et des tutos pour débutants"
            onKeyDown={(e) => { if (e.key === 'Enter') analyze(); }}
          />
        </div>
      )}

      {error && <p role="alert" style={{ color: 'var(--accent)', fontSize: 13 }}>{error}</p>}
      {busy && (
        <div className="ai-note" aria-live="polite">
          <Sparkle />
          <span>Lecture du profil et analyse en cours<span className="typing" style={{ padding: 0, marginLeft: 6 }}><i /><i /><i /></span></span>
        </div>
      )}

      {result && !busy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result.stats && (
            <div className="gen-facts" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="gen-fact"><span>Abonnés</span><b>{result.stats.followers !== null ? fmt(result.stats.followers) : '—'}</b></div>
              <div className="gen-fact"><span>Vidéos</span><b>{result.stats.videos !== null ? fmt(result.stats.videos) : '—'}</b></div>
              <div className="gen-fact"><span>Likes</span><b>{result.stats.likes !== null ? fmt(result.stats.likes) : '—'}</b></div>
            </div>
          )}
          <div className="ai-note">
            <Sparkle />
            <span>
              {result.analysis.summary}{' '}
              <strong>Niches détectées : {result.analysis.niches.join(', ')}.</strong>
            </span>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.analysis.advice.map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, color: 'var(--muted)', fontSize: 13.5 }}>
                <Check style={{ width: 13, height: 13, color: 'var(--green)', flex: 'none', marginTop: 4 }} />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
