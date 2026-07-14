import Link from 'next/link';
import { dataset, fmt, resolveCountry, resolveTimeframe } from '@/lib/data';
import { getPrefs } from '@/lib/prefs';
import { VideoCard } from '@/components/cards/video-card';
import { SoundCard } from '@/components/cards/sound-card';
import { HookCard } from '@/components/cards/hook-card';
import { CreatorCard } from '@/components/cards/creator-card';
import { TagCard } from '@/components/cards/tag-card';
import { Ring } from '@/components/cards/ring';
import { ArrowRight, Check, Radar, Flame, Music, Quote, Film, Clock } from '@/components/icons';

type Search = Promise<{ country?: string; tf?: string }>;

export const metadata = { title: "Aujourd'hui" };

export default async function TodayPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const prefs = await getPrefs();
  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;
  const d = dataset(country, timeframe);

  const topVideo = d.videos[0];
  const topSound = d.sounds[0];
  const topHook = d.hooks[0];
  const peaking = d.videos.filter((v) => v.status === 'Peaking').length;
  const rising = d.sounds.filter((s) => s.rising).length;
  const avgViral = Math.round(d.videos.slice(0, 20).reduce((a, v) => a + v.viralScore, 0) / 20);
  const pulse = Math.min(99, avgViral + 4);
  const q = `?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="page">
      <div className="content">
        {/* brief quotidien */}
        <section className="hero reveal" aria-labelledby="brief-title">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">Signal live — {country} · {timeframe}</p>
              <h1 className="hero-title" id="brief-title">
                {topVideo.niche} bouge. {peaking} formats sont au pic en ce moment.
              </h1>
              <div className="hero-brief">
                <p>
                  La vidéo la plus forte du jour — <strong>« {topVideo.title} »</strong> par{' '}
                  <strong>{topVideo.creator.handle}</strong> — croît de{' '}
                  <strong>+{topVideo.growth} %</strong> avec {fmt(topVideo.views)} vues. {topVideo.summary}
                </p>
                <p>
                  Côté audio, <strong>« {topSound.name} »</strong> gagne{' '}
                  <strong>+{topSound.growth} %</strong> avec moins de {fmt(topSound.videos)} vidéos —{' '}
                  {rising} sons sont dans leur fenêtre de tir en {country}.
                </p>
              </div>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-lg" href={`/idees${q}`}>
                  Explorer les idées du jour <ArrowRight />
                </Link>
                <Link className="btn btn-secondary btn-lg" href={`/idees${q}&q=${encodeURIComponent(topVideo.niche)}`}>
                  Ouvrir le flux {topVideo.niche}
                </Link>
              </div>
            </div>
            <aside className="reco-panel">
              <h4>Le plan du jour</h4>
              <div className="reco-item">
                <Check />
                <span>
                  Filmer « {topVideo.title} »
                  <em>{topVideo.prodTime} · {topVideo.niche}</em>
                </span>
              </div>
              <div className="reco-item">
                <Check />
                <span>
                  Utiliser le son « {topSound.name} »
                  <em>+{topSound.growth} % · fenêtre de tir</em>
                </span>
              </div>
              <div className="reco-item">
                <Check />
                <span>
                  Ouvrir avec un hook {topHook.type.toLowerCase()}
                  <em>{topHook.performance} % de rétention sur des vidéos similaires</em>
                </span>
              </div>
            </aside>
          </div>
        </section>

        {/* vidéos virales */}
        <section aria-labelledby="viral-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Détecté {timeframe === "Aujourd'hui" ? "aujourd'hui" : `sur ${timeframe.toLowerCase()}`}</p>
              <h2 className="section-title" id="viral-title">Viral en ce moment</h2>
              <p className="section-sub">Les formats à la croissance la plus forte en {country}.</p>
            </div>
            <Link className="section-link" href={`/idees${q}`}>
              Toutes les idées <ArrowRight />
            </Link>
          </div>
          <div className="video-grid">
            {d.videos.slice(0, 6).map((v, i) => (
              <VideoCard key={v.id} video={v} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* sons montants */}
        <section aria-labelledby="sounds-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Radar audio</p>
              <h2 className="section-title" id="sounds-title">Sons montants</h2>
              <p className="section-sub">À attraper avant qu&apos;ils dépassent 5 000 vidéos.</p>
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
              <p className="eyebrow">Ingénierie de rétention</p>
              <h2 className="section-title" id="hooks-title">Les hooks qui retiennent</h2>
              <p className="section-sub">Phrases d&apos;ouverture classées par rétention mesurée.</p>
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
              <h2 className="section-title" id="tags-title">Hashtags chauds</h2>
              <p className="section-sub">Là où le feed {country} se concentre.</p>
            </div>
          </div>
          <div className="tag-grid">
            {d.hashtags.slice(0, 8).map((t, i) => (
              <TagCard key={t.id} tag={t} country={country} timeframe={timeframe} delay={i * 40} />
            ))}
          </div>
        </section>

        {/* créateurs */}
        <section aria-labelledby="creators-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Profils à étudier</p>
              <h2 className="section-title" id="creators-title">Créateurs à suivre</h2>
              <p className="section-sub">Les comptes qui grandissent le plus vite sur votre marché cette semaine.</p>
            </div>
          </div>
          <div className="creator-grid">
            {d.creators.slice(0, 6).map((c, i) => (
              <CreatorCard key={c.id} creator={c} delay={i * 60} />
            ))}
          </div>
        </section>
      </div>

      {/* rail droit */}
      <aside className="rail">
        <div className="card rail-card reveal">
          <h4><span className="pulse" /> Pouls du marché</h4>
          <div className="score-hero">
            <div>
              <div className="score-num">{pulse}<small>/100</small></div>
              <div className="score-label">L&apos;activité du marché est <b>élevée</b> — une bonne journée pour publier.</div>
            </div>
            <Ring value={pulse} accent />
          </div>
        </div>
        <div className="card rail-card reveal" style={{ animationDelay: '80ms' }}>
          <h4>{country} · {timeframe}</h4>
          <div className="rail-row">
            <span className="k"><Film /> Vidéos analysées</span>
            <span className="v">{fmt(d.videos.length * 214)}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Flame /> Formats au pic</span>
            <span className="v">{peaking}<small>agir sous 48 h</small></span>
          </div>
          <div className="rail-row">
            <span className="k"><Music /> Sons en fenêtre de tir</span>
            <span className="v">{rising}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Radar /> Score viral moyen</span>
            <span className="v">{avgViral}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Clock /> Brief mis à jour</span>
            <span className="v">{today}</span>
          </div>
        </div>
        <div className="card rail-quote reveal" style={{ animationDelay: '160ms' }}>
          <p>{topHook.text}</p>
          <span><Quote style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} /> Top hook · {topHook.performance} % de rétention</span>
        </div>
      </aside>
    </div>
  );
}
