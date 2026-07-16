'use client';

import { useSyncExternalStore } from 'react';
import type { GeneratedContent, UserProfile } from './types';
import { getContentsSnapshot, getProfileSnapshot, subscribeStore } from './store';

/* Hooks React du store localStorage. Le pattern anti-mismatch :
   getServerSnapshot renvoie null/[] → le SSR et le premier rendu client
   sont identiques (squelette / état vide), puis un unique re-render
   après hydratation. Ne JAMAIS lire localStorage pendant le rendu
   ailleurs que via ces hooks. */

const EMPTY: GeneratedContent[] = [];

const emptySubscribe = () => () => {};

export function useHydrated(): boolean {
  /* false au rendu serveur/hydratation, true ensuite — sans setState */
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function useProfile(): UserProfile | null {
  return useSyncExternalStore(subscribeStore, getProfileSnapshot, () => null);
}

export function useContents(): GeneratedContent[] {
  return useSyncExternalStore(subscribeStore, getContentsSnapshot, () => EMPTY);
}

export function useContent(id: string): GeneratedContent | null {
  const contents = useContents();
  return contents.find((c) => c.id === id) ?? null;
}
