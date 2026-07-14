'use client';

import { parsePrefs, PREFS_COOKIE, type Prefs } from '@/lib/prefs-shared';

export function readPrefs(): Prefs {
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(PREFS_COOKIE + '='))
    ?.slice(PREFS_COOKIE.length + 1);
  return parsePrefs(raw);
}

export function writePrefs(prefs: Prefs) {
  const value = encodeURIComponent(JSON.stringify(prefs));
  document.cookie = `${PREFS_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}
