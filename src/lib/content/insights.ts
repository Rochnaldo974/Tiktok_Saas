import type { GeneratedContent, PerformanceMetrics } from './types';
import { GOAL_LABELS } from './types';

/* Enseignements dérivés des métriques SAISIES par l'utilisateur.
   Prudence obligatoire : avec si peu de données, on formule des pistes,
   jamais des conclusions définitives. */

export function deriveInsights(
  content: GeneratedContent,
  metrics: PerformanceMetrics,
): string[] {
  const out: string[] = [];
  const views = metrics.views ?? 0;

  if (views > 0 && metrics.likes !== null) {
    const likeRate = (metrics.likes / views) * 100;
    if (likeRate >= 8) {
      out.push(
        `Fort taux de likes (${likeRate.toFixed(1)} %) : le sujet touche juste — testez une version plus courte ou une partie 2.`,
      );
    } else if (likeRate < 3) {
      out.push(
        `Taux de likes modeste (${likeRate.toFixed(1)} %) : le hook attire mais la promesse semble insuffisamment tenue — renforcez la révélation.`,
      );
    }
  }
  if (views > 0 && metrics.comments !== null && metrics.comments / views >= 0.005) {
    out.push('Cette publication génère plus de commentaires que la moyenne — répondez-y en vidéo pour prolonger la portée.');
  }
  if (views > 0 && metrics.shares !== null && metrics.shares / views >= 0.01) {
    out.push('Le taux de partage est un signal fort : ce format mérite une déclinaison en série.');
  }
  if (metrics.followersGained !== null && metrics.followersGained > 0) {
    out.push(`+${metrics.followersGained} abonné${metrics.followersGained > 1 ? 's' : ''} sur cette vidéo — le sujet recrute, gardez cet angle.`);
  }
  if (content.objective === 'get_leads' || content.objective === 'find_clients' || content.objective === 'sell_product') {
    if (metrics.leads !== null && metrics.leads > 0) {
      out.push(`${metrics.leads} prospect${metrics.leads > 1 ? 's' : ''} — votre objectif « ${GOAL_LABELS[content.objective]} » est servi ; doublez sur ce CTA.`);
    } else {
      out.push(`Aucun prospect saisi pour l'instant : rendez le CTA plus explicite sur la prochaine version (objectif « ${GOAL_LABELS[content.objective]} »).`);
    }
  }
  if (!out.length) {
    out.push('Les données saisies sont encore limitées — republiez un format proche pour comparer, puis tirez une conclusion.');
  }
  return out.slice(0, 3);
}
