'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { Bolt, Today, Ideas, Radar, Calendar, Copilot, Alerts, Save, Settings } from '@/components/icons';
import { resolveCountry, resolveTimeframe } from '@/lib/data';
import { buildAlerts } from '@/lib/alerts';
import type { Timeframe } from '@/lib/data';

const NAV = [
  { id: 'today', label: "Aujourd'hui", href: '/', icon: Today },
  { id: 'ideas', label: 'Idées', href: '/idees', icon: Ideas },
  { id: 'analyse', label: 'Analyse', href: '/analyse', icon: Radar },
  { id: 'planning', label: 'Planning', href: '/planning', icon: Calendar },
  { id: 'copilot', label: 'Copilote IA', href: '/copilote', icon: Copilot },
  { id: 'alerts', label: 'Alertes', href: '/alertes', icon: Alerts },
  { id: 'library', label: 'Bibliothèque', href: '/bibliotheque', icon: Save },
  { id: 'settings', label: 'Réglages', href: '/reglages', icon: Settings },
] as const;

interface SidebarProps {
  defaultCountry: string;
  defaultTimeframe: Timeframe;
  followedNiches: string[];
}

function SidebarInner({ defaultCountry, defaultTimeframe, followedNiches }: SidebarProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get('country');
  const rawTf = params.get('tf');
  const country = raw ? resolveCountry(raw) : defaultCountry;
  const timeframe = rawTf ? resolveTimeframe(rawTf) : defaultTimeframe;
  const query = params.toString() ? `?${params.toString()}` : '';

  /* Même builder que la page Alertes : le badge correspond toujours
     exactement à ce que l'utilisateur trouvera derrière. */
  const alertCount = useMemo(
    () => buildAlerts(country, timeframe, followedNiches).length,
    [country, timeframe, followedNiches],
  );

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
            {item.id === 'alerts' && alertCount > 0 ? <span className="nav-badge">{alertCount}</span> : null}
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

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<nav className="sidebar" aria-label="Navigation principale" />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
