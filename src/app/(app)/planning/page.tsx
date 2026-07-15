import Link from 'next/link';
import { getSupabaseServer, getUser } from '@/lib/supabase/server';
import { PlanningList } from '@/components/planning/list';
import type { PlanItem } from '@/lib/planning';
import { Calendar } from '@/components/icons';

export const metadata = { title: 'Planning' };

export default async function PlanningPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="page" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content" style={{ gap: 28 }}>
          <header>
            <p className="eyebrow">Planning</p>
            <h1 className="page-title" style={{ marginTop: 12 }}>Votre plan, jour par jour</h1>
          </header>
          <div className="empty">
            <Calendar />
            <h4>Connectez-vous pour retrouver votre planning</h4>
            <p>
              Lancez votre audit sur la page Analyse, ajoutez le plan d&apos;action à votre
              planning, et cochez vos avancées chaque jour.
            </p>
            <Link className="btn btn-primary" href="/connexion">Se connecter / créer un compte</Link>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await getSupabaseServer();
  const { data } = await supabase!
    .from('plan_items')
    .select('id, label, due_date, done, source')
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(200);
  const items = (data ?? []) as PlanItem[];
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 28, maxWidth: 760 }}>
        <header>
          <p className="eyebrow">
            Planning{items.length ? ` — ${doneCount}/${items.length} fait${doneCount > 1 ? 's' : ''}` : ''}
          </p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Votre plan, jour par jour</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Les actions de votre audit, datées et cochables. Une action par jour suffit
            à faire la différence.
          </p>
        </header>
        {items.length ? (
          <PlanningList items={items} />
        ) : (
          <div className="empty">
            <Calendar />
            <h4>Votre planning est vide</h4>
            <p>Lancez un audit de votre profil : le plan d&apos;action sur 7 jours s&apos;ajoute ici en un clic.</p>
            <Link className="btn btn-primary" href="/analyse">Lancer mon audit</Link>
          </div>
        )}
      </div>
    </div>
  );
}
