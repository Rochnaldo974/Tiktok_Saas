import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* Client Supabase (clé publishable — sûre côté navigateur, la sécurité
   des données repose sur les policies RLS définies en base).
   L'app fonctionne sans Supabase configuré : `getSupabase()` renvoie
   null si les variables d'environnement sont absentes. */

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}
