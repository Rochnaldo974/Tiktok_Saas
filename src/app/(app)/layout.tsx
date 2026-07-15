import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { TrendPanel } from '@/components/trend-panel';
import { getPrefsState } from '@/lib/prefs';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { prefs, user } = await getPrefsState();
  return (
    <div className="shell">
      <Sidebar
        defaultCountry={prefs.country}
        defaultTimeframe={prefs.tf}
        followedNiches={prefs.niches}
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
      <TrendPanel />
    </div>
  );
}
