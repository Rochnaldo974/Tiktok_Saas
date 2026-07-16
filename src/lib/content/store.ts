import type {
  ContentStatus,
  GeneratedContent,
  PostingFrequency,
  PrimaryGoal,
  TiktokConnectionType,
  UserProfile,
} from './types';
import { canTransition } from './status';
import { track } from '@/lib/analytics';

/* Store localStorage du cycle de création — client uniquement, aucun
   compte requis. Snapshots mémoïsés (référence stable, exigée par
   useSyncExternalStore) ; invalidation par événement custom
   `signal:store` (même onglet) + `storage` (autres onglets).
   JAMAIS de binaire vidéo ici : métadonnées seulement. */

const PROFILE_KEY = 'signal:profile:v1';
const CONTENTS_KEY = 'signal:contents:v1';
const STORE_EVENT = 'signal:store';

const isBrowser = () => typeof window !== 'undefined';

let profileCache: UserProfile | null = null;
let contentsCache: GeneratedContent[] | null = null;

const EMPTY_CONTENTS: GeneratedContent[] = [];

function invalidate(): void {
  profileCache = null;
  contentsCache = null;
  if (isBrowser()) window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

export function subscribeStore(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROFILE_KEY || e.key === CONTENTS_KEY || e.key === null) {
      profileCache = null;
      contentsCache = null;
      cb();
    }
  };
  window.addEventListener(STORE_EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(STORE_EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota plein ou stockage bloqué : l'app continue sans persister */
  }
}

export function getProfileSnapshot(): UserProfile | null {
  if (!isBrowser()) return null;
  if (profileCache === null) profileCache = readJson<UserProfile>(PROFILE_KEY);
  return profileCache;
}

export function getContentsSnapshot(): GeneratedContent[] {
  if (!isBrowser()) return EMPTY_CONTENTS;
  if (contentsCache === null) {
    const list = readJson<GeneratedContent[]>(CONTENTS_KEY);
    contentsCache = Array.isArray(list) ? list : EMPTY_CONTENTS;
  }
  return contentsCache;
}

