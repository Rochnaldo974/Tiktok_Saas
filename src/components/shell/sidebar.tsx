'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Bolt, Today, Ideas, Save, Settings, UserIcon } from '@/components/icons';
import { resolveCountry } from '@/lib/data';
import type { Timeframe } from '@/lib/data';

/* Navigation réduite à 3 destinations : trouver (Opportunités),
   décider (Aujourd'hui), produire (Mes contenus). Tout le reste vit
   en bas de sidebar ou en contexte. */
const NAV = [
  { id: 'today', label: "Aujourd'hui", href: '/', icon: Today },
  { id: 'opportunities', label: 'Opportunités', href: '/opportunites', icon: Ideas },
  { id: 'contents', label: 'Mes contenus', href: '/contenus', icon: Save },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
}

interface SidebarProps {
  defaultCountry: string;
  defaultTimeframe: Timeframe;
  followedNiches: string[];
  userEmail: string | null;
}

function SidebarInner({ defaultCountry, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get('country');
  const country = raw ? resolveCountry(raw) : defaultCountry;
  const query = params.toString() ? `?${params.toString()}` : '';

  return (
    <nav className="sidebar" aria-label="Navigation principale">
      <Link className="logo" href={`/${query}`}>
        <span className="logo-mark"><Bolt /></span>
        <span>
          Signal
          <span className="logo-tag">Votre copilote TikTok</span>
        </span>
      </Link>
      <Link className="btn btn-primary sidebar-cta" href={`/opportunites${query}`}>
        + Préparer un contenu
      </Link>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.id}
            className={`nav-item${active ? ' active' : ''}`}
            href={`${item.href}${query}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <div className="sidebar-spacer" />
      <Link
        className={`nav-item${isNavActive(pathname, '/reglages') ? ' active' : ''}`}
        href={`/reglages${query}`}
      >
        <Settings />
        <span>Réglages</span>
      </Link>
      {userEmail ? (
        <Link className="nav-item" href={`/reglages${query}`} title={userEmail}>
          <UserIcon />
          <span>{userEmail.split('@')[0].slice(0, 18)}</span>
        </Link>
      ) : (
        <Link className="nav-item" href="/connexion">
          <UserIcon />
          <span>Se connecter</span>
        </Link>
      )}
      <div className="sidebar-foot">
        <span className="pulse" />
        <span>Live · scan {country}</span>
      </div>
    </nav>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<nav className="sidebar" aria-label="Navigation principale" />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
