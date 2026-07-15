'use client';

import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import type { PlanItem } from '@/lib/planning';
import { X } from '@/components/icons';
import { toast } from '@/components/toaster';

/* Checklist du planning, groupée par jour. Aujourd'hui est mis en
   avant ; le passé non fait reste visible (à rattraper). */

function dayLabel(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (iso === today) return "Aujourd'hui";
  const d = new Date(iso + 'T12:00:00');
  const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function PlanningList({ items }: { items: PlanItem[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const byDate = new Map<string, PlanItem[]>();
  for (const item of items) {
    const list = byDate.get(item.due_date) ?? [];
    list.push(item);
    byDate.set(item.due_date, list);
  }

  async function toggle(item: PlanItem) {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { error } = await supabase.from('plan_items').update({ done: !item.done }).eq('id', item.id);
    if (error) {
      toast('Mise à jour impossible — réessayez');
      return;
    }
    if (!item.done) toast('Bien joué — action cochée ✓');
    router.refresh();
  }

  async function remove(item: PlanItem) {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const { error } = await supabase.from('plan_items').delete().eq('id', item.id);
    if (error) {
      toast('Suppression impossible — réessayez');
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...byDate.entries()].map(([date, dayItems]) => {
        const isToday = date === today;
        const isPast = date < today;
        return (
          <div
            key={date}
            className="card rail-card reveal"
            style={{
              padding: 20,
              borderColor: isToday ? 'rgba(254,44,85,0.4)' : undefined,
            }}
          >
            <h4 style={{ color: isToday ? 'var(--accent)' : undefined }}>
              {dayLabel(date)}
              {isPast && dayItems.some((i) => !i.done) ? ' · à rattraper' : ''}
            </h4>
            {dayItems.map((item) => (
              <div key={item.id} className="rail-row" style={{ alignItems: 'flex-start' }}>
                <label
                  style={{ display: 'flex', gap: 11, cursor: 'pointer', flex: 1, minWidth: 0, alignItems: 'flex-start' }}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggle(item)}
                    style={{ marginTop: 4, accentColor: 'var(--accent)', width: 15, height: 15, flex: 'none', cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: item.done ? 'var(--faint)' : 'var(--text)',
                      textDecoration: item.done ? 'line-through' : 'none',
                    }}
                  >
                    {item.label}
                  </span>
                </label>
                <button
                  className="icon-btn"
                  aria-label="Supprimer cette action"
                  style={{ width: 28, height: 28, flex: 'none' }}
                  onClick={() => remove(item)}
                >
                  <X style={{ width: 13, height: 13 }} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
