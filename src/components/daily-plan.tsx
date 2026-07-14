'use client';

import type { Video, Sound, Hook } from '@/lib/data';
import { openTrendPanel } from '@/components/trend-panel';
import { saveItem } from '@/lib/library';
import { toast } from '@/components/toaster';
import { Check, Wand, Save, Copy } from '@/components/icons';

/* Le plan du jour n'est pas une liste à lire : chaque ligne se fait
   en un clic (script, sauvegarde, copie). */

export function DailyPlan({ video, sound, hook }: { video: Video; sound: Sound; hook: Hook }) {
  return (
    <aside className="reco-panel">
      <h4>Votre plan du jour</h4>
      <div className="reco-item">
        <Check />
        <span style={{ flex: 1 }}>
          Filmer « {video.title} »
          <em>{video.prodTime} · {video.niche}</em>
        </span>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 'none' }}
          onClick={() => openTrendPanel(video, 'script')}
        >
          <Wand /> Mon script
        </button>
      </div>
      <div className="reco-item">
        <Check />
        <span style={{ flex: 1 }}>
          Utiliser le son « {sound.name} »
          <em>+{sound.growth} % · fenêtre de tir</em>
        </span>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 'none' }}
          aria-label={`Sauvegarder le son ${sound.name}`}
          onClick={() =>
            saveItem(
              'sound',
              sound.id,
              { name: sound.name, artist: sound.artist, growth: sound.growth, videos: sound.videos, note: sound.note },
              `« ${sound.name} » ajouté à votre bibliothèque`,
            )
          }
        >
          <Save />
        </button>
      </div>
      <div className="reco-item">
        <Check />
        <span style={{ flex: 1 }}>
          Ouvrir avec un hook {hook.type.toLowerCase()}
          <em>{hook.performance} % de rétention sur vos niches</em>
        </span>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 'none' }}
          aria-label="Copier le hook"
          onClick={() => {
            navigator.clipboard?.writeText(hook.text);
            toast('Hook copié dans le presse-papiers');
          }}
        >
          <Copy />
        </button>
      </div>
    </aside>
  );
}
