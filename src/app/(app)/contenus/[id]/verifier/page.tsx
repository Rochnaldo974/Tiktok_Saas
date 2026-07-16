import { VideoCheck } from '@/components/contents/video-check';

export const metadata = { title: 'Vérifier ma vidéo' };

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 28, maxWidth: 720 }}>
        <VideoCheck id={id} />
      </div>
    </div>
  );
}
