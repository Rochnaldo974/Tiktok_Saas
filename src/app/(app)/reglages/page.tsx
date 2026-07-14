import { getPrefsState } from '@/lib/prefs';
import { SettingsForm } from '@/components/settings/form';

export const metadata = { title: 'Réglages' };

export default async function SettingsPage() {
  const { prefs, user } = await getPrefsState();

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 28, maxWidth: 720 }}>
        <header>
          <p className="eyebrow">Réglages</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Votre Signal, à votre main</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Ces préférences s&apos;appliquent quand l&apos;URL ne précise rien : pays et période
            par défaut, et les niches qui alimentent vos alertes.
          </p>
        </header>
        <SettingsForm initial={prefs} userEmail={user?.email ?? null} />
      </div>
    </div>
  );
}
