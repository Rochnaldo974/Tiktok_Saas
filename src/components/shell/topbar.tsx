'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Globe, Calendar, Chevron, Alerts, UserIcon } from '@/components/icons';
import { toast } from '@/components/toaster';
import { CommandMenu } from '@/components/command-menu';
import { COUNTRIES, TIMEFRAMES, resolveCountry, resolveTimeframe, type Timeframe } from '@/lib/data';

function DropMenu({
  icon,
  label,
  options,
  value,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  options: string[];
  value: string;
  onPick: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="select-chip"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        <span className="chip-label">{value}</span>
        <Chevron />
      </button>
      {open && (
        <div className="menu" role="menu">
          {options.map((o) => (
            <button
              key={o}
              role="menuitem"
              className={o === value ? 'on' : ''}
              onClick={() => {
                onPick(o);
                setOpen(false);
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface TopbarProps {
  defaultCountry: string;
  defaultTimeframe: Timeframe;
  followedNiches: string[];
  userEmail: string | null;
}

function TopbarInner({ defaultCountry, defaultTimeframe, followedNiches, userEmail }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [cmdkOpen, setCmdkOpen] = useState(false);

  const rawCountry = params.get('country');
  const rawTf = params.get('tf');
  const country = rawCountry ? resolveCountry(rawCountry) : defaultCountry;
  const timeframe = rawTf ? resolveTimeframe(rawTf) : defaultTimeframe;

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="topbar">
      <button className="search-trigger" onClick={() => setCmdkOpen(true)} aria-label="Rechercher">
        <Search />
        <span>Rechercher des vidéos, créateurs, sons, hashtags ou hooks...</span>
        <span className="kbd">⌘K</span>
      </button>
      <div className="top-actions">
        <DropMenu
          icon={<Globe />}
          label="Pays"
          options={COUNTRIES.map((c) => c.name)}
          value={country}
          onPick={(v) => setParam('country', v)}
        />
        <DropMenu
          icon={<Calendar />}
          label="Période"
          options={[...TIMEFRAMES, 'Personnalisé']}
          value={timeframe}
          onPick={(v) => {
            if (v === 'Personnalisé') {
              toast('Les périodes personnalisées arrivent bientôt');
              return;
            }
            setParam('tf', v);
          }}
        />
        <Link className="icon-btn" aria-label="Voir les alertes" href="/alertes">
          <Alerts />
          <span className="dot" />
        </Link>
        {userEmail ? (
          <Link
            className="avatar"
            href="/reglages"
            aria-label={`Mon compte (${userEmail})`}
            title={userEmail}
          >
            {userEmail.slice(0, 2).toUpperCase()}
          </Link>
        ) : (
          <Link className="btn btn-secondary btn-sm" href="/connexion">
            <UserIcon /> Se connecter
          </Link>
        )}
      </div>
      {cmdkOpen && (
        <CommandMenu
          country={country}
          timeframe={timeframe}
          followedNiches={followedNiches}
          onClose={() => setCmdkOpen(false)}
        />
      )}
    </header>
  );
}

export function Topbar(props: TopbarProps) {
  return (
    <Suspense fallback={<header className="topbar" />}>
      <TopbarInner {...props} />
    </Suspense>
  );
}
