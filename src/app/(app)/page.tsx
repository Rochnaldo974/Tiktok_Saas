import Link from 'next/link';
import { dataset, fmt, resolveCountry, resolveTimeframe } from '@/lib/data';
import { VideoCard } from '@/components/cards/video-card';
import { SoundCard } from '@/components/cards/sound-card';
import { HookCard } from '@/components/cards/hook-card';
import { CreatorCard } from '@/components/cards/creator-card';
import { TagCard } from '@/components/cards/tag-card';
import { Ring } from '@/components/cards/ring';
import { ArrowRight, Check, Radar, Flame, Music, Quote, Film, Clock } from '@/components/icons';

type Search = Promise<{ country?: string; tf?: string }>;

export const metadata = { title: 'Today' };

export default async function TodayPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const country = resolveCountry(params.country);
  const timeframe = resolveTimeframe(params.tf);
  const d = dataset(country, timeframe);

  const topVideo = d.videos[0];
  const topSound = d.sounds[0];
  const topHook = d.hooks[0];
  const peaking = d.videos.filter((v) => v.status === 'Peaking').length;
  const rising = d.sounds.filter((s) => s.rising).length;
  const avgViral = Math.round(d.videos.slice(0, 20).reduce((a, v) => a + v.viralScore, 0) / 20);
  const pulse = Math.min(99, avgViral + 4);
  const q = `?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page">
      <div className="content">
        {/* daily brief hero */}
        <section className="hero reveal" aria-labelledby="brief-title">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">Live signal — {country} · {timeframe}</p>
              <h1 className="hero-title" id="brief-title">
                {topVideo.niche} is moving. {peaking} formats are peaking right now.
              </h1>
              <div className="hero-brief">
                <p>
                  The strongest video of the day — <strong>“{topVideo.title}”</strong> by{' '}
                  <strong>{topVideo.creator.handle}</strong> — is growing{' '}
                  <strong>+{topVideo.growth}%</strong> with {fmt(topVideo.views)} views. {topVideo.summary}
                </p>
                <p>
                  On the audio side, <strong>“{topSound.name}”</strong> is up{' '}
                  <strong>+{topSound.growth}%</strong> and still under {fmt(topSound.videos)} videos —{' '}
                  {rising} sounds are in their early window across {country}.
                </p>
              </div>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-lg" href={`/ideas${q}`}>
                  Explore today&apos;s ideas <ArrowRight />
                </Link>
                <Link className="btn btn-secondary btn-lg" href={`/ideas${q}&q=${encodeURIComponent(topVideo.niche)}`}>
                  Open {topVideo.niche} feed
                </Link>
              </div>
            </div>
            <aside className="reco-panel">
              <h4>Today&apos;s plan</h4>
              <div className="reco-item">
                <Check />
                <span>
                  Film “{topVideo.title}”
                  <em>{topVideo.prodTime} · {topVideo.difficulty} · {topVideo.niche}</em>
                </span>
              </div>
              <div className="reco-item">
                <Check />
                <span>
                  Use the sound “{topSound.name}”
                  <em>+{topSound.growth}% · early window</em>
                </span>
              </div>
              <div className="reco-item">
                <Check />
                <span>
                  Open with a {topHook.type.toLowerCase()} hook
                  <em>{topHook.performance}% retention on similar videos</em>
                </span>
              </div>
            </aside>
          </div>
        </section>

        {/* viral videos */}
        <section aria-labelledby="viral-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Detected {timeframe.toLowerCase()}</p>
              <h2 className="section-title" id="viral-title">Viral right now</h2>
              <p className="section-sub">Formats with the steepest growth curve in {country}.</p>
            </div>
            <Link className="section-link" href={`/ideas${q}`}>
              All ideas <ArrowRight />
            </Link>
          </div>
          <div className="video-grid">
            {d.videos.slice(0, 6).map((v, i) => (
              <VideoCard key={v.id} video={v} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* rising sounds */}
        <section aria-labelledby="sounds-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Audio radar</p>
              <h2 className="section-title" id="sounds-title">Rising sounds</h2>
              <p className="section-sub">Catch them before they cross 5k videos.</p>
            </div>
          </div>
          <div className="sound-grid">
            {d.sounds.slice(0, 6).map((s, i) => (
              <SoundCard key={s.id} sound={s} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* hooks */}
        <section aria-labelledby="hooks-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Retention engineering</p>
              <h2 className="section-title" id="hooks-title">Hooks that hold</h2>
              <p className="section-sub">Opening lines ranked by measured watch-through.</p>
            </div>
          </div>
          <div className="hook-grid">
            {d.hooks.slice(0, 6).map((h, i) => (
              <HookCard key={h.id} hook={h} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* hashtags */}
        <section aria-labelledby="tags-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Distribution</p>
              <h2 className="section-title" id="tags-title">Hashtag heat</h2>
              <p className="section-sub">Where the {country} feed is clustering.</p>
            </div>
          </div>
          <div className="tag-grid">
            {d.hashtags.slice(0, 8).map((t, i) => (
              <TagCard key={t.id} tag={t} country={country} timeframe={timeframe} delay={i * 40} />
            ))}
          </div>
        </section>

        {/* creators */}
        <section aria-labelledby="creators-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">People to study</p>
              <h2 className="section-title" id="creators-title">Creators to watch</h2>
              <p className="section-sub">The fastest-growing accounts in your market this week.</p>
            </div>
          </div>
          <div className="creator-grid">
            {d.creators.slice(0, 6).map((c, i) => (
              <CreatorCard key={c.id} creator={c} delay={i * 60} />
            ))}
          </div>
        </section>
      </div>

      {/* right rail */}
      <aside className="rail">
        <div className="card rail-card reveal">
          <h4><span className="pulse" /> Trend pulse</h4>
          <div className="score-hero">
            <div>
              <div className="score-num">{pulse}<small>/100</small></div>
              <div className="score-label">Market activity is <b>high</b> — a good day to publish.</div>
            </div>
            <Ring value={pulse} accent />
          </div>
        </div>
        <div className="card rail-card reveal" style={{ animationDelay: '80ms' }}>
          <h4>{country} · {timeframe}</h4>
          <div className="rail-row">
            <span className="k"><Film /> Videos analyzed</span>
            <span className="v">{fmt(d.videos.length * 214)}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Flame /> Peaking formats</span>
            <span className="v">{peaking}<small>act within 48h</small></span>
          </div>
          <div className="rail-row">
            <span className="k"><Music /> Sounds in early window</span>
            <span className="v">{rising}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Radar /> Avg viral score</span>
            <span className="v">{avgViral}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Clock /> Brief updated</span>
            <span className="v">{today}</span>
          </div>
        </div>
        <div className="card rail-quote reveal" style={{ animationDelay: '160ms' }}>
          <p>{topHook.text}</p>
          <span><Quote style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} /> Top hook · {topHook.performance}% retention</span>
        </div>
      </aside>
    </div>
  );
}
