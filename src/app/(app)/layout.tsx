import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { BottomNav } from '@/components/shell/bottom-nav';
import { TrendPanel } from '@/components/trend-panel';
import { AdaptationFlow } from '@/components/adaptation/adaptation-flow';
import { ContextCopilot } from '@/components/copilot/context-copilot';
import { getPrefsState } from '@/lib/prefs';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { prefs, user } = await getPrefsState();
  return (
    <div className="shell">
      <Sidebar
        defaultCountry={prefs.country}
        defaultTimeframe={prefs.tf}
        followedNiches={prefs.niches}
        userEmail={user?.email ?? null}
      />
      <div className="main">
        <Topbar
          defaultCountry={prefs.country}
          defaultTimeframe={prefs.tf}
          followedNiches={prefs.niches}
          userEmail={user?.email ?? null}
        />
        {children}
      </div>
      {/* Composants globaux montés une seule fois, pilotés par événements */}
      <TrendPanel />
      <AdaptationFlow />
      <ContextCopilot
        country={prefs.country}
        timeframe={prefs.tf}
        followedNiches={prefs.niches}
      />
      <BottomNav />
    </div>
  );
}
