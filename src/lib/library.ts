'use client';

import { getSupabaseBrowser } from '@/lib/supabase/client';
import { readPrefs } from '@/lib/prefs-client';
import { resolveCountry, resolveTimeframe } from '@/lib/data';
import { toast } from '@/components/toaster';

/* Sauvegarde d'éléments (sons, hooks, idées) dans `saved_items`.
   Le marché (pays, période) est résolu comme sur les pages :
   paramètres d'URL d'abord, préférences ensuite. */

export type SavedKind = 'sound' | 'hook' | 'idea';

export const KIND_LABELS: Record<SavedKind, string> = {
  sound: 'Son',
  hook: 'Hook',
  idea: 'Idée',
};

function currentMarket(): { country: string; timeframe: string } {
  const params = new URLSearchParams(window.location.search);
  const prefs = readPrefs();
  const rawCountry = params.get('country');
  const rawTf = params.get('tf');
  return {
    country: rawCountry ? resolveCountry(rawCountry) : prefs.country,
    timeframe: rawTf ? resolveTimeframe(rawTf) : prefs.tf,
  };
}

export async function saveItem(
  kind: SavedKind,
  refId: string,
  payload: Record<string, unknown>,
  successMessage: string,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    toast('Supabase n’est pas configuré — sauvegarde indisponible');
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    toast('Connectez-vous pour sauvegarder dans votre bibliothèque');
    return;
  }
  const { country, timeframe } = currentMarket();
  const { error } = await supabase.from('saved_items').upsert(
    {
      user_id: auth.user.id,
      kind,
      ref_id: refId,
      country,
      timeframe,
      payload,
    },
    { onConflict: 'user_id,kind,ref_id,country,timeframe' },
  );
  if (error) {
    toast('Sauvegarde impossible — réessayez');
    return;
  }
  toast(successMessage);
}
