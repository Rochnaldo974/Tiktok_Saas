'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Film, Users, Music, Quote, Hash } from '@/components/icons';
import { toast } from '@/components/toaster';
import { dataset, fmt } from '@/lib/data';
import { avatarStyle } from '@/lib/visuals';

interface Item {
  icon: React.ReactNode;
  hue: number;
  label: string;
  meta: string;
  go: () => void;
}

export function CommandMenu({
  country,
  timeframe,
  followedNiches = [],
  onClose,
}: {
  country: string;
  timeframe: string;
  followedNiches?: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const groups = useMemo((): [string, Item[]][] => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const d = dataset(country, timeframe, followedNiches);
    const match = (s: string) => s.toLowerCase().includes(query);
    const goIdeas = (niche: string) => {
      router.push('/idees?country=' + encodeURIComponent(country) + '&tf=' + encodeURIComponent(timeframe) + '&q=' + encodeURIComponent(niche));
      onClose();
    };
    return (
      [
        ['Vidéos', d.videos.filter((v) => match(v.title) || match(v.niche)).slice(0, 4).map((v): Item => ({
          icon: <Film />, hue: v.hue, label: v.title, meta: `${fmt(v.views)} vues · +${v.growth} %`,
          go: () => goIdeas(v.niche),
        }))],
        ['Créateurs', d.creators.filter((c) => match(c.handle) || match(c.niche)).slice(0, 3).map((c): Item => ({
          icon: <Users />, hue: c.hue, label: c.handle, meta: `${fmt(c.followers)} abonnés · ${c.niche}`,
          go: () => { toast(`Le rapport créateur de ${c.handle} est en préparation`); onClose(); },
        }))],
        ['Sons', d.sounds.filter((s) => match(s.name) || match(s.artist)).slice(0, 3).map((s): Item => ({
          icon: <Music />, hue: s.hue, label: s.name, meta: `+${s.growth} % · ${fmt(s.videos)} vidéos`,
          go: () => { toast(`« ${s.name} » ajouté à votre bibliothèque de sons`); onClose(); },
        }))],
        ['Hooks', d.hooks.filter((h) => match(h.text)).slice(0, 3).map((h): Item => ({
          icon: <Quote />, hue: 0, label: h.text, meta: `${h.performance} % de rétention`,
          go: () => { navigator.clipboard?.writeText(h.text); toast('Hook copié dans le presse-papiers'); onClose(); },
        }))],
        ['Hashtags', d.hashtags.filter((t) => match(t.tag)).slice(0, 3).map((t): Item => ({
          icon: <Hash />, hue: 210, label: t.tag, meta: `${fmt(t.videos)} vidéos`,
          go: () => goIdeas(t.niche),
        }))],
      ] as [string, Item[]][]
    ).filter(([, items]) => items.length);
  }, [q, country, timeframe, followedNiches, router, onClose]);

  return (
    <div className="cmdk" role="dialog" aria-modal="true" aria-label="Recherche globale"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk-box">
        <div className="cmdk-input">
          <Search />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher des vidéos, créateurs, sons, hashtags ou hooks..."
            aria-label="Recherche globale"
          />
          <span className="kbd">échap</span>
        </div>
        <div className="cmdk-results">
          {!q.trim() ? (
            <div className="cmdk-empty">
              <b>Cherchez tout TikTok {country}</b>
              Essayez une niche — « finance », « restaurant » — ou un créateur, un son, un hook.
            </div>
          ) : !groups.length ? (
            <div className="cmdk-empty">
              <b>Aucun signal fort pour « {q} »</b>
              Essayez un autre pays ou une autre période — ou une niche plus large.
            </div>
          ) : (
            groups.map(([name, items]) => (
              <div key={name}>
                <div className="cmdk-group">{name}</div>
                {items.map((item, i) => (
                  <button key={i} className="cmdk-item" onClick={item.go}>
                    <span className="ico" style={avatarStyle(item.hue)}>{item.icon}</span>
                    <span className="label">{item.label}</span>
                    <span className="meta">{item.meta}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
