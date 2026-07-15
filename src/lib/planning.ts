'use client';

import { getSupabaseBrowser } from '@/lib/supabase/client';
import { toast } from '@/components/toaster';

/* Planning : transforme un plan d'action (liste de libellés) en tâches
   datées à partir d'aujourd'hui, une par jour. */

export interface PlanItem {
  id: string;
  label: string;
  due_date: string;
  done: boolean;
  source: string;
}

export function isoDatePlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function addPlanToPlanning(steps: string[]): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    toast('Supabase n’est pas configuré — planning indisponible');
    return false;
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    toast('Créez un compte pour enregistrer votre plan dans le planning');
    return false;
  }
  const rows = steps.slice(0, 14).map((label, i) => ({
    user_id: auth.user!.id,
    label: label.slice(0, 500),
    due_date: isoDatePlusDays(i),
    source: 'analyse',
  }));
  const { error } = await supabase.from('plan_items').insert(rows);
  if (error) {
    toast('Ajout impossible — réessayez');
    return false;
  }
  toast(`${rows.length} actions ajoutées à votre planning`);
  return true;
}
