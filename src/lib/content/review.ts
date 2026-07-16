import type {
  AnalysisMode,
  GeneratedContent,
  ReviewCheck,
  UserProfile,
  VideoMetadata,
  VideoReview,
} from './types';

/* Vérification de la vidéo tournée — HONNÊTE par construction.
   Le prototype n'a pas d'analyse multimodale : le rapport est dérivé
   d'une checklist remplie par l'utilisateur + des métadonnées
   objectives du fichier (durée, orientation). L'interface
   VideoReviewService permet de brancher plus tard une vraie analyse
   (analysisMode: 'multimodal_ai') sans réécrire l'UI. */

export interface ChecklistQuestion {
  id: string;
  label: string;
  strength: string; // affiché dans « Points réussis » si oui
  issue: string; // titre de l'amélioration si non
  recommendation: string; // conseil concret si non
}

export const REVIEW_QUESTIONS: ChecklistQuestion[] = [
  {
    id: 'hook_early',
    label: 'Le hook apparaît-il dans les deux premières secondes ?',
    strength: 'Hook immédiat',
    issue: 'Faites apparaître le hook plus tôt.',
    recommendation: 'Il devrait être visible ou prononcé dans les 1,5 premières secondes.',
  },
  {
    id: 'promise_fast',
    label: 'Montrez-vous le résultat ou la promesse rapidement ?',
    strength: 'Promesse visible dès le début',
    issue: 'Montrez la promesse plus tôt.',
    recommendation: 'Insérez 1 seconde du résultat final avant l’explication.',
  },
  {
    id: 'duration_ok',
    label: 'La vidéo dure-t-elle moins que la durée prévue au script ?',
    strength: 'Durée maîtrisée',
    issue: 'Raccourcissez la vidéo.',
    recommendation: 'Coupez les respirations et les transitions — visez la durée du script.',
  },
  {
    id: 'subs_readable',
    label: 'Les sous-titres sont-ils lisibles ?',
    strength: 'Sous-titres lisibles',
    issue: 'Rendez les sous-titres plus lisibles.',
    recommendation: 'Trois mots par ligne maximum, contraste fort, jamais sur un fond chargé.',
  },
  {
    id: 'cta_present',
    label: 'Le CTA est-il présent (dit ET affiché) ?',
    strength: 'CTA présent',
    issue: 'Rendez le CTA plus visible.',
    recommendation: 'Affichez-le aussi à l’écran pendant les deux dernières secondes.',
  },
  {
    id: 'voice_clear',
    label: 'La voix reste-t-elle claire malgré le son ?',
    strength: 'Voix claire',
    issue: 'Rééquilibrez voix et musique.',
    recommendation: 'Baissez le son à 20-30 % pendant que vous parlez.',
  },
  {
    id: 'scene_value',
    label: 'Chaque scène apporte-t-elle une nouvelle information ?',
    strength: 'Rythme sans temps mort',
    issue: 'Coupez la scène qui n’apporte rien.',
    recommendation: 'Supprimez ou raccourcissez la scène centrale la plus faible (~4 secondes).',
  },
  {
    id: 'original',
    label: 'Le contenu reste-t-il original (pas une copie de la tendance) ?',
    strength: 'Angle original',
    issue: 'Personnalisez davantage.',
    recommendation: 'Remplacez un exemple générique par votre expérience ou vos chiffres.',
  },
  {
    id: 'goal_match',
    label: 'La vidéo correspond-elle à l’objectif initial ?',
    strength: 'Alignée avec votre objectif',
    issue: 'Réalignez la fin sur votre objectif.',
    recommendation: 'La dernière scène doit servir votre objectif (prospects, ventes, abonnés…).',
  },
];

export type ChecklistAnswers = Record<string, boolean>;

export interface VideoReviewService {
  readonly mode: AnalysisMode;
  analyzeVideo(
    metadata: VideoMetadata,
    content: GeneratedContent,
    profile: UserProfile | null,
    checklist: ChecklistAnswers,
  ): Promise<VideoReview>;
}

/* Implémentation MVP : checklist manuelle + métadonnées objectives. */
export const manualChecklistReview: VideoReviewService = {
  mode: 'manual_checklist',
  async analyzeVideo(metadata, content, _profile, checklist) {
    const checks: ReviewCheck[] = REVIEW_QUESTIONS.map((q) => ({
      id: q.id,
      label: q.label,
      passed: checklist[q.id] === true,
    }));

    /* Vérifications objectives depuis les métadonnées du fichier. */
    if (metadata.orientation) {
      checks.push({
        id: 'vertical',
        label: 'Format vertical (9:16)',
        passed: metadata.orientation === 'portrait',
        detail:
          metadata.orientation === 'portrait'
            ? undefined
            : 'La vidéo n’est pas verticale — recadrez en 9:16 avant publication.',
      });
    }
    if (metadata.duration !== null) {
      const tooLong = metadata.duration > content.duration * 1.2;
      checks.push({
        id: 'measured_duration',
        label: `Durée mesurée : ${Math.round(metadata.duration)} s (script : ${content.duration} s)`,
        passed: !tooLong,
        detail: tooLong
          ? `Environ ${Math.round(metadata.duration - content.duration)} s de trop par rapport au script.`
          : undefined,
      });
    }

    const failedQuestions = REVIEW_QUESTIONS.filter((q) => checklist[q.id] !== true);
    const objectiveFails = checks.filter(
      (c) => !c.passed && (c.id === 'vertical' || c.id === 'measured_duration'),
    );
    const passedCount = checks.filter((c) => c.passed).length;
    const readinessScore = Math.round((passedCount / checks.length) * 100);

    const issues = [
      ...objectiveFails.map((c) => c.detail ?? c.label),
      ...failedQuestions.map((q) => q.issue),
    ].slice(0, 3);
    const recommendations = failedQuestions.map((q) => q.recommendation).slice(0, 3);
    const strengths = REVIEW_QUESTIONS.filter((q) => checklist[q.id] === true)
      .map((q) => q.strength)
      .slice(0, 5);
    if (metadata.orientation === 'portrait') strengths.unshift('Format vertical');

    return {
      analysisMode: 'manual_checklist',
      readinessScore,
      strengths: strengths.slice(0, 5),
      issues,
      checks,
      recommendations,
      reviewedAt: new Date().toISOString(),
      confidence: 'medium',
    };
  },
};

export function readinessLabel(score: number): string {
  if (score >= 90) return 'Prête à publier';
  if (score >= 70) return 'Quelques corrections recommandées';
  if (score >= 50) return 'Corrections conseillées avant publication';
  return 'Retravaillez les points ci-dessous avant de publier';
}

/* Lecture des métadonnées côté client — le fichier ne quitte JAMAIS
   le navigateur. L'appelant est responsable de l'objectURL d'aperçu ;
   celui créé ici est révoqué immédiatement. */
export function readVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const base: VideoMetadata = {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      duration: null,
      width: null,
      height: null,
      orientation: null,
      capturedAt: new Date().toISOString(),
    };
    if (typeof document === 'undefined') {
      resolve(base);
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const done = () => {
      URL.revokeObjectURL(url);
      const width = video.videoWidth || null;
      const height = video.videoHeight || null;
      resolve({
        ...base,
        duration: Number.isFinite(video.duration) ? video.duration : null,
        width,
        height,
        orientation:
          width && height
            ? height > width
              ? 'portrait'
              : width > height
                ? 'landscape'
                : 'square'
            : null,
      });
    };
    video.onloadedmetadata = done;
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(base);
    };
    video.src = url;
  });
}
