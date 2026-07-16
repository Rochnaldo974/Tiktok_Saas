import { redirect } from 'next/navigation';

/* Le Planning a fusionné dans Mes contenus. */
export default function PlanningRedirect() {
  redirect('/contenus');
}
