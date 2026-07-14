'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { readPrefs } from '@/lib/prefs-client';
import { toast } from '@/components/toaster';

type Mode = 'login' | 'signup';

/* Messages d'erreur Supabase les plus courants, traduits. */
function frenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('already registered')) return 'Un compte existe déjà avec cet email.';
  if (m.includes('at least 6 characters')) return 'Le mot de passe doit faire au moins 6 caractères.';
  if (m.includes('valid email')) return 'Adresse email invalide.';
  if (m.includes('rate limit')) return 'Trop de tentatives — réessayez dans quelques minutes.';
  if (m.includes('not confirmed')) return 'Email non confirmé — vérifiez votre boîte mail.';
  return message;
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return (
      <div className="empty">
        <h4>Supabase n&apos;est pas configuré</h4>
        <p>Renseignez les variables d&apos;environnement dans .env.local (voir .env.example).</p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        if (error) {
          setError(frenchError(error.message));
          return;
        }
        toast('Bon retour sur Signal');
        router.push('/');
        router.refresh();
      } else {
        const prefs = readPrefs();
        const { data, error } = await supabase!.auth.signUp({ email, password });
        if (error) {
          setError(frenchError(error.message));
          return;
        }
        if (data.session) {
          // Reprend les préférences de l'onboarding (cookie) dans le profil.
          await supabase!
            .from('profiles')
            .update({
              default_country: prefs.country,
              default_timeframe: prefs.tf,
              followed_niches: prefs.niches,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.session.user.id);
          toast('Compte créé — bienvenue sur Signal');
          router.push('/');
          router.refresh();
        } else {
          setNotice('Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.');
          setMode('login');
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card rail-card reveal" style={{ padding: 28 }}>
      <div className="panel-tabs" style={{ marginTop: 0, marginBottom: 22 }}>
        <button className={`panel-tab${mode === 'login' ? ' on' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
          Connexion
        </button>
        <button className={`panel-tab${mode === 'signup' ? ' on' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>
          Inscription
        </button>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
          />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Mot de passe</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? '6 caractères minimum' : '••••••••'}
          />
        </div>
        {error && (
          <p role="alert" style={{ color: 'var(--accent)', fontSize: 13 }}>{error}</p>
        )}
        {notice && (
          <p role="status" style={{ color: 'var(--green)', fontSize: 13 }}>{notice}</p>
        )}
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Un instant...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>
    </div>
  );
}
