/* Modèle de données du cycle de création (localStorage, sans compte).
   Signal ne fabrique JAMAIS la vidéo finale : il prépare le concept,
   le script et l'accompagnement jusqu'à la publication. Aucune donnée
   binaire (vidéo) n'est stockée — uniquement des métadonnées. */

export type ContentStatus =
  | 'idea'
  | 'script_draft'
  | 'script_ready'
  | 'to_film'
  | 'filming'
  | 'video_uploaded'
  | 'review_in_progress'
  | 'corrections_needed'
  | 'ready_to_publish'
  | 'published'
  | 'performance_pending'
  | 'performance_available'
  | 'archived';

export type TiktokConnectionType = 'oauth' | 'public_handle' | 'manual' | 'none';

/* Les 6 objectifs exacts de l'onboarding. */
export type PrimaryGoal =
  | 'grow_audience'
  | 'get_leads'
  | 'sell_product'
  | 'build_authority'
  | 'find_clients'
  | 'boost_engagement';

export const GOAL_LABELS: Record<PrimaryGoal, string> = {
  grow_audience: 'Développer mon audience',
  get_leads: 'Générer des prospects',
  sell_product: 'Vendre un produit',
  build_authority: 'Construire mon expertise',
  find_clients: 'Trouver des clients',
  boost_engagement: "Augmenter l'engagement",
};

export type PostingFrequency = 'one_two_week' | 'three_four_week' | 'daily' | 'multiple_daily';

export const FREQUENCY_LABELS: Record<PostingFrequency, string> = {
  one_two_week: 'Une à deux fois par semaine',
  three_four_week: 'Trois à quatre fois par semaine',
  daily: 'Une fois par jour',
  multiple_daily: 'Plusieurs fois par jour',
};

export type ContentStyle =
  | 'direct'
  | 'pedagogique'
  | 'storytelling'
  | 'authentique'
  | 'humoristique'
  | 'premium';

export const STYLE_LABELS: Record<ContentStyle, string> = {
  direct: 'Direct',
  pedagogique: 'Pédagogique',
  storytelling: 'Storytelling',
  authentique: 'Authentique',
  humoristique: 'Humoristique',
  premium: 'Premium',
};

export type ScheduleBucket = 'today' | 'this_week' | 'later';

export const BUCKET_LABELS: Record<ScheduleBucket, string> = {
  today: "Aujourd'hui",
  this_week: 'Cette semaine',
  later: 'Plus tard',
};

export interface UserProfile {
  primaryNiche: string;
  /* max 2 — 3 niches au total, la principale d'abord */
  secondaryNiches: string[];
  market: string; // nom de pays, même vocabulaire que COUNTRIES
  language: string; // 'fr' par défaut
  primaryGoal: PrimaryGoal;
  tiktokHandle: string | null;
  tiktokConnectionType: TiktokConnectionType;
  postingFrequency: PostingFrequency;
  onboardingCompleted: boolean;
  /* opportunités enregistrées (ids de Video, réels ou mock) */
  savedOpportunityIds: string[];
  /* rythme de visite — pilote la page Aujourd'hui */
  lastVisitAt: string | null; // ISO
  lastVisitDay: string | null; // YYYY-MM-DD, pour réinitialiser visitsToday
  visitsToday: number;
  contentPublishedToday: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  index: number; // 1-based → « Scène N »
  timeRange: string; // « 0–3 s »
  visual: string; // quoi filmer
  spoken: string; // texte prononcé
  onScreen: string; // texte incrusté
}

export interface FilmingCheckItem {
  id: string;
  label: string;
  done: boolean;
}

/* Métadonnées de la vidéo tournée — JAMAIS le binaire. */
export interface VideoMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number | null; // secondes, lu via <video>
  width: number | null;
  height: number | null;
  orientation: 'portrait' | 'landscape' | 'square' | null;
  capturedAt: string; // ISO de la sélection du fichier
}

export type AnalysisMode = 'mock' | 'manual_checklist' | 'metadata_only' | 'multimodal_ai' | 'production';

export interface ReviewCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface VideoReview {
  analysisMode: AnalysisMode;
  readinessScore: number; // 0–100
  strengths: string[];
  issues: string[]; // 3 améliorations max
  checks: ReviewCheck[];
  recommendations: string[];
  reviewedAt: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  followersGained: number | null;
  leads: number | null;
  source: 'manual';
  recordedAt: string;
}

export interface GeneratedContent {
  id: string;
  sourceOpportunityId: string | null; // Video.id (réel 'r…' ou mock)
  sourceTitle: string | null; // titre de l'opportunité d'origine
  title: string;
  concept: string;
  niche: string;
  objective: PrimaryGoal;
  style: ContentStyle;
  hook: string;
  scenes: Scene[];
  cta: string;
  duration: number; // secondes
  difficulty: 'Easy' | 'Medium' | 'Hard'; // vocabulaire de data.ts
  productionTime: string; // '15 min' | '35 min' | '1 heure' | '2 heures'
  equipment: string;
  sound: string;
  suggestedTime: string; // « Créneau suggéré » — jamais présenté comme garanti
  hashtags: string[];
  tips: string[]; // 3 conseils de réalisation max
  status: ContentStatus;
  scheduledBucket: ScheduleBucket | null;
  scheduledDate: string | null; // YYYY-MM-DD
  filmingChecklist: FilmingCheckItem[];
  videoMetadata: VideoMetadata | null;
  videoReview: VideoReview | null;
  publishedAt: string | null;
  publishedUrl: string | null;
  performanceMetrics: PerformanceMetrics | null;
  performanceInsights: string[];
  createdAt: string;
  updatedAt: string;
}
