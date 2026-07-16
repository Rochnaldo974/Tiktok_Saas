import {
  hashStr,
  realVideo,
  fmt,
  extractHookText,
  classifyHookType,
  type Video,
  type Sound,
  type Hashtag,
  type Hook,
} from '@/lib/data';

/* Provider de données TikTok réelles, à deux sources :
   1. tikwm.com (PRIMAIRE) — gratuit, sans clé, ~1 req/s : recherche
      par mot-clé avec période, tri par likes et région. C'est la
      source par défaut : l'app fonctionne en vraies données sans
      aucun abonnement.
   2. EnsembleData (SECOURS) — activé par ENSEMBLEDATA_TOKEN, appelé
      seulement si tikwm ne renvoie rien (panne, rate limit).
   Les deux sources sont normalisées vers le même format de post
   (aweme), donc vidéos / sons / hashtags / hooks en sont extraits de
   la même façon. Une requête par niche suivie, cache serveur 45 min.
   Parsing défensif : champ manquant → post ignoré, erreur réseau →
   fallback silencieux vers la démo. SIGNAL_DEMO_DATA=1 force la démo. */

const CACHE_TTL_MS = 45 * 60 * 1000;
/* L'API du plan d'essai répond en 3-7 s : timeout large côté fetch,
   mais la PAGE n'attend jamais plus que l'échéance souple — la requête
   continue en arrière-plan et remplit le cache pour le rendu suivant. */
const FETCH_TIMEOUT_MS = 20_000;
const SOFT_DEADLINE_MS = 8_000;

function softly<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), SOFT_DEADLINE_MS)),
  ]);
}

/* Un appel = un bundle complet : vidéos + sons + hashtags extraits des
   mêmes posts (aucun coût API supplémentaire pour sons/hashtags). */
interface Bundle {
  videos: Video[];
  sounds: Sound[];
  hashtags: Hashtag[];
  hooks: Hook[];
}
const cache = new Map<string, { at: number; bundle: Bundle }>();
/* Déduplication : plusieurs rendus simultanés partagent le même appel. */
const inFlight = new Map<string, Promise<Bundle>>();
const EMPTY_BUNDLE: Bundle = { videos: [], sounds: [], hashtags: [], hooks: [] };

export function realDataEnabled(): boolean {
  /* tikwm ne demande aucune clé : les vraies données sont toujours
     actives. Le kill switch ne sert qu'aux démos / au debug. */
  return process.env.SIGNAL_DEMO_DATA !== '1';
}

/* Les posts EnsembleData suivent le format aweme de TikTok. */
interface RawPost {
  aweme_id?: string;
  desc?: string;
  create_time?: number;
  share_url?: string;
  author?: { unique_id?: string; follower_count?: number };
  statistics?: { play_count?: number; digg_count?: number; comment_count?: number; share_count?: number };
  music?: {
    id?: number | string;
    title?: string;
    author?: string;
    duration?: number;
    user_count?: number;
    cover_thumb?: { url_list?: string[] };
  };
  text_extra?: { hashtag_name?: string }[];
  video?: { duration?: number; cover?: { url_list?: string[] }; origin_cover?: { url_list?: string[] } };
}

/* Hashtags trop génériques pour être une info utile. */
const GENERIC_TAGS = new Set([
  'fyp', 'fy', 'foryou', 'foryoupage', 'pourtoi', 'pourtoii', 'viral', 'virale',
  'tiktok', 'trend', 'trending', 'parati', 'fürdich', 'perte', 'fypシ', 'xyzbca',
]);

