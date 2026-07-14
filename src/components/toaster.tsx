'use client';

import { useEffect, useState } from 'react';
import { Check } from '@/components/icons';

/* Event-based toasts: any client component calls toast("...") and the
   single <Toaster /> mounted in the root layout renders the queue. */

const TOAST_EVENT = 'signal:toast';

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

interface Entry {
  id: number;
  message: string;
  leaving: boolean;
}

let nextId = 0;

export function Toaster() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const message = (e as CustomEvent<string>).detail;
      const id = nextId++;
      setEntries((prev) => [...prev, { id, message, leaving: false }]);
      setTimeout(() => {
        setEntries((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      }, 2600);
      setTimeout(() => {
        setEntries((prev) => prev.filter((t) => t.id !== id));
      }, 2920);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (!entries.length) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {entries.map((t) => (
        <div key={t.id} className={`toast${t.leaving ? ' out' : ''}`}>
          <Check />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
