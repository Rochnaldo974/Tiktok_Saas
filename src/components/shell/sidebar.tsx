'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Bolt, Today, Ideas, Copilot, Alerts, Settings } from '@/components/icons';
import { toast } from '@/components/toaster';
import { resolveCountry } from '@/lib/data';

const NAV = [
  { id: 'today', label: 'Today', href: '/', icon: Today },
  { id: 'ideas', label: 'Ideas', href: '/ideas', icon: Ideas },
  { id: 'copilot', label: 'AI Copilot', icon: Copilot, soon: true },
  { id: 'alerts', label: 'Alerts', icon: Alerts, badge: '3', soon: true },
  { id: 'settings', label: 'Settings', icon: Settings, soon: true },
] as const;

function SidebarInner() {
  const pathname = usePathname();
  const params = useSearchParams();
  const country = resolveCountry(params.get('country') ?? undefined);
  const query = params.toString() ? `?${params.toString()}` : '';

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <Link className="logo" href={`/${query}`}>
        <span className="logo-mark"><Bolt /></span>
        <span>
          Signal
          <span className="logo-tag">TikTok intelligence</span>
        </span>
      </Link>
      {NAV.map((item) => {
        const Icon = item.icon;
        if (!('href' in item)) {
          return (
            <button
              key={item.id}
              className="nav-item"
              onClick={() => toast(`${item.label} is coming soon`)}
            >
              <Icon />
              <span>{item.label}</span>
              {'badge' in item && item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          );
        }
        const active = pathname === item.href;
        return (
          <Link key={item.id} className={`nav-item${active ? ' active' : ''}`} href={`${item.href}${query}`}>
            <Icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <div className="sidebar-foot">
        <span className="pulse" />
        <span>Live · scanning {country}</span>
      </div>
    </nav>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<nav className="sidebar" aria-label="Main navigation" />}>
      <SidebarInner />
    </Suspense>
  );
}
