import type { Hook, Sound, Video } from '@/lib/data';
import { hashStr, mulberry32 } from '@/lib/data';
import type { GeneratedContent, UserProfile } from './types';
import {
  computeOpportunityScore,
  personalReason,
  type OpportunityScore,
  type ScoreContext,
} from './opportunity-score';

/* Logique de la page Aujourd'hui : mission du jour (états A–I), top 3
   des opportunités, « depuis votre dernière visite », progression.
   Tout est PUR et déterministe pour une même journée (seed par date +
   profil) — jamais de Math.random() au rendu. */

export function dayKeyOf(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function daySeed(dateKey: string, primaryNiche: string, country: string): number {
  return hashStr(`${dateKey}|${primaryNiche}|${country}`);
}

/* ---------- top 3 opportunités ---------- */

export type RankTag = 'best' | 'easiest' | 'least_saturated';

export const RANK_TAG_LABELS: Record<RankTag, string> = {
  best: 'Meilleure opportunité',
  easiest: 'Plus simple à produire',
  least_saturated: 'Moins saturée',
};

export interface RankedOpportunity {
  video: Video;
  score: OpportunityScore;
  reason: string;
  tag: RankTag;
}

export function pickTopThree(videos: Video[], ctx: ScoreContext): RankedOpportunity[] {
  if (!videos.length) return [];
  const scored = videos
    .map((video) => ({ video, score: computeOpportunityScore(video, ctx) }))
    .sort((a, b) => b.score.score - a.score.score || a.video.id.localeCompare(b.video.id));

  const out: RankedOpportunity[] = [];
  const used = new Set<string>();
  const take = (tag: RankTag, candidate?: { video: Video; score: OpportunityScore }) => {
    if (!candidate || used.has(candidate.video.id)) return;
    used.add(candidate.video.id);
    out.push({ ...candidate, tag, reason: personalReason(candidate.video, ctx) });
  };

  take('best', scored[0]);
  take(
    'easiest',
    scored.find(
      (s) =>
        !used.has(s.video.id) &&
        s.video.difficulty === 'Easy' &&
        (s.video.prodTime === '15 min' || s.video.prodTime === '35 min'),
    ) ?? scored.find((s) => !used.has(s.video.id)),
  );
  take(
    'least_saturated',
    scored.find((s) => !used.has(s.video.id) && s.video.saturation === 'Low') ??
      scored.find((s) => !used.has(s.video.id)),
  );
  return out;
}

/* ---------- mission du jour (états A–I) ---------- */

export type MissionState = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type MissionAction =
  | 'adapt_top'
  | 'open_content'
  | 'verify'
  | 'view_corrections'
  | 'mark_published'
  | 'add_metrics'
  | 'prepare_tomorrow'
  | 'see_opportunities';

export interface Mission {
  state: MissionState;
  eyebrow: string;
  title: string;
  message: string;
  primary: { label: string; action: MissionAction };
  secondary: { label: string; action: MissionAction } | null;
  contentId: string | null;
  /* nudge affiché en 2e visite sans action — jamais la même intro */
  softNudge: string | null;
}

/* Ordre de priorité : le contenu du jour le plus avancé non terminé. */
const ACTIVE_PRIORITY: GeneratedContent['status'][] = [
  'corrections_needed',
  'video_uploaded',
  'review_in_progress',
  'ready_to_publish',
  'filming',
  'to_film',
  'script_ready',
  'script_draft',
  'idea',
];

/* Toujours comparer en jour LOCAL : les ISO sont en UTC, et à 00h47 à
   Paris un contenu créé « hier » en UTC est bien d'aujourd'hui. */
function localDay(iso: string): string {
  return dayKeyOf(new Date(iso));
}

function isFromToday(c: GeneratedContent, dateKey: string): boolean {
  return localDay(c.createdAt) === dateKey || localDay(c.updatedAt) === dateKey;
}

export function buildMission(
  contents: GeneratedContent[],
  profile: UserProfile | null,
  dateKey: string,
  visitsToday: number,
): Mission {
  const publishedToday = contents.filter(
    (c) => c.publishedAt && localDay(c.publishedAt) === dateKey,
  );
  const active = ACTIVE_PRIORITY.map((status) =>
    contents.find((c) => c.status === status && isFromToday(c, dateKey)),
  ).find(Boolean);

  const lateVisit = new Date().getHours() >= 19;
  const multiDaily = profile?.postingFrequency === 'multiple_daily';

  /* État H/I — publié aujourd'hui */
  if (publishedToday.length > 0 && (!active || !multiDaily)) {
    const withMetrics = publishedToday.find((c) => c.performanceMetrics);
    if (withMetrics) {
      return {
        state: 'I',
        eyebrow: 'Vos premiers signaux',
        title: 'Vos premiers résultats sont là.',
        message:
          'Comparez-les à votre objectif et transformez ce que vous apprenez en une meilleure version.',
        primary: { label: 'Voir les enseignements', action: 'add_metrics' },
        secondary: { label: 'Préparer une meilleure version', action: 'prepare_tomorrow' },
        contentId: withMetrics.id,
        softNudge: null,
      };
    }
    return {
      state: 'H',
      eyebrow: 'Contenu du jour publié',
      title: 'Votre vidéo est en ligne.',
      message: lateVisit
        ? 'Prenez une longueur d’avance sur demain.'
        : multiDaily
          ? 'Vous publiez plusieurs fois par jour : préparez un format complémentaire, pas un clone.'
          : 'Rien ne presse : ajoutez vos premiers résultats quand ils arrivent, ou préparez demain.',
      primary: { label: 'Préparer demain', action: 'prepare_tomorrow' },
      secondary: { label: 'Ajouter mes premiers résultats', action: 'add_metrics' },
      contentId: publishedToday[0].id,
      softNudge: null,
    };
  }

  if (active) {
    const base = { contentId: active.id, softNudge: null as string | null };
    switch (active.status) {
      case 'idea':
        return {
          state: 'B',
          eyebrow: 'Votre mission du jour',
          title: 'Vous avez choisi votre opportunité.',
          message: 'Transformez-la maintenant en concept original adapté à votre activité.',
          primary: { label: 'Adapter cette idée', action: 'open_content' },
          secondary: { label: 'Choisir une autre opportunité', action: 'see_opportunities' },
          ...base,
        };
      case 'script_draft':
        return {
          state: 'C',
          eyebrow: 'Votre mission du jour',
          title: 'Votre script est en cours.',
          message: 'Terminez le hook, les scènes et le CTA avant de passer au tournage.',
          primary: { label: 'Continuer le script', action: 'open_content' },
          secondary: { label: 'Choisir une autre opportunité', action: 'see_opportunities' },
          ...base,
        };
      case 'script_ready':
      case 'to_film':
      case 'filming':
        return {
          state: 'D',
          eyebrow: 'Votre mission du jour',
          title: 'Votre contenu est prêt à tourner.',
          message: `« ${active.title} » — ${active.duration} s, ${active.productionTime} de production estimée.`,
          primary: { label: 'Ouvrir le script', action: 'open_content' },
          secondary: { label: 'Marquer comme tournée', action: 'verify' },
          ...base,
        };
      case 'video_uploaded':
      case 'review_in_progress':
        return {
          state: 'E',
          eyebrow: 'Votre mission du jour',
          title: 'Votre vidéo est-elle prête à être publiée ?',
          message: 'Vérifiez le hook, la durée, le rythme et le CTA — ou passez directement à la publication.',
          primary: { label: 'Vérifier ma vidéo', action: 'verify' },
          secondary: { label: 'Marquer comme publiée', action: 'mark_published' },
          ...base,
        };
      case 'corrections_needed':
        return {
          state: 'F',
          eyebrow: 'Votre mission du jour',
          title: `${active.videoReview?.issues.length ?? 3} amélioration${(active.videoReview?.issues.length ?? 3) > 1 ? 's' : ''} recommandée${(active.videoReview?.issues.length ?? 3) > 1 ? 's' : ''}.`,
          message: active.videoReview?.issues[0] ?? 'Quelques ajustements avant publication.',
          primary: { label: 'Voir les corrections', action: 'view_corrections' },
          secondary: { label: 'Marquer comme corrigée', action: 'mark_published' },
          ...base,
        };
      case 'ready_to_publish':
        return {
          state: 'G',
          eyebrow: 'Votre mission du jour',
          title: 'Votre vidéo est prête à publier.',
          message: `Créneau suggéré : ${active.suggestedTime}. Marquez-la publiée quand c'est fait — Signal ne publie pas à votre place.`,
          primary: { label: 'Marquer comme publiée', action: 'mark_published' },
          secondary: { label: 'Revoir le rapport', action: 'view_corrections' },
          ...base,
        };
      default:
        break;
    }
  }

  /* État A — rien de préparé aujourd'hui */
  const weeklyPace =
    profile?.postingFrequency === 'one_two_week' || profile?.postingFrequency === 'three_four_week';
  return {
    state: 'A',
    eyebrow: 'Votre mission du jour',
    title: weeklyPace ? 'Aujourd’hui, préparez votre prochaine publication.' : 'Préparons votre prochain contenu.',
    message:
      'Signal a sélectionné une opportunité adaptée à votre niche, votre objectif et votre marché.',
    primary: { label: 'Préparer mon contenu', action: 'adapt_top' },
    secondary: { label: 'Voir les 3 opportunités', action: 'see_opportunities' },
    contentId: null,
    softNudge:
      visitsToday > 1 ? 'Votre recommandation vous attend — besoin d’une option plus simple ? Ouvrez les opportunités et triez par « Faciles à produire ».' : null,
  };
}

/* ---------- depuis votre dernière visite ---------- */

export interface VisitChange {
  kind: 'video' | 'sound' | 'hook';
  text: string;
}

export function sinceLastVisit(
  lastVisitAt: string | null,
  videos: Video[],
  sounds: Sound[],
  hooks: Hook[],
  seed: number,
): VisitChange[] {
  if (!lastVisitAt) return [];
  const rnd = mulberry32(seed);
  const out: VisitChange[] = [];
  const rising = videos.find((v) => v.status === 'Growing' || v.status === 'New');
  if (rising) {
    out.push({
      kind: 'video',
      text: `Le format « ${rising.title.slice(0, 60)} » gagne en popularité dans votre périmètre.`,
    });
  }
  const sound = sounds[Math.floor(rnd() * Math.max(1, Math.min(sounds.length, 4)))];
  if (sound) {
    out.push({
      kind: 'sound',
      text: sound.real
        ? `Le son « ${sound.name} » porte ${sound.trendCount ?? 1} tendance${(sound.trendCount ?? 1) > 1 ? 's' : ''} de vos niches cette semaine.`
        : `Le son « ${sound.name} » approche de sa fenêtre de saturation.`,
    });
  }
  const freshCount = videos.filter((v) => v.uploadedH <= 48).length;
  if (freshCount > 1) {
    out.push({
      kind: 'hook',
      text: `${freshCount} nouvelles opportunités sont apparues dans vos niches.`,
    });
  } else if (hooks[0]) {
    out.push({ kind: 'hook', text: `Nouvelle accroche repérée : « ${hooks[0].text.slice(0, 70)} »` });
  }
  return out.slice(0, 3);
}

/* ---------- progression du jour ---------- */

export const PROGRESS_STEPS = [
  'Opportunité choisie',
  'Script préparé',
  'Vidéo tournée',
  'Vérification effectuée',
  'Publication confirmée',
  'Résultats analysés',
] as const;

export function progressIndex(contents: GeneratedContent[], dateKey: string): number {
  const today = contents.filter((c) => isFromToday(c, dateKey));
  if (!today.length) return 0;
  const has = (statuses: GeneratedContent['status'][]) =>
    today.some((c) => statuses.includes(c.status));
  if (today.some((c) => c.performanceMetrics)) return 6;
  if (has(['published', 'performance_pending', 'performance_available'])) return 5;
  if (today.some((c) => c.videoReview) && has(['ready_to_publish'])) return 4;
  if (has(['video_uploaded', 'review_in_progress', 'corrections_needed', 'ready_to_publish'])) return 3;
  if (has(['script_ready', 'to_film', 'filming'])) return 2;
  return 1;
}