function extractSounds(posts: RawPost[], niche: string): Sound[] {
  const byId = new Map<string, Sound & { postViews: number }>();
  for (const post of posts) {
    const m = post.music;
    const id = m?.id !== undefined ? String(m.id) : null;
    if (!id || !m?.title) continue;
    const views = post.statistics?.play_count ?? 0;
    const existing = byId.get(id);
    if (existing) {
      existing.trendCount = (existing.trendCount ?? 1) + 1;
      existing.postViews += views;
    } else {
      byId.set(id, {
        id: 'rm' + id,
        name: m.title.slice(0, 60),
        artist: (m.author ?? '').slice(0, 40),
        hue: hashStr(id) % 360,
        videos: m.user_count ?? 0,
        growth: 0,
        rising: (m.user_count ?? 0) > 0 && (m.user_count ?? 0) < 100_000,
        note: '',
        duration: Math.min(60, Math.round(m.duration ?? 15)),
        real: true,
        cover: m.cover_thumb?.url_list?.[0],
        trendCount: 1,
        postViews: views,
      });
    }
  }
  return [...byId.values()]
    .sort((a, b) => (b.trendCount ?? 0) - (a.trendCount ?? 0) || b.postViews - a.postViews)
    .map(({ postViews: _unused, ...sound }) => ({
      ...sound,
      note: `Utilisé dans ${sound.trendCount} tendance${(sound.trendCount ?? 0) > 1 ? 's' : ''} ${niche} de la semaine.`,
    }));
}

function extractHashtags(posts: RawPost[], niche: string, query: string): Hashtag[] {
  const byName = new Map<string, { views: number; count: number }>();
  for (const post of posts) {
    const views = post.statistics?.play_count ?? 0;
    const names = new Set(
      (post.text_extra ?? [])
        .map((t) => t.hashtag_name?.toLowerCase())
        .filter((n): n is string => Boolean(n && n.length >= 2 && n.length <= 30)),
    );
    for (const name of names) {
      if (GENERIC_TAGS.has(name) || name === query.toLowerCase()) continue;
      const entry = byName.get(name) ?? { views: 0, count: 0 };
      entry.views += views;
      entry.count += 1;
      byName.set(name, entry);
    }
  }
  return [...byName.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].views - a[1].views)
    .slice(0, 10)
    .map(([name, agg]) => ({
      id: 'rt' + name,
      tag: '#' + name,
      growth: 0,
      videos: 0,
      niche,
      real: true,
      views: agg.views,
    }));
}

/* Hooks réels : la première phrase de la description des posts qui
   tournent, avec l'engagement MESURÉ (likes/vues) comme performance.
   Sous 10 k vues, une accroche ne prouve rien → ignorée. */
function extractHooks(posts: RawPost[], niche: string): Hook[] {
  const seen = new Set<string>();
  const out: (Hook & { likes: number })[] = [];
  for (const post of posts) {
    const views = post.statistics?.play_count ?? 0;
    const likes = post.statistics?.digg_count ?? 0;
    if (views < 10_000) continue;
    const text = extractHookText(post.desc ?? '');
    if (!text) continue;
    const norm = text.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push({
      id: 'rh' + (post.aweme_id ?? String(seen.size)) + '-' + hashStr(norm) % 997,
      text,
      type: classifyHookType(text),
      performance: Math.max(1, Math.min(40, Math.round((likes / views) * 100))),
      industries: [niche],
      avgDuration: Math.max(5, Math.round((post.video?.duration ?? 15000) / 1000)),
      explanation: `Accroche réelle d'une vidéo ${niche} à ${fmt(views)} vues cette semaine.`,
      real: true,
      views,
      url: post.share_url,
      likes,
    });
  }
  return out
    .sort((a, b) => b.likes - a.likes)
    .map(({ likes: _unused, ...hook }) => hook);
}

