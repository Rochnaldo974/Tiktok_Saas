import Link from 'next/link';
import { resolveCountry, resolveTimeframe } from '@/lib/data';
import { buildAlerts, type AlertKind } from '@/lib/alerts';
import { getPrefs } from '@/lib/prefs';
import { AlertRules } from '@/components/alerts/rules';
import { Flame, Music, Quote, Users, ArrowRight } from '@/components/icons';

type Search = Promise<{ country?: string; tf?: string }>;

export const metadata = { title: 'Alertes' };

const ICONS: Record<AlertKind, React.ReactNode> = {
  peak: <Flame />,
  sound: <Music />,
  hook: <Quote />,
  creator: <Users />,
};

export default async function AlertsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const prefs = await getPrefs();
  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;
  const q = `?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  const alerts = buildAlerts(country, timeframe, prefs.niches);

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
              <span className={`alert-ico ${a.tone}`}>{ICONS[a.kind]}</span>
              <div className="alert-body">
                <div className="alert-title">{a.title}</div>
                <div className="alert-desc">{a.desc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span className="alert-time">{a.time}</span>
                {a.niche && (
                  <Link className="section-link" href={`/idees${q}&niche=${encodeURIComponent(a.niche)}`}>
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
