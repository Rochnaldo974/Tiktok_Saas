import { NICHES, resolveCountry, resolveTimeframe, type Timeframe } from '@/lib/data';

/* Préférences utilisateur (cookie `sig-prefs`, non sensible) :
   pays/période par défaut quand l'URL ne précise rien, et niches
   suivies pour la page Alertes. Toujours validées à la lecture.
   Partagé serveur/client — la lecture des cookies vit dans
   prefs.ts (serveur) et prefs-client.ts (navigateur). */

export const PREFS_COOKIE = 'sig-prefs';

export interface Prefs {
  country: string;
  tf: Timeframe;
  niches: string[];
}

export const DEFAULT_NICHES = ['Finance', 'Cuisine', 'Marketing'];

export function parsePrefs(raw: string | undefined): Prefs {
  let data: Partial<Prefs> = {};
  if (raw) {
    try {
      data = JSON.parse(decodeURIComponent(raw));
    } catch {
      data = {};
    }
  }
  const niches = Array.isArray(data.niches)
    ? data.niches.filter((n) => NICHES.some((x) => x.name === n)).slice(0, NICHES.length)
    : [];
  return {
    country: resolveCountry(typeof data.country === 'string' ? data.country : undefined),
    tf: resolveTimeframe(typeof data.tf === 'string' ? data.tf : undefined),
    niches: niches.length ? niches : DEFAULT_NICHES,
  };
}
