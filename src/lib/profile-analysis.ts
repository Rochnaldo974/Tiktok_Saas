/* Types partagés de l'analyse de profil TikTok (route /api/profil,
   onboarding, réglages). */

export interface ProfileStats {
  followers: number | null;
  videos: number | null;
  likes: number | null;
}

export interface ProfileAnalysis {
  niches: string[];
  summary: string;
  strengths: string[];
  advice: string[];
}

export interface ProfileAnalysisResponse {
  handle: string | null;
  nickname: string | null;
  stats: ProfileStats | null;
  analysis: ProfileAnalysis;
}
