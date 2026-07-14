import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/* Client serveur : lit la session dans les cookies de la requête.
   Renvoie null si Supabase n'est pas configuré. */

export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        // Les Server Components ne peuvent pas écrire de cookies ;
        // le rafraîchissement de session est géré par src/proxy.ts.
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* ignoré volontairement */
        }
      },
    },
  });
}

export async function getUser(): Promise<User | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
