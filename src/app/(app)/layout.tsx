import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { TrendPanel } from '@/components/trend-panel';
import { getPrefs } from '@/lib/prefs';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const prefs = await getPrefs();
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
        />
        {children}
      </div>
      <TrendPanel />
    </div>
  );
}
