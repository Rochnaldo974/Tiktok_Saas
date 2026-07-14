import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';
import { parsePrefs, normalizePrefs, PREFS_COOKIE, type Prefs } from '@/lib/prefs-shared';
import { getSupabaseServer } from '@/lib/supabase/server';

export type { Prefs };

export interface PrefsState {
  prefs: Prefs;
  /* faux uniquement pour un visiteur sans cookie ni compte → onboarding */
  configured: boolean;
  user: User | null;
}

/* Connecté : préférences lues depuis `profiles` (source de vérité).
   Sinon : cookie `sig-prefs` ; absent → première visite. */
export async function getPrefsState(): Promise<PrefsState> {
  const supabase = await getSupabaseServer();
  if (supabase) {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_country, default_timeframe, followed_niches')
        .eq('id', auth.user.id)
        .single();
      if (profile) {
        return {
          prefs: normalizePrefs({
            country: profile.default_country,
            tf: profile.default_timeframe,
            niches: profile.followed_niches,
          }),
          configured: true,
          user: auth.user,
        };
      }
      // Profil manquant (ne devrait pas arriver : trigger d'inscription).
      const store = await cookies();
      return { prefs: parsePrefs(store.get(PREFS_COOKIE)?.value), configured: true, user: auth.user };
    }
  }
  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  return { prefs: parsePrefs(raw), configured: raw !== undefined, user: null };
}

export async function getPrefs(): Promise<Prefs> {
  return (await getPrefsState()).prefs;
}