function persistContents(list: GeneratedContent[]): void {
  writeJson(CONTENTS_KEY, list);
  invalidate();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/* ---------- profil ---------- */

export interface OnboardingResult {
  primaryNiche: string;
  secondaryNiches: string[];
  market: string;
  primaryGoal: PrimaryGoal;
  postingFrequency: PostingFrequency;
  tiktokHandle: string | null;
  tiktokConnectionType: TiktokConnectionType;
}

function defaultProfile(): UserProfile {
  const now = nowIso();
  return {
    primaryNiche: '',
    secondaryNiches: [],
    market: 'France',
    language: 'fr',
    primaryGoal: 'grow_audience',
    tiktokHandle: null,
    tiktokConnectionType: 'none',
    postingFrequency: 'three_four_week',
    onboardingCompleted: false,
    savedOpportunityIds: [],
    lastVisitAt: null,
    lastVisitDay: null,
    visitsToday: 0,
    contentPublishedToday: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function saveProfile(patch: Partial<UserProfile>): UserProfile {
  const current = getProfileSnapshot() ?? defaultProfile();
  const next: UserProfile = { ...current, ...patch, updatedAt: nowIso() };
  writeJson(PROFILE_KEY, next);
  invalidate();
  return next;
}

export function completeOnboarding(input: OnboardingResult): UserProfile {
  const profile = saveProfile({
    ...input,
    language: 'fr',
    onboardingCompleted: true,
  });
  track('onboarding_completed', {
    niche: input.primaryNiche,
    goal: input.primaryGoal,
    market: input.market,
    tiktok: input.tiktokConnectionType,
  });
  return profile;
}

export function toggleSavedOpportunity(id: string): boolean {
  const profile = getProfileSnapshot() ?? defaultProfile();
  const saved = profile.savedOpportunityIds.includes(id);
  saveProfile({
    savedOpportunityIds: saved
      ? profile.savedOpportunityIds.filter((s) => s !== id)
      : [...profile.savedOpportunityIds, id],
  });
  return !saved;
}

/* La visite précédente de CETTE session (fige la valeur d'avant
   l'écriture de recordVisit) — lisible pendant le rendu, mise à jour
   via l'événement store. */
let sessionPreviousVisitAt: string | null = null;
export function getSessionPreviousVisit(): string | null {
  return sessionPreviousVisitAt;
}

/* Enregistre une visite ; réinitialise le compteur quand le jour change.
   À appeler UNIQUEMENT depuis un useEffect (jamais pendant le rendu). */
export function recordVisit(now: Date = new Date()): {
  visitsToday: number;
  previousVisitAt: string | null;
} {
  const profile = getProfileSnapshot() ?? defaultProfile();
  const today = dayKey(now);
  const sameDay = profile.lastVisitDay === today;
  const previousVisitAt = profile.lastVisitAt;
  sessionPreviousVisitAt = previousVisitAt;
  saveProfile({
    lastVisitAt: now.toISOString(),
    lastVisitDay: today,
    visitsToday: sameDay ? profile.visitsToday + 1 : 1,
    contentPublishedToday: sameDay ? profile.contentPublishedToday : 0,
  });
  return { visitsToday: sameDay ? profile.visitsToday + 1 : 1, previousVisitAt };
}

/* ---------- contenus ---------- */

export type ContentDraft = Omit<GeneratedContent, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: ContentStatus;
};

export function addContent(draft: ContentDraft): GeneratedContent {
  const now = nowIso();
  const content: GeneratedContent = {
    ...draft,
    id: crypto.randomUUID(),
    status: draft.status ?? 'script_ready',
    createdAt: now,
    updatedAt: now,
  };
  persistContents([content, ...getContentsSnapshot()]);
  track('content_added', { status: content.status, niche: content.niche });
  return content;
}

export function updateContent(
  id: string,
  patch: Partial<GeneratedContent>,
): GeneratedContent | null {
  const list = getContentsSnapshot();
  const index = list.findIndex((c) => c.id === id);
  if (index < 0) return null;
  const next: GeneratedContent = { ...list[index], ...patch, id, updatedAt: nowIso() };
  const copy = [...list];
  copy[index] = next;
  persistContents(copy);
  return next;
}

/* Change le statut en validant la transition ; gère les effets de bord
   (publishedAt, compteur du jour, passage auto en résultats). */
export function setContentStatus(id: string, status: ContentStatus): GeneratedContent | null {
  const current = getContentsSnapshot().find((c) => c.id === id);
  if (!current || current.status === status) return current ?? null;
  if (!canTransition(current.status, status)) return null;
  const patch: Partial<GeneratedContent> = { status };
  if (status === 'published') {
    patch.publishedAt = nowIso();
    const profile = getProfileSnapshot();
    if (profile) {
      saveProfile({ contentPublishedToday: profile.contentPublishedToday + 1 });
    }
  }
  const next = updateContent(id, patch);
  if (next) track('content_status_changed', { from: current.status, to: status });
  return next;
}

export function duplicateContent(id: string): GeneratedContent | null {
  const source = getContentsSnapshot().find((c) => c.id === id);
  if (!source) return null;
  const copy = addContent({
    ...source,
    title: `${source.title} — variante`,
    status: 'script_ready',
    scheduledBucket: null,
    scheduledDate: null,
    videoMetadata: null,
    videoReview: null,
    publishedAt: null,
    publishedUrl: null,
    performanceMetrics: null,
    performanceInsights: [],
    filmingChecklist: source.filmingChecklist.map((i) => ({ ...i, done: false })),
  });
  track('content_duplicated', { source: id });
  return copy;
}

export function removeContent(id: string): void {
  persistContents(getContentsSnapshot().filter((c) => c.id !== id));
  track('content_deleted', {});
}

/* Réinitialisation complète (Réglages → réinitialiser l'onboarding). */
export function resetAll(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(PROFILE_KEY);
    window.localStorage.removeItem(CONTENTS_KEY);
  } catch {
    /* rien à faire */
  }
  invalidate();
  track('onboarding_reset', {});
}
