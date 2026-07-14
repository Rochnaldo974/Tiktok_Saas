import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth/form';

export const metadata = { title: 'Connexion' };

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect('/');

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 28, maxWidth: 520, margin: '20px auto', width: '100%' }}>
        <header>
          <p className="eyebrow">Compte</p>
          <h1 className="page-title" style={{ marginTop: 12, fontSize: 'clamp(32px, 4vw, 44px)' }}>
            Votre Signal vous suit partout
          </h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Créez un compte pour retrouver vos niches, vos sons et vos idées
            sauvegardés sur tous vos appareils.
          </p>
        </header>
        <AuthForm />
      </div>
    </div>
  );
}
