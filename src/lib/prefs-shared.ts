import { resolveCountry, resolveTimeframe, type Timeframe } from '@/lib/data';

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
export const MAX_NICHES = 8;

/* Les niches sont libres (la danseuse, le potier, le barbier ont leur
   place) — mais toujours validées : longueur bornée, charset restreint
   (pas de séparateurs de cache ni d'injection possible). */
export function sanitizeNiche(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/\s+/g, ' ').slice(0, 30);
  if (cleaned.length < 2) return null;
  if (!/^[\p{L}\p{N} '’&\-/.]+$/u.test(cleaned)) return null;
  return cleaned[0].toUpperCase() + cleaned.slice(1);
}

export function normalizeNiches(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: string[] = [];
  for (const item of list) {
    const clean = sanitizeNiche(item);
    if (clean && !out.includes(clean)) out.push(clean);
    if (out.length >= MAX_NICHES) break;
  }
  return out;
}

export function normalizePrefs(data: {
  country?: unknown;
  tf?: unknown;
  niches?: unknown;
}): Prefs {
  const niches = normalizeNiches(data.niches);
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
