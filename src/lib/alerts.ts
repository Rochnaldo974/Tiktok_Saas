import { dataset, fmt, ago } from '@/lib/data';

/* Construction des alertes — partagée entre la page Alertes et le
   badge de la sidebar pour que le compteur corresponde toujours
   exactement au contenu de la page. Pur/isomorphe (déterministe). */

export type AlertKind = 'peak' | 'sound' | 'hook' | 'creator';
export type AlertTone = 'hot' | 'good' | 'cyan' | '';

export interface AlertItem {
  key: string;
  kind: AlertKind;
  tone: AlertTone;
  title: string;
  desc: string;
  time: string;
  niche?: string;
}

export function buildAlerts(country: string, timeframe: string, niches: string[]): AlertItem[] {
  const d = dataset(country, timeframe, niches);
  const alerts: AlertItem[] = [];

  for (const niche of niches) {
    const v = d.videos.find((x) => x.niche === niche && (x.status === 'Peaking' || x.status === 'Growing'));
    if (v) {
      alerts.push({
        key: `v-${v.id}`,
        kind: 'peak',
        tone: 'hot',
        title: `Format ${v.status === 'Peaking' ? 'au pic' : 'en croissance'} dans ${niche}`,
        desc: `« ${v.title} » — +${v.growth} %, ${fmt(v.views)} vues. ${v.context}`,
        time: ago(v.uploadedH),
        niche,
      });
    }
  }
  for (const s of d.sounds.filter((x) => x.rising).slice(0, 2)) {
    alerts.push({
      key: `s-${s.id}`,
      kind: 'sound',
      tone: 'cyan',
      title: 'Son en fenêtre de tir',
      desc: `« ${s.name} » (${s.artist}) — +${s.growth} %, encore ${fmt(s.videos)} vidéos. ${s.note}`,
      time: `il y a ${s.duration} h`,
    });
  }
  const h = d.hooks[0];
  alerts.push({
    key: `h-${h.id}`,
    kind: 'hook',
    tone: 'good',
    title: 'Nouveau hook de référence',
    desc: `« ${h.text} » atteint ${h.performance} % de rétention. ${h.explanation}`,
    time: 'il y a 3 h',
  });
  const c = d.creators[0];
  alerts.push({
    key: `c-${c.id}`,
    kind: 'creator',
    tone: '',
    title: `${c.handle} accélère`,
    desc: `+${c.growth} % cette semaine (${c.niche}). ${c.reason}`,
    time: 'il y a 9 h',
  });

  return alerts;
}
