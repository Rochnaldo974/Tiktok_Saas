import { hashStr, realVideo, type Video, type Sound, type Hashtag } from '@/lib/data';

/* Provider de données TikTok réelles (EnsembleData).
   - Activé par ENSEMBLEDATA_TOKEN (essai gratuit sur ensembledata.com) ;
     sans token, tout renvoie [] et l'app reste sur le moteur de démo.
   - Une requête par niche suivie (posts récents du hashtag), cache
     serveur 45 min — le quota du token est préservé.
   - Parsing défensif : tout champ manquant → la vidéo est ignorée,
     toute erreur réseau → fallback silencieux vers la démo. */

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
}
const cache = new Map<string, { at: number; bundle: Bundle }>();
/* Déduplication : plusieurs rendus simultanés partagent le même appel. */
const inFlight = new Map<string, Promise<Bundle>>();
const EMPTY_BUNDLE: Bundle = { videos: [], sounds: [], hashtags: [] };

export function realDataEnabled(): boolean {
  return Boolean(process.env.ENSEMBLEDATA_TOKEN);
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

async function fetchKeywordBundle(
  query: string,
  niche: string,
  country: string,
  generic = false,
  period = 7,
): Promise<Bundle> {
  const token = process.env.ENSEMBLEDATA_TOKEN;
  if (!token || !query) return EMPTY_BUNDLE;
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
  const token = process.env.ENSEMBLEDATA_TOKEN!;
  const hit = cache.get(key);
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
      console.error(`TikTok provider: ${res.status} pour « ${query} »`);
      return hit?.bundle ?? EMPTY_BUNDLE;
    }
    const payload = (await res.json()) as {
      data?: { data?: RawSearchItem[]; posts?: RawSearchItem[] } | RawSearchItem[];
    };
    const d = payload.data;
    const items = Array.isArray(d) ? d : d?.data ?? d?.posts ?? [];
    const rawPosts = items
      .map((item) => item.aweme_info)
      .filter((p): p is RawPost => Boolean(p));
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
