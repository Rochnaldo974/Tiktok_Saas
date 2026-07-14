'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Bolt, Today, Ideas, Copilot, Alerts, Settings } from '@/components/icons';
import { resolveCountry } from '@/lib/data';

const NAV = [
  { id: 'today', label: "Aujourd'hui", href: '/', icon: Today },
  { id: 'ideas', label: 'Idées', href: '/idees', icon: Ideas },
  { id: 'copilot', label: 'Copilote IA', href: '/copilote', icon: Copilot },
  { id: 'alerts', label: 'Alertes', href: '/alertes', icon: Alerts, badge: '3' },
  { id: 'settings', label: 'Réglages', href: '/reglages', icon: Settings },
] as const;

function SidebarInner({ defaultCountry }: { defaultCountry: string }) {
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
          <span className="logo-tag">Intelligence TikTok</span>
        </span>
      </Link>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link key={item.id} className={`nav-item${active ? ' active' : ''}`} href={`${item.href}${query}`}>
            <Icon />
            <span>{item.label}</span>
            {'badge' in item && item.badge ? <span className="nav-badge">{item.badge}</span> : null}
          </Link>
        );
      })}
      <div className="sidebar-foot">
        <span className="pulse" />
        <span>Live · scan {country}</span>
      </div>
    </nav>
  );
}

export function Sidebar({ defaultCountry }: { defaultCountry: string }) {
  return (
    <Suspense fallback={<nav className="sidebar" aria-label="Navigation principale" />}>
      <SidebarInner defaultCountry={defaultCountry} />
    </Suspense>
  );
}
