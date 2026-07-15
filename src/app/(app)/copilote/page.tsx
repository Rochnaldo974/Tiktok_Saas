import { resolveCountry, resolveTimeframe } from '@/lib/data';
import { getPrefs } from '@/lib/prefs';
import { CopilotChat } from '@/components/copilot/chat';

type Search = Promise<{ country?: string; tf?: string }>;

export const metadata = { title: 'Copilote IA' };

export default async function CopilotPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const prefs = await getPrefs();
  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;

  return (
    <div className="page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="content" style={{ gap: 28 }}>
        <header>
          <p className="eyebrow">Copilote IA — {country} · {timeframe}</p>
          <h1 className="page-title" style={{ marginTop: 12 }}>Demandez au copilote</h1>
          <p className="page-sub" style={{ marginTop: 14 }}>
            Il connaît les tendances du moment en {country} : demandez-lui quoi poster,
            une analyse de niche, un son à prendre ou un hook à améliorer.
          </p>
        </header>
        <CopilotChat country={country} timeframe={timeframe} followedNiches={prefs.niches} />
        <p style={{ color: 'var(--faint)', fontSize: 12.5 }}>
          Réponses de démonstration générées localement à partir des données de tendances —
          la connexion à l&apos;API Claude est prévue dans la feuille de route.
        </p>
      </div>
    </div>
  );
}
