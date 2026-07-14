import Link from 'next/link';
import { dataset, fmt, ago, resolveCountry, resolveTimeframe } from '@/lib/data';
import { getPrefs } from '@/lib/prefs';
import { AlertRules } from '@/components/alerts/rules';
import { Flame, Music, Quote, Users, ArrowRight } from '@/components/icons';

type Search = Promise<{ country?: string; tf?: string }>;

export const metadata = { title: 'Alertes' };

export default async function AlertsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const prefs = await getPrefs();
  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;
  const d = dataset(country, timeframe);
  const q = `?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  type Alert = {
    key: string;
    tone: 'hot' | 'good' | 'cyan' | '';
    icon: React.ReactNode;
    title: string;
    desc: string;
    time: string;
    href?: string;
  };

  const alerts: Alert[] = [];

  for (const niche of prefs.niches) {
    const v = d.videos.find((x) => x.niche === niche && (x.status === 'Peaking' || x.status === 'Growing'));
    if (v) {
      alerts.push({
        key: `v-${v.id}`,
        tone: 'hot',
        icon: <Flame />,
        title: `Format ${v.status === 'Peaking' ? 'au pic' : 'en croissance'} dans ${niche}`,
        desc: `« ${v.title} » — +${v.growth} %, ${fmt(v.views)} vues. ${v.context}`,
        time: ago(v.uploadedH),
        href: `/idees${q}&niche=${encodeURIComponent(niche)}`,
      });
    }
  }
  for (const s of d.sounds.filter((x) => x.rising).slice(0, 2)) {
    alerts.push({
      key: `s-${s.id}`,
      tone: 'cyan',
      icon: <Music />,
      title: 'Son en fenêtre de tir',
      desc: `« ${s.name} » (${s.artist}) — +${s.growth} %, encore ${fmt(s.videos)} vidéos. ${s.note}`,
      time: `il y a ${s.duration} h`,
    });
  }
  const h = d.hooks[0];
  alerts.push({
    key: `h-${h.id}`,
    tone: 'good',
    icon: <Quote />,
    title: 'Nouveau hook de référence',
    desc: `« ${h.text} » atteint ${h.performance} % de rétention. ${h.explanation}`,
    time: 'il y a 3 h',
  });
  const c = d.creators[0];
  alerts.push({
    key: `c-${c.id}`,
    tone: '',
    icon: <Users />,
    title: `${c.handle} accélère`,
    desc: `+${c.growth} % cette semaine (${c.niche}). ${c.reason}`,
    time: 'il y a 9 h',
  });

  return (
    <div className="page" style={{ gridTemplateColumns: 'minmax(0, 1fr) 296px' }}>
      <div className="content" style={{ gap: 28 }}>
        <header>
          <p className="eyebrow">Alertes — {country} · {timeframe}</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Ce qui mérite votre attention</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Générées à partir de vos niches suivies ({prefs.niches.join(', ')}) —
            modifiables dans les <Link href={`/reglages${q}`} style={{ textDecoration: 'underline' }}>réglages</Link>.
          </p>
        </header>

        <div className="card reveal">
          {alerts.map((a) => (
            <div key={a.key} className="alert-row">
              <span className={`alert-ico ${a.tone}`}>{a.icon}</span>
              <div className="alert-body">
                <div className="alert-title">{a.title}</div>
                <div className="alert-desc">{a.desc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span className="alert-time">{a.time}</span>
                {a.href && (
                  <Link className="section-link" href={a.href}>
                    Voir <ArrowRight />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="rail">
        <AlertRules />
      </aside>
    </div>
  );
}
