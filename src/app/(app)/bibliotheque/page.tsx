import Link from 'next/link';
import { getSupabaseServer, getUser } from '@/lib/supabase/server';
import { LibraryList, type SavedItem } from '@/components/library/list';
import { Save } from '@/components/icons';

export const metadata = { title: 'Bibliothèque' };

export default async function LibraryPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="page" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content" style={{ gap: 28 }}>
          <header>
            <p className="eyebrow">Bibliothèque</p>
            <h1 className="page-title" style={{ marginTop: 12 }}>Vos trouvailles, au même endroit</h1>
          </header>
          <div className="empty">
            <Save />
            <h4>Connectez-vous pour retrouver votre bibliothèque</h4>
            <p>Les sons, hooks et idées que vous sauvegardez sont liés à votre compte et vous suivent sur tous vos appareils.</p>
            <Link className="btn btn-primary" href="/connexion">Se connecter / créer un compte</Link>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await getSupabaseServer();
  const { data } = await supabase!
    .from('saved_items')
    .select('id, kind, ref_id, country, timeframe, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  const items = (data ?? []) as SavedItem[];

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 28 }}>
        <header>
          <p className="eyebrow">Bibliothèque — {items.length} élément{items.length > 1 ? 's' : ''}</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Vos trouvailles, au même endroit</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Tout ce que vous avez sauvegardé — sons, hooks et idées — prêt à être utilisé
            dans votre prochaine vidéo.
          </p>
        </header>
        {items.length ? (
          <LibraryList items={items} />
        ) : (
          <div className="empty">
            <Save />
            <h4>Rien ici pour le moment</h4>
            <p>Sauvegardez un son, un hook ou une idée depuis le dashboard : tout atterrit ici.</p>
            <Link className="btn btn-secondary" href="/">Explorer les tendances</Link>
          </div>
        )}
      </div>
    </div>
  );
}
