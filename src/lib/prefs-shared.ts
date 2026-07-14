import { NICHES, resolveCountry, resolveTimeframe, type Timeframe } from '@/lib/data';

/* Préférences utilisateur : pays/période par défaut et niches suivies.
   Deux sources, toujours validées à la lecture :
   - cookie `sig-prefs` (visiteur non connecté, posé à l'onboarding) ;
   - table `profiles` Supabase (utilisateur connecté).
   Partagé serveur/client — la lecture vit dans prefs.ts (serveur)
   et prefs-client.ts (navigateur). */

export const PREFS_COOKIE = 'sig-prefs';

export interface Prefs {
  country: string;
  tf: Timeframe;
  niches: string[];
}

export const DEFAULT_NICHES = ['Finance', 'Cuisine', 'Marketing'];

export function normalizePrefs(data: {
  country?: unknown;
  tf?: unknown;
  niches?: unknown;
}): Prefs {
  const niches = Array.isArray(data.niches)
    ? data.niches.filter((n): n is string => typeof n === 'string' && NICHES.some((x) => x.name === n))
    : [];
  return {
    country: resolveCountry(typeof data.country === 'string' ? data.country : undefined),
    tf: resolveTimeframe(typeof data.tf === 'string' ? data.tf : undefined),
    niches: niches.length ? niches : DEFAULT_NICHES,
  };
}

export function parsePrefs(raw: string | undefined): Prefs {
  let data: Partial<Prefs> = {};
  if (raw) {
    try {
      data = JSON.parse(decodeURIComponent(raw));
    } catch {
      data = {};
    }
  }
  return normalizePrefs(data);
}
