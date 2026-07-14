import { cookies } from 'next/headers';
import { parsePrefs, PREFS_COOKIE, type Prefs } from '@/lib/prefs-shared';

export type { Prefs };

export async function getPrefs(): Promise<Prefs> {
  const store = await cookies();
  return parsePrefs(store.get(PREFS_COOKIE)?.value);
}
