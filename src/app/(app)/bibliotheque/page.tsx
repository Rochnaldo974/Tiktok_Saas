import { redirect } from 'next/navigation';

/* La Bibliothèque a fusionné dans Mes contenus. */
export default function LibraryRedirect() {
  redirect('/contenus');
}