function mapPost(post: RawPost, niche: string, country: string, generic = false): Video | null {
  const id = post.aweme_id;
  const stats = post.statistics;
  const cover =
    post.video?.cover?.url_list?.[0] ?? post.video?.origin_cover?.url_list?.[0] ?? null;
  const url = post.share_url;
  const handle = post.author?.unique_id;
  if (!id || !stats || !cover || !url || !handle) return null;
  const title = (post.desc ?? '').replace(/#\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);
  return realVideo({
    id,
    title: title || `Vidéo ${niche.toLowerCase()} de @${handle}`,
    niche,
    country,
    generic,
    views: stats.play_count ?? 0,
    likes: stats.digg_count ?? 0,
    comments: stats.comment_count ?? 0,
    shares: stats.share_count ?? 0,
    duration: (post.video?.duration ?? 15000) / 1000,
    createTime: post.create_time,
    creatorHandle: handle,
    creatorFollowers: post.author?.follower_count ?? 0,
    soundName: post.music?.title ?? '',
    soundArtist: post.music?.author ?? '',
    cover,
    url,
  });
}

/* La recherche par mot-clé accepte une période (jours) et un pays :
   c'est elle qui donne des tendances FRAÎCHES (vs les tops historiques
   du hashtag). Items enveloppés dans { aweme_info: {...} }. */
const COUNTRY_CODES: Record<string, string> = {
  France: 'fr',
  Belgique: 'be',
  Suisse: 'ch',
  'États-Unis': 'us',
  'Royaume-Uni': 'gb',
  Espagne: 'es',
  Allemagne: 'de',
  Italie: 'it',
  Canada: 'ca',
  Australie: 'au',
};

interface RawSearchItem {
  aweme_info?: RawPost;
}

/* ---------- Source 1 : tikwm.com (gratuit, sans clé) ----------
   Limite publique ~1 requête/seconde → les appels sont sérialisés
   avec un intervalle ; le cache 45 min fait le reste. */
const TIKWM_GAP_MS = 1200;
let tikwmTail: Promise<void> = Promise.resolve();

function tikwmSlot(): Promise<void> {
  const slot = tikwmTail;
  tikwmTail = slot.then(() => new Promise((r) => setTimeout(r, TIKWM_GAP_MS)));
  return slot;
}

interface TikwmItem {
  video_id?: string;
  title?: string;
  region?: string;
  create_time?: number;
  duration?: number;
  cover?: string;
  origin_cover?: string;
  play_count?: number;
  digg_count?: number;
  comment_count?: number;
  share_count?: number;
  author?: { unique_id?: string };
  music_info?: { id?: number | string; title?: string; author?: string; duration?: number; cover?: string };
}

/* Normalise un item tikwm vers le format aweme commun aux deux sources. */
function tikwmToRawPost(item: TikwmItem): RawPost | null {
  const id = item.video_id;
  const handle = item.author?.unique_id;
  if (!id || !handle) return null;
  const title = item.title ?? '';
  const music = item.music_info;
  return {
    aweme_id: id,
    desc: title,
    create_time: item.create_time,
    share_url: `https://www.tiktok.com/@${handle}/video/${id}`,
    author: { unique_id: handle, follower_count: 0 },
    statistics: {
      play_count: item.play_count ?? 0,
      digg_count: item.digg_count ?? 0,
      comment_count: item.comment_count ?? 0,
      share_count: item.share_count ?? 0,
    },
    music:
      music?.id !== undefined
        ? {
            id: music.id,
            title: music.title,
            author: music.author,
            duration: music.duration,
            user_count: 0, // non fourni par tikwm
            cover_thumb: { url_list: music.cover ? [music.cover] : [] },
          }
        : undefined,
    text_extra: [...title.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => ({ hashtag_name: m[1] })),
    video: {
      duration: (item.duration ?? 15) * 1000, // tikwm en secondes, aweme en ms
      cover: { url_list: item.cover ? [item.cover] : item.origin_cover ? [item.origin_cover] : [] },
    },
  };
}

async function fetchTikwmPosts(query: string, country: string, period: number): Promise<RawPost[]> {
  await tikwmSlot();
  try {
    const params = new URLSearchParams({
      keywords: query,
      count: '20',
      region: COUNTRY_CODES[country] ?? 'fr',
      publish_time: String(period), // 7 ou 30 jours — valeurs supportées
      sort_type: '1', // par likes
    });
    const res = await fetch(`https://www.tikwm.com/api/feed/search?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`TikTok provider (tikwm): ${res.status} pour « ${query} »`);
      return [];
    }
    const payload = (await res.json()) as { code?: number; data?: { videos?: TikwmItem[] } };
    if (payload.code !== 0) {
      console.error(`TikTok provider (tikwm): code ${payload.code} pour « ${query} »`);
      return [];
    }
    const items = payload.data?.videos ?? [];
    /* tikwm marque la région de CHAQUE vidéo : on garde le pays demandé
       en priorité, et on ne complète avec le reste que si c'est maigre. */
    const wanted = (COUNTRY_CODES[country] ?? 'fr').toUpperCase();
    const local = items.filter((v) => (v.region ?? '').toUpperCase() === wanted);
    const kept = local.length >= 4 ? local : items;
    return kept.map(tikwmToRawPost).filter((p): p is RawPost => p !== null);
  } catch (error) {
    console.error('TikTok provider (tikwm)', error);
    return [];
  }
}

/* ---------- Source 2 : EnsembleData (secours, si token) ---------- */
async function fetchEnsemblePosts(query: string, country: string, period: number): Promise<RawPost[]> {
  const token = process.env.ENSEMBLEDATA_TOKEN;
  if (!token) return [];
  try {
    const params = new URLSearchParams({
      name: query,
      cursor: '0',
      period: String(period),
      sorting: '1', // par likes — les tendances, pas le bruit
      country: COUNTRY_CODES[country] ?? 'fr',
      token,
    });
    const res = await fetch(`https://ensembledata.com/apis/tt/keyword/search?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`TikTok provider (EnsembleData): ${res.status} pour « ${query} »`);
      return [];
    }
    const payload = (await res.json()) as {
      data?: { data?: RawSearchItem[]; posts?: RawSearchItem[] } | RawSearchItem[];
    };
    const d = payload.data;
    const items = Array.isArray(d) ? d : d?.data ?? d?.posts ?? [];
    return items.map((item) => item.aweme_info).filter((p): p is RawPost => Boolean(p));
  } catch (error) {
    console.error('TikTok provider (EnsembleData)', error);
    return [];
  }
}

async function fetchKeywordBundle(
  query: string,
  niche: string,
  country: string,
  generic = false,
  period = 7,
): Promise<Bundle> {
  if (!query) return EMPTY_BUNDLE;
  const key = `${query}|${country}|${generic}|${period}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.bundle;

  const pending = inFlight.get(key);
  if (pending) return pending;
  const promise = doFetchKeywordBundle(key, query, niche, country, generic, period).finally(() =>
    inFlight.delete(key),
  );
  inFlight.set(key, promise);
  return promise;
}

async function doFetchKeywordBundle(
  key: string,
  query: string,
  niche: string,
  country: string,
  generic: boolean,
  period: number,
): Promise<Bundle> {
  const hit = cache.get(key);
  try {
    /* tikwm d'abord (gratuit) ; EnsembleData seulement si tikwm rend
       trop peu — le quota du token est réservé aux pannes. */
    let rawPosts = await fetchTikwmPosts(query, country, period);
    if (rawPosts.length < 4) {
      const backup = await fetchEnsemblePosts(query, country, period);
      if (backup.length > rawPosts.length) rawPosts = backup;
    }
    const videos = rawPosts
      .map((p) => mapPost(p, niche, country, generic))
      .filter((v): v is Video => v !== null)
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // Niche peu active sur 7 jours → on élargit à 30 (un seul retry).
    if (videos.length < 4 && period === 7) {
      return fetchKeywordBundle(query, niche, country, generic, 30);
    }
    const bundle: Bundle = {
      videos,
      sounds: extractSounds(rawPosts, niche),
      hashtags: extractHashtags(rawPosts, niche, query),
      /* pas de hooks depuis les tendances globales : sans niche, une
         accroche hors contexte n'est pas actionnable */
      hooks: generic ? [] : extractHooks(rawPosts, niche),
    };
    cache.set(key, { at: Date.now(), bundle });
    return bundle;
  } catch (error) {
    console.error('TikTok provider error', error);
    return hit?.bundle ?? EMPTY_BUNDLE;
  }
}

function fetchNicheBundle(niche: string, country: string): Promise<Bundle> {
  return fetchKeywordBundle(niche.toLowerCase(), niche, country);
}

/* Tendances globales du pays (section « Viral en ce moment »). */
const COUNTRY_TREND_QUERY: Record<string, string> = {
  France: 'pourtoi',
  Belgique: 'pourtoi',
  Suisse: 'pourtoi',
  'États-Unis': 'fyp',
  'Royaume-Uni': 'fyp',
  Espagne: 'parati',
  Allemagne: 'fürdich',
  Italie: 'perte',
  Canada: 'pourtoi',
  Australie: 'fyp',
};

export async function getGlobalRealVideos(country: string): Promise<Video[]> {
  if (!realDataEnabled()) return [];
  const query = COUNTRY_TREND_QUERY[country] ?? 'viral';
  return softly(
    fetchKeywordBundle(query, 'Tendance', country, true).then((b) => b.videos),
    [],
  );
}

/* Sons réels : agrégés sur toutes les niches suivies (mêmes bundles,
   donc aucun appel API en plus après getRealVideos). */
export async function getRealSounds(niches: string[], country: string): Promise<Sound[]> {
  if (!realDataEnabled() || !niches.length) return [];
  const bundles = await softly(
    Promise.all(niches.slice(0, 8).map((n) => fetchNicheBundle(n, country))),
    [] as Bundle[],
  );
  const byId = new Map<string, Sound>();
  for (const bundle of bundles) {
    for (const sound of bundle.sounds) {
      const existing = byId.get(sound.id);
      if (existing) {
        existing.trendCount = (existing.trendCount ?? 0) + (sound.trendCount ?? 0);
      } else {
        byId.set(sound.id, { ...sound });
      }
    }
  }
  return [...byId.values()]
    .sort((a, b) => (b.trendCount ?? 0) - (a.trendCount ?? 0) || b.videos - a.videos)
    .slice(0, 6);
}

/* Hashtags réels : les tags qui reviennent dans les tendances fraîches
   des niches suivies, pondérés par vues. */
export async function getRealHashtags(niches: string[], country: string): Promise<Hashtag[]> {
  if (!realDataEnabled() || !niches.length) return [];
  const bundles = await softly(
    Promise.all(niches.slice(0, 8).map((n) => fetchNicheBundle(n, country))),
    [] as Bundle[],
  );
  const byTag = new Map<string, Hashtag>();
  for (const bundle of bundles) {
    for (const tag of bundle.hashtags) {
      const existing = byTag.get(tag.tag);
      if (existing) {
        existing.views = (existing.views ?? 0) + (tag.views ?? 0);
      } else {
        byTag.set(tag.tag, { ...tag });
      }
    }
  }
  return [...byTag.values()]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 8);
}

/* Hooks réels : accroches des posts qui tournent dans les niches
   suivies, entrelacées par niche (diversité avant volume). */
export async function getRealHooks(niches: string[], country: string): Promise<Hook[]> {
  if (!realDataEnabled() || !niches.length) return [];
  const bundles = await softly(
    Promise.all(niches.slice(0, 8).map((n) => fetchNicheBundle(n, country))),
    [] as Bundle[],
  );
  const seen = new Set<string>();
  const out: Hook[] = [];
  const max = Math.max(...bundles.map((b) => b.hooks.length), 0);
  for (let i = 0; i < max; i++) {
    for (const bundle of bundles) {
      const hook = bundle.hooks[i];
      if (!hook) continue;
      const norm = hook.text.toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(hook);
    }
  }
  return out.slice(0, 8);
}

/* Vidéos réelles pour toutes les niches suivies, entrelacées
   (niche 1, niche 2, ..., puis 2e vidéo de chaque niche...). */
export async function getRealVideos(niches: string[], country: string): Promise<Video[]> {
  if (!realDataEnabled() || !niches.length) return [];
  const aggregate = Promise.all(
    niches.slice(0, 8).map(async (n) => (await fetchNicheBundle(n, country)).videos),
  ).then((perNiche) => {
    const out: Video[] = [];
    const max = Math.max(...perNiche.map((l) => l.length), 0);
    for (let i = 0; i < max; i++) {
      for (const list of perNiche) {
        if (list[i]) out.push(list[i]);
      }
    }
    return out;
  });
  return softly(aggregate, []);
}
