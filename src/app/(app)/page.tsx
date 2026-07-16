import Link from 'next/link';
import { dataset, fmt, resolveCountry, resolveTimeframe } from '@/lib/data';
import { getRealVideos, getGlobalRealVideos, getRealSounds, getRealHashtags, getRealHooks } from '@/lib/providers/tiktok';
import { getPrefsState } from '@/lib/prefs';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Onboarding } from '@/components/onboarding';
import { DailyPlan } from '@/components/daily-plan';
import { VideoCard } from '@/components/cards/video-card';
import { SoundCard } from '@/components/cards/sound-card';
import { HookCard } from '@/components/cards/hook-card';
import { CreatorCard } from '@/components/cards/creator-card';
import { TagCard } from '@/components/cards/tag-card';
import { Ring } from '@/components/cards/ring';
import { ArrowRight, Radar, Flame, Music, Quote, Film, Clock, Wand, Calendar } from '@/components/icons';

type Search = Promise<{ country?: string; tf?: string }>;

export const metadata = { title: "Aujourd'hui" };

export default async function TodayPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const { prefs, configured, user } = await getPrefsState();

  /* Première visite : on demande les niches avant de montrer quoi que ce soit. */
  if (!configured) {
    return (
      <div className="page" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content"><Onboarding /></div>
      </div>
    );
  }

  const country = params.country ? resolveCountry(params.country) : prefs.country;
  const timeframe = params.tf ? resolveTimeframe(params.tf) : prefs.tf;
  const d = dataset(country, timeframe, prefs.niches);
  const followed = prefs.niches;
  const inNiches = (niche: string) => followed.includes(niche);

  /* Le brief est calculé DANS les niches du créateur ; le viral global
     reste visible plus bas, marqué quand il sort de son périmètre.
     Si le provider de données réelles est actif, les vidéos des niches
     suivies sont de VRAIES vidéos TikTok (miniature + lien). */
  const [realVideos, globalReal, realSounds, realHashtags, realHooks] = await Promise.all([
    getRealVideos(followed, country),
    getGlobalRealVideos(country),
    getRealSounds(followed, country),
    getRealHashtags(followed, country),
    getRealHooks(followed, country),
  ]);
  const mockMine = d.videos.filter((v) => inNiches(v.niche));
  const myVideos = realVideos.length ? realVideos : mockMine;
  const viralVideos = globalReal.length ? globalReal : d.videos;
  const sounds = realSounds.length ? realSounds : d.sounds;
  const hashtags = realHashtags.length
    ? realHashtags
    : [...d.hashtags].sort((a, b) => Number(inNiches(b.niche)) - Number(inNiches(a.niche)));
  const hooks = realHooks.length
    ? realHooks
    : [...d.hooks].sort((a, b) => Number(b.industries.some(inNiches)) - Number(a.industries.some(inNiches)));
  const topVideo = myVideos[0] ?? d.videos[0];
  const topSound = sounds[0];
  const topHook = hooks[0] ?? d.hooks[0];
  const myPeaking = myVideos.filter((v) => v.status === 'Peaking').length;
  const rising = d.sounds.filter((s) => s.rising).length;
  const avgViral = Math.round(d.videos.slice(0, 20).reduce((a, v) => a + v.viralScore, 0) / 20);
  const transferable = d.videos.find((v) => !inNiches(v.niche) && v.status !== 'Saturated');
  const q = `?country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  /* Les actions du planning dues aujourd'hui (ou en retard) — le rappel
     qui fait revenir chaque jour — et le score du dernier audit. */
  let planToday: { id: string; label: string }[] = [];
  let profileScore: number | null = null;
  let profileHandle: string | null = null;
  if (user) {
    const supabase = await getSupabaseServer();
    const [{ data: planData }, { data: profileData }] = await Promise.all([
      supabase!
        .from('plan_items')
        .select('id, label')
        .eq('done', false)
        .lte('due_date', new Date().toISOString().slice(0, 10))
        .order('due_date', { ascending: true })
        .limit(3),
      supabase!.from('profiles').select('tiktok_handle, tiktok_analysis').eq('id', user.id).single(),
    ]);
    planToday = planData ?? [];
    const analysis = profileData?.tiktok_analysis as { score?: number } | null;
    if (typeof analysis?.score === 'number') {
      profileScore = analysis.score;
      profileHandle = profileData?.tiktok_handle ?? null;
    }
  }

  return (
    <div className="page">
      <div className="content">
        {/* titre : au premier coup d'œil, on sait ce qu'on regarde */}
        <header style={{ marginBottom: -24 }}>
          <h1 className="section-title" style={{ fontSize: 28 }}>Votre brief du jour</h1>
          <p className="section-sub">
            Ce qui bouge dans vos niches et quoi tourner — recalculé chaque jour pour {followed.join(', ')}.
          </p>
        </header>

        {/* brief quotidien — personnalisé sur les niches suivies */}
        <section className="hero reveal" aria-labelledby="brief-title">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">{country} · {timeframe}</p>
              <h1 className="hero-title" id="brief-title">
                {topVideo.niche} bouge pour vous. {myPeaking} format{myPeaking > 1 ? 's' : ''} au pic dans vos niches.
              </h1>
              <div className="hero-brief">
                <p>
                  La vidéo la plus forte du jour dans votre périmètre — <strong>« {topVideo.title} »</strong> par{' '}
                  <strong>{topVideo.creator.handle}</strong> — croît de{' '}
                  <strong>+{topVideo.growth} %</strong> avec {fmt(topVideo.views)} vues. {topVideo.summary}
                </p>
                {topSound.real ? (
                  <p>
                    Côté audio, <strong>« {topSound.name} »</strong> porte{' '}
                    <strong>{topSound.trendCount} tendance{(topSound.trendCount ?? 0) > 1 ? 's' : ''}</strong> de
                    vos niches cette semaine{topSound.videos > 0 ? <> ({fmt(topSound.videos)} vidéos au total)</> : null}.
                  </p>
                ) : (
                  <p>
                    Côté audio, <strong>« {topSound.name} »</strong> gagne{' '}
                    <strong>+{topSound.growth} %</strong> avec moins de {fmt(topSound.videos)} vidéos —{' '}
                    {rising} sons sont dans leur fenêtre de tir en {country}.
                  </p>
                )}
              </div>
              <div className="hero-actions">
                <Link className="btn btn-primary btn-lg" href={`/idees${q}&niche=${encodeURIComponent(topVideo.niche)}`}>
                  Mes idées {topVideo.niche} <ArrowRight />
                </Link>
                <Link className="btn btn-secondary btn-lg" href={`/idees${q}`}>
                  Toutes les idées du jour
                </Link>
              </div>
            </div>
            <DailyPlan video={topVideo} sound={topSound} hook={topHook} />
          </div>
        </section>

        {/* vos niches d'abord */}
        <section aria-labelledby="mine-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Dans vos niches</p>
              <h2 className="section-title" id="mine-title">À filmer en priorité</h2>
              <p className="section-sub">Les formats qui montent dans {followed.join(', ')}.</p>
            </div>
            <Link className="section-link" href={`/idees${q}`}>
              Toutes les idées <ArrowRight />
            </Link>
          </div>
          <div className="video-grid">
            {myVideos.slice(0, 6).map((v, i) => (
              <VideoCard key={v.id} video={v} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* viral global, marqué hors-niche */}
        <section aria-labelledby="viral-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Tout TikTok {country}</p>
              <h2 className="section-title" id="viral-title">Viral en ce moment</h2>
              <p className="section-sub">Le top toutes niches — utile quand un format est transposable à la vôtre.</p>
            </div>
          </div>
          <div className="video-grid">
            {viralVideos.slice(0, 6).map((v, i) => (
              <VideoCard key={v.id} video={v} delay={i * 60} outside={!v.real && !inNiches(v.niche)} />
            ))}
          </div>
        </section>

        {/* sons montants */}
        <section aria-labelledby="sounds-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Radar audio</p>
              <h2 className="section-title" id="sounds-title">Sons montants</h2>
              <p className="section-sub">À attraper avant qu&apos;ils dépassent 5 000 vidéos — les sons traversent toutes les niches.</p>
            </div>
          </div>
          <div className="sound-grid">
            {sounds.slice(0, 6).map((s, i) => (
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
              <p className="section-sub">
                {realHooks.length
                  ? 'Les accroches réelles des vidéos qui tournent dans vos niches cette semaine.'
                  : 'En premier : ceux qui performent dans vos niches.'}
              </p>
            </div>
          </div>
          <div className="hook-grid">
            {hooks.slice(0, 6).map((h, i) => (
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
            {hashtags.slice(0, 8).map((t, i) => (
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
              <p className="section-sub">Les comptes qui grandissent le plus vite dans vos niches.</p>
            </div>
          </div>
          <div className="creator-grid">
            {[...d.creators]
              .sort((a, b) => Number(inNiches(b.niche)) - Number(inNiches(a.niche)))
              .slice(0, 6)
              .map((c, i) => (
                <CreatorCard key={c.id} creator={c} delay={i * 60} />
              ))}
          </div>
        </section>
      </div>

      {/* rail droit */}
      <aside className="rail">
        {planToday.length > 0 && (
          <div className="card rail-card reveal" style={{ borderColor: 'rgba(254,44,85,0.35)' }}>
            <h4 style={{ color: 'var(--accent)' }}><Calendar style={{ width: 13, height: 13 }} /> Votre planning aujourd&apos;hui</h4>
            {planToday.map((item) => (
              <div key={item.id} className="rail-row" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--text)', lineHeight: 1.45 }}>{item.label}</span>
              </div>
            ))}
            <Link className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%' }} href="/planning">
              Ouvrir le planning <ArrowRight />
            </Link>
          </div>
        )}
        {profileScore !== null ? (
          <div className="card rail-card reveal">
            <h4><span className="pulse" /> Votre score de profil</h4>
            <div className="score-hero">
              <div>
                <div className="score-num">{profileScore}<small>/100</small></div>
                <div className="score-label">
                  Potentiel de croissance{profileHandle ? <> de <b>@{profileHandle}</b></> : null}
                </div>
              </div>
              <Ring value={profileScore} accent />
            </div>
            <Link className="btn btn-secondary btn-sm" style={{ marginTop: 14, width: '100%' }} href="/analyse">
              Revoir mon audit <ArrowRight />
            </Link>
          </div>
        ) : (
          <div className="card rail-card reveal">
            <h4><span className="pulse" /> Votre score de profil</h4>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.55 }}>
              Collez votre @ TikTok : l&apos;IA calcule votre potentiel de croissance et vous
              rend un plan d&apos;action sur 7 jours.
            </p>
            <Link className="btn btn-primary btn-sm" style={{ marginTop: 14, width: '100%' }} href="/analyse">
              <Radar /> Analyser mon profil
            </Link>
          </div>
        )}
        <div className="card rail-card reveal" style={{ animationDelay: '80ms' }}>
          <h4>{country} · {timeframe}</h4>
          <div className="rail-row">
            <span className="k"><Film /> Vidéos analysées</span>
            <span className="v">{fmt(d.videos.length * 214)}</span>
          </div>
          <div className="rail-row">
            <span className="k"><Flame /> Au pic dans vos niches</span>
            <span className="v">{myPeaking}<small>agir sous 48 h</small></span>
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
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--faint)', lineHeight: 1.5 }}>
            {realVideos.length
              ? 'Vidéos, sons, hooks et hashtags de vos niches sont de vraies données TikTok des 7 derniers jours (badge « Réel »).'
              : "Données en cours de chargement ou indisponibles — tendances simulées affichées en attendant. L'analyse de profil, elle, utilise toujours de vraies données."}
          </p>
        </div>
        {transferable && (
          <div className="card rail-card reveal" style={{ animationDelay: '120ms' }}>
            <h4><Wand style={{ width: 13, height: 13 }} /> Idée à voler à une autre niche</h4>
            <p style={{ color: 'var(--faint)', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
              Ce format cartonne ailleurs — reprenez sa mécanique dans votre niche avant les autres.
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.01em', lineHeight: 1.35 }}>
              « {transferable.title} »
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
              +{transferable.growth} % en {transferable.niche}. Pourquoi ça marche :{' '}
              {transferable.summary.charAt(0).toLowerCase() + transferable.summary.slice(1)}
            </p>
            <Link
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 14, width: '100%' }}
              href={`/copilote${q}`}
            >
              L&apos;adapter à ma niche avec le copilote
            </Link>
          </div>
        )}
        <div className="card rail-quote reveal" style={{ animationDelay: '160ms' }}>
          <p>{topHook.text}</p>
          <span>
            <Quote style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px' }} />{' '}
            {topHook.real
              ? `Hook réel · ${fmt(topHook.views ?? 0)} vues cette semaine`
              : `Top hook · ${topHook.performance} % de rétention`}
          </span>
        </div>
      </aside>
    </div>
  );
}
