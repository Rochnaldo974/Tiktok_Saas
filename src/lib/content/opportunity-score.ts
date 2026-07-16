import type { Video } from '@/lib/data';
import { DIFFICULTY_LABELS, SATURATION_LABELS } from '@/lib/data';
import type { PrimaryGoal } from './types';

/* Score d'opportunité — remplace le « score viral » dans toute l'UI.
   Déterministe et explicable : mesure le potentiel ACTUEL d'une
   tendance selon sa croissance, sa saturation, sa récence, sa facilité
   de production et sa pertinence pour le profil. Zéro aléatoire. */

export interface ScoreContext {
  niches: string[];
  primaryNiche: string | null;
  goal: PrimaryGoal | null;
}

export type OpportunityLevel = 'strong' | 'interesting' | 'evaluate' | 'low';

export const LEVEL_LABELS: Record<OpportunityLevel, string> = {
  strong: 'Forte opportunité',
  interesting: 'Opportunité intéressante',
  evaluate: 'À évaluer',
  low: 'Faible priorité',
};

export const SCORE_TOOLTIP =
  "Mesure le potentiel actuel d'une tendance selon sa croissance (30 %), sa faible saturation (20 %), sa récence (15 %), sa pertinence pour votre profil (15 %), sa facilité de production (10 %) et sa compatibilité avec votre objectif (10 %).";

export interface ScoreBreakdown {
  growth: number;
  saturation: number;
  recency: number;
  nicheRelevance: number;
  productionEase: number;
  goalFit: number;
}

export interface OpportunityScore {
  score: number;
  level: OpportunityLevel;
  breakdown: ScoreBreakdown;
}

export function scoreLevel(score: number): OpportunityLevel {
  if (score >= 85) return 'strong';
  if (score >= 70) return 'interesting';
  if (score >= 50) return 'evaluate';
  return 'low';
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/* Compatibilité objectif × type de contenu — table éditoriale, 60 = neutre. */
const GOAL_FIT: Record<PrimaryGoal, Record<string, number>> = {
  grow_audience: { Comédie: 95, Storytelling: 90, Réaction: 85, Lifestyle: 80, UGC: 70 },
  get_leads: { Éducatif: 95, Tutoriel: 90, Interview: 75, Storytelling: 70 },
  sell_product: { 'Test produit': 100, UGC: 90, Tutoriel: 75, Coulisses: 70 },
  build_authority: { Éducatif: 100, Interview: 85, Tutoriel: 85, Storytelling: 75 },
  find_clients: { Coulisses: 90, 'Test produit': 80, Éducatif: 80, Interview: 75 },
  boost_engagement: { Comédie: 95, Réaction: 90, Storytelling: 80, UGC: 75 },
};

export function computeOpportunityScore(v: Video, ctx: ScoreContext): OpportunityScore {
  /* bornes réelles du moteur : growth ∈ [25, 1900] */
  const growth = clamp(((v.growth - 25) / (1900 - 25)) * 100);
  const saturation = v.saturation === 'Low' ? 100 : v.saturation === 'Medium' ? 55 : 15;
  const recency = v.uploadedH <= 6 ? 100 : v.uploadedH <= 24 ? 80 : v.uploadedH <= 48 ? 55 : 30;
  const nicheRelevance =
    ctx.primaryNiche && v.niche === ctx.primaryNiche
      ? 100
      : ctx.niches.includes(v.niche)
        ? 75
        : 30;
  const productionEase = v.difficulty === 'Easy' ? 100 : v.difficulty === 'Medium' ? 60 : 25;
  const goalFit = ctx.goal ? (GOAL_FIT[ctx.goal][v.contentType] ?? 60) : 60;

  let score = Math.round(
    0.3 * growth +
      0.2 * saturation +
      0.15 * recency +
      0.15 * nicheRelevance +
      0.1 * productionEase +
      0.1 * goalFit,
  );
  /* Une tendance saturée ne peut pas être une « forte opportunité ». */
  if (v.status === 'Saturated' || v.saturation === 'High') score = Math.min(score, 80);
  score = clamp(score, 1, 100);

  return {
    score,
    level: scoreLevel(score),
    breakdown: { growth, saturation, recency, nicheRelevance, productionEase, goalFit },
  };
}

/* Raison personnalisée affichée sur les cartes — courte, concrète,
   jamais exagérée. */
export function personalReason(v: Video, ctx: ScoreContext): string {
  const parts: string[] = [];
  if (ctx.primaryNiche && v.niche === ctx.primaryNiche) {
    parts.push('dans votre niche principale');
  } else if (ctx.niches.includes(v.niche)) {
    parts.push(`dans votre niche ${v.niche}`);
  } else {
    parts.push(`format transposable depuis ${v.niche}`);
  }
  if (v.saturation === 'Low') parts.push('encore peu saturé');
  else if (v.saturation === 'High') parts.push(`saturation ${SATURATION_LABELS[v.saturation].toLowerCase()}`);
  if (v.difficulty === 'Easy') parts.push(`réalisable en ${v.prodTime.toLowerCase()} sans montage complexe`);
  else parts.push(`production ${DIFFICULTY_LABELS[v.difficulty].toLowerCase()} (${v.prodTime.toLowerCase()})`);
  const sentence = parts.join(', ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}
