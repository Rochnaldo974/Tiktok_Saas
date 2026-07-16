'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Today, Ideas, Save, Wand } from '@/components/icons';
import { isNavActive } from './sidebar';

/* Navigation mobile (≤960px) : les 3 destinations + « Préparer ».
   Remplace l'ancienne sidebar en mode icônes. */
const ITEMS = [
  { id: 'today', label: "Aujourd'hui", href: '/', icon: Today },
  { id: 'opportunities', label: 'Opportunités', href: '/opportunites', icon: Ideas },
  { id: 'contents', label: 'Mes contenus', href: '/contenus', icon: Save },
] as const;

function BottomNavInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString() ? `?${params.toString()}` : '';

  return (
    <nav className="bottom-nav" aria-label="Navigation mobile">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.id}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            href={`${item.href}${query}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <Link className="bottom-nav-item bottom-nav-cta" href={`/opportunites${query}`}>
        <Wand />
        <span>Préparer</span>
      </Link>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  );
}
