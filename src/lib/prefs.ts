import { cookies } from 'next/headers';
import { parsePrefs, PREFS_COOKIE, type Prefs } from '@/lib/prefs-shared';

export type { Prefs };

export async function getPrefs(): Promise<Prefs> {
  const store = await cookies();
  return parsePrefs(store.get(PREFS_COOKIE)?.value);
}

/* Distingue « cookie absent » (première visite → onboarding) des
   préférences réellement choisies par l'utilisateur. */
export async function getPrefsState(): Promise<{ prefs: Prefs; configured: boolean }> {
  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  return { prefs: parsePrefs(raw), configured: raw !== undefined };
}
