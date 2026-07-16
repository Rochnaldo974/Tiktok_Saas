import { redirect } from 'next/navigation';

/* Les Idées ont fusionné dans Opportunités — la query (pays, période,
   filtres) est préservée pour ne casser aucun ancien lien. */
export default async function IdeasRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') next.set(key, value);
  }
  redirect(`/opportunites${next.size ? `?${next}` : ''}`);
}
