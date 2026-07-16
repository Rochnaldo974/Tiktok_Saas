import { getPrefsState } from '@/lib/prefs';
import { ContentList } from '@/components/contents/content-list';

export const metadata = { title: 'Mes contenus' };

export default async function ContentsPage() {
  const { user } = await getPrefsState();
  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 32, maxWidth: 860 }}>
        <header>
          <p className="eyebrow">Mes contenus</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Tout ce qu&apos;il vous reste à tourner.</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Vos concepts, scripts et contenus planifiés au même endroit — de l&apos;idée à la
            publication, puis aux premiers résultats.
          </p>
        </header>
        <ContentList loggedIn={Boolean(user)} />
      </div>
    </div>
  );
}
