'use client';

import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { KIND_LABELS, type SavedKind } from '@/lib/library';
import { Music, Quote, Film, X, Copy } from '@/components/icons';
import { toast } from '@/components/toaster';

export interface SavedItem {
  id: string;
  kind: SavedKind;
  ref_id: string;
  country: string;
  timeframe: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const ICONS: Record<SavedKind, React.ReactNode> = {
  sound: <Music />,
  hook: <Quote />,
  idea: <Film />,
};
const TONES: Record<SavedKind, string> = {
  sound: 'cyan',
  hook: 'good',
  idea: 'hot',
};

function title(item: SavedItem): string {
  const p = item.payload;
  if (item.kind === 'sound') return `« ${p.name} » — ${p.artist}`;
  if (item.kind === 'hook') return `« ${p.text} »`;
  return `« ${p.title} » (${p.niche})`;
}

function meta(item: SavedItem): string {
  const p = item.payload;
  const when = new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  if (item.kind === 'sound') return `+${p.growth} % · ${item.country} · sauvegardé le ${when}`;
  if (item.kind === 'hook') return `${p.type} · ${p.performance} % de rétention · sauvegardé le ${when}`;
  return `Hook : « ${p.hook} » · Son : « ${p.sound} » · sauvegardé le ${when}`;
}

function copyText(item: SavedItem): string {
  const p = item.payload;
  if (item.kind === 'sound') return `${p.name} — ${p.artist}`;
  if (item.kind === 'hook') return String(p.text);
  return `${p.title}\nHook : ${p.hook}\nSon : ${p.sound}\nCTA : ${p.cta}`;
}

export function LibraryList({ items }: { items: SavedItem[] }) {
  const router = useRouter();

  async function remove(item: SavedItem) {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { error } = await supabase.from('saved_items').delete().eq('id', item.id);
    if (error) {
      toast('Suppression impossible — réessayez');
      return;
    }
    toast('Retiré de votre bibliothèque');
    router.refresh();
  }

  return (
    <div className="card reveal">
      {items.map((item) => (
        <div key={item.id} className="alert-row">
          <span className={`alert-ico ${TONES[item.kind]}`}>{ICONS[item.kind]}</span>
          <div className="alert-body">
            <div className="alert-title">{title(item)}</div>
            <div className="alert-desc">{meta(item)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="chip">{KIND_LABELS[item.kind]}</span>
            <button
              className="icon-btn"
              aria-label="Copier"
              onClick={() => {
                navigator.clipboard?.writeText(copyText(item));
                toast('Copié dans le presse-papiers');
              }}
            >
              <Copy />
            </button>
            <button className="icon-btn" aria-label="Retirer de la bibliothèque" onClick={() => remove(item)}>
              <X />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
