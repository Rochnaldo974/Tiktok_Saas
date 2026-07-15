import { getPrefsState } from '@/lib/prefs';
import { getSupabaseServer } from '@/lib/supabase/server';
import { DeepAnalyzer } from '@/components/analyse/deep-analyzer';
import type { ProfileAnalysis, ProfileAnalysisResponse } from '@/lib/profile-analysis';

export const metadata = { title: 'Analyse de profil' };

export default async function AnalysePage() {
  const { user } = await getPrefsState();

  /* Le dernier audit approfondi est mémorisé dans le profil : on le
     ré-affiche directement au retour sur la page. */
  let initialHandle = '';
  let initialResult: ProfileAnalysisResponse | null = null;
  if (user) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase!
      .from('profiles')
      .select('tiktok_handle, tiktok_analysis')
      .eq('id', user.id)
      .single();
    initialHandle = data?.tiktok_handle ?? '';
    const stored = data?.tiktok_analysis as ProfileAnalysis | null;
    if (stored?.score !== undefined) {
      initialResult = { handle: data?.tiktok_handle ?? null, nickname: null, stats: null, analysis: stored };
    }
  }

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 24, maxWidth: 860 }}>
        <header>
          <p className="eyebrow">Analyse de profil — vraies données TikTok</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Votre audit stratégique</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            L&apos;IA lit votre profil public et vous rend un audit complet : score de potentiel,
            positionnement, forces, axes d&apos;amélioration, plan d&apos;action sur 7 jours et
            idées de vidéos taillées pour vous.
          </p>
        </header>
        <DeepAnalyzer initialHandle={initialHandle} initialResult={initialResult} />
      </div>
    </div>
  );
}
