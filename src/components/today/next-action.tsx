'use client';

import Link from 'next/link';
import { CONTENT_STATUS_LABELS, sectionOf } from '@/lib/content/status';
import { useContents, useHydrated } from '@/lib/content/use-store';
import { Film, ArrowRight } from '@/components/icons';

/* Rail « prochaine action » : le contenu en cours le plus proche de la
   publication, ou l'invitation à créer le premier. */

export function NextActionCard() {
  const hydrated = useHydrated();
  const contents = useContents();

  if (!hydrated) {
    return <div className="skeleton" style={{ height: 130, borderRadius: 'var(--r-lg)' }} />;
  }

  const active = contents.filter((c) => sectionOf(c.status) !== 'published' && c.status !== 'archived');

  if (!active.length) {
    return (
      <div className="card rail-card reveal">
        <h4><Film style={{ width: 13, height: 13 }} /> Votre prochain contenu</h4>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.55 }}>
          Vous n&apos;avez encore aucun contenu prêt à tourner.
        </p>
        <Link className="btn btn-primary btn-sm" style={{ marginTop: 12, width: '100%' }} href="/opportunites">
          Préparer mon premier contenu
        </Link>
      </div>
    );
  }

  const next = active.sort((a, b) => {
    const dateA = a.scheduledDate ?? '9999';
    const dateB = b.scheduledDate ?? '9999';
    return dateA.localeCompare(dateB) || b.updatedAt.localeCompare(a.updatedAt);
  })[0];

  return (
    <div className="card rail-card reveal">
      <h4><Film style={{ width: 13, height: 13 }} /> Votre prochain contenu</h4>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>
        {next.title}
      </p>
      <div className="content-meta" style={{ marginTop: 6 }}>
        <span>{CONTENT_STATUS_LABELS[next.status]}</span>
        {next.scheduledDate && (
          <span>
            · prévu{' '}
            {new Date(next.scheduledDate + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
      <Link className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%' }} href={`/contenus/${next.id}`}>
        Ouvrir le script <ArrowRight />
      </Link>
    </div>
  );
}
