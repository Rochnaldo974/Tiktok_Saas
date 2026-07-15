/* Types partagés de l'analyse de profil TikTok (route /api/profil,
   onboarding, réglages, page Analyse). Les champs « deep » ne sont
   remplis que par l'audit approfondi de la page Analyse. */

export interface ProfileStats {
  followers: number | null;
  videos: number | null;
  likes: number | null;
}

export interface VideoIdea {
  title: string;
  hook: string;
}

export interface ProfileAnalysis {
  niches: string[];
  summary: string;
  strengths: string[];
  advice: string[];
  /* Audit approfondi (page Analyse) */
  score?: number;
  weaknesses?: string[];
  plan?: string[];
  videoIdeas?: VideoIdea[];
  bioAdvice?: string;
}

export interface ProfileAnalysisResponse {
  handle: string | null;
  nickname: string | null;
  stats: ProfileStats | null;
  analysis: ProfileAnalysis;
}
