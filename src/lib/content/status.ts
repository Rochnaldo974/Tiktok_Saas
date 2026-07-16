import type { ContentStatus } from './types';

/* Machine d'états du contenu : le statut détermine le message affiché,
   le CTA principal, les actions secondaires, la carte sur Aujourd'hui
   et la section dans Mes contenus. Les transitions sont validées —
   jamais de saut d'étape silencieux. */

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  idea: 'Idée',
  script_draft: 'Script en cours',
  script_ready: 'Script prêt',
  to_film: 'À tourner',
  filming: 'Tournage en cours',
  video_uploaded: 'Vidéo à vérifier',
  review_in_progress: 'Vérification en cours',
  corrections_needed: 'Corrections conseillées',
  ready_to_publish: 'Prête à publier',
  published: 'Publiée',
  performance_pending: 'Résultats à venir',
  performance_available: 'Résultats disponibles',
  archived: 'Archivée',
};

export type ContentSection = 'prepare' | 'film' | 'review' | 'publish' | 'published';

export const SECTION_ORDER: readonly ContentSection[] = [
  'prepare',
  'film',
  'review',
  'publish',
  'published',
] as const;

export const SECTION_LABELS: Record<ContentSection, string> = {
  prepare: 'À préparer',
  film: 'À tourner',
  review: 'À vérifier',
  publish: 'Prêtes à publier',
  published: 'Publiées',
};

export type CtaKind =
  | 'open_script'
  | 'finish_script'
  | 'mark_ready'
  | 'start_filming'
  | 'mark_filmed'
  | 'verify_video'
  | 'skip_review'
  | 'view_corrections'
  | 'mark_corrected'
  | 'mark_published'
  | 'add_metrics'
  | 'view_insights'
  | 'duplicate';

export interface StatusMeta {
  section: ContentSection;
  message: string;
  primaryCta: { label: string; kind: CtaKind };
  secondary: { label: string; kind: CtaKind }[];
  next: ContentStatus[];
}

export const STATUS_META: Record<ContentStatus, StatusMeta> = {
  idea: {
    section: 'prepare',
    message: 'Une opportunité choisie, un script à générer.',
    primaryCta: { label: 'Générer le script', kind: 'open_script' },
    secondary: [],
    next: ['script_draft', 'script_ready', 'archived'],
  },
  script_draft: {
    section: 'prepare',
    message: 'Terminez le hook, les scènes et le CTA.',
    primaryCta: { label: 'Continuer le script', kind: 'finish_script' },
    secondary: [{ label: 'Marquer le script prêt', kind: 'mark_ready' }],
    next: ['script_ready', 'archived'],
  },
  script_ready: {
    section: 'film',
    message: 'Votre contenu est prêt à tourner.',
    primaryCta: { label: 'Ouvrir le script', kind: 'open_script' },
    secondary: [{ label: 'Marquer comme tournée', kind: 'mark_filmed' }],
    next: ['to_film', 'filming', 'script_draft', 'archived'],
  },
  to_film: {
    section: 'film',
    message: 'Tout est prêt : décor, lumière, script.',
    primaryCta: { label: 'Ouvrir le script', kind: 'open_script' },
    secondary: [{ label: 'Marquer comme tournée', kind: 'mark_filmed' }],
    next: ['filming', 'archived'],
  },
  filming: {
    section: 'film',
    message: 'Tournage en cours — bonne prise !',
    primaryCta: { label: 'Marquer comme tournée', kind: 'mark_filmed' },
    secondary: [{ label: 'Ouvrir le script', kind: 'open_script' }],
    next: ['video_uploaded', 'ready_to_publish', 'archived'],
  },
  video_uploaded: {
    section: 'review',
    message: 'Vérifiez le hook, la durée, le rythme et le CTA avant de publier.',
    primaryCta: { label: 'Vérifier ma vidéo', kind: 'verify_video' },
    secondary: [{ label: 'Passer la vérification', kind: 'skip_review' }],
    next: ['review_in_progress', 'ready_to_publish', 'archived'],
  },
  review_in_progress: {
    section: 'review',
    message: 'Vérification en cours.',
    primaryCta: { label: 'Reprendre la vérification', kind: 'verify_video' },
    secondary: [{ label: 'Passer la vérification', kind: 'skip_review' }],
    next: ['corrections_needed', 'ready_to_publish', 'archived'],
  },
  corrections_needed: {
    section: 'review',
    message: 'Quelques améliorations sont recommandées avant publication.',
    primaryCta: { label: 'Voir les corrections', kind: 'view_corrections' },
    secondary: [{ label: 'Marquer comme corrigée', kind: 'mark_corrected' }],
    next: ['filming', 'ready_to_publish', 'archived'],
  },
  ready_to_publish: {
    section: 'publish',
    message: 'Votre vidéo est prête à publier.',
    primaryCta: { label: 'Marquer comme publiée', kind: 'mark_published' },
    secondary: [{ label: 'Revoir le rapport', kind: 'view_corrections' }],
    next: ['published', 'archived'],
  },
  published: {
    section: 'published',
    message: 'Publiée — ajoutez vos premiers résultats quand ils arrivent.',
    primaryCta: { label: 'Ajouter les résultats', kind: 'add_metrics' },
    secondary: [{ label: 'Créer une variante', kind: 'duplicate' }],
    next: ['performance_pending', 'performance_available', 'archived'],
  },
  performance_pending: {
    section: 'published',
    message: 'Résultats en attente — revenez les saisir quand vous les avez.',
    primaryCta: { label: 'Ajouter les résultats', kind: 'add_metrics' },
    secondary: [{ label: 'Créer une variante', kind: 'duplicate' }],
    next: ['performance_available', 'archived'],
  },
  performance_available: {
    section: 'published',
    message: 'Premiers résultats disponibles.',
    primaryCta: { label: 'Voir les enseignements', kind: 'view_insights' },
    secondary: [{ label: 'Préparer une meilleure version', kind: 'duplicate' }],
    next: ['archived'],
  },
  archived: {
    section: 'published',
    message: 'Archivée.',
    primaryCta: { label: 'Dupliquer', kind: 'duplicate' },
    secondary: [],
    next: [],
  },
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return STATUS_META[from].next.includes(to);
}

export function sectionOf(status: ContentStatus): ContentSection {
  return STATUS_META[status].section;
}
