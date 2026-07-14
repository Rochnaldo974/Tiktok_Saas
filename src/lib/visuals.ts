import type { CSSProperties } from 'react';
import { hashStr } from '@/lib/data';

/* Generated gradients — the app ships zero external images.
   Every thumbnail, avatar and artwork is derived from a hue. */

export function avatarStyle(hue: number): CSSProperties {
  return {
    background: `linear-gradient(135deg, hsl(${hue} 55% 40%), hsl(${(hue + 45) % 360} 55% 26%))`,
  };
}

export function artworkStyle(hue: number): CSSProperties {
  return {
    background: `radial-gradient(80% 80% at 25% 20%, hsl(${(hue + 50) % 360} 60% 45% / .8), transparent 60%), linear-gradient(140deg, hsl(${hue} 50% 30%), hsl(${hue} 60% 12%))`,
  };
}

export function thumbStyle(hue: number, angle: number, id: string): CSSProperties {
  const h2 = (hue + 40) % 360;
  const seed = hashStr(id + hue);
  const x = 20 + (seed % 55);
  const y = 15 + (seed % 40);
  return {
    background: `radial-gradient(70% 60% at ${x}% ${y}%, hsl(${h2} 60% 38% / .75), transparent 65%), radial-gradient(90% 90% at 80% 90%, hsl(${hue} 55% 22% / .9), transparent 70%), linear-gradient(${angle}deg, hsl(${hue} 45% 16%), hsl(${hue} 60% 8%))`,
  };
}

export function thumbSeed(hue: number, id: string): number {
  return hashStr(id + hue);
}
