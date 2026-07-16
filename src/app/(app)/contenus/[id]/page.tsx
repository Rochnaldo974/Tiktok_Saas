import { getPrefsState } from '@/lib/prefs';
import { ContentDetail } from '@/components/contents/content-detail';

export const metadata = { title: 'Mon script' };

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getPrefsState();
  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 28, maxWidth: 760 }}>
        <ContentDetail id={id} loggedIn={Boolean(user)} />
      </div>
    </div>
  );
}
