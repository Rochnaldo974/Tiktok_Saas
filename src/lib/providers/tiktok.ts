import { realVideo, type Video } from '@/lib/data';

/* Provider de données TikTok réelles (EnsembleData).
   - Activé par ENSEMBLEDATA_TOKEN (essai gratuit sur ensembledata.com) ;
     sans token, tout renvoie [] et l'app reste sur le moteur de démo.
   - Une requête par niche suivie (posts récents du hashtag), cache
     serveur 45 min — le quota du token est préservé.
   - Parsing défensif : tout champ manquant → la vidéo est ignorée,
     toute erreur réseau → fallback silencieux vers la démo. */

const CACHE_TTL_MS = 45 * 60 * 1000;
const cache = new Map<string, { at: number; videos: Video[] }>();

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
  music?: { title?: string; author?: string };
  video?: { duration?: number; cover?: { url_list?: string[] }; origin_cover?: { url_list?: string[] } };
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

async function fetchKeywordVideos(
  query: string,
  niche: string,
  country: string,
  generic = false,
  period = 7,
): Promise<Video[]> {
  const token = process.env.ENSEMBLEDATA_TOKEN;
  if (!token || !query) return [];
  const key = `${query}|${country}|${generic}|${period}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.videos;

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
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`TikTok provider: ${res.status} pour « ${query} »`);
      return hit?.videos ?? [];
    }
    const payload = (await res.json()) as {
      data?: { data?: RawSearchItem[]; posts?: RawSearchItem[] } | RawSearchItem[];
    };
    const d = payload.data;
    const items = Array.isArray(d) ? d : d?.data ?? d?.posts ?? [];
    const videos = items
      .map((item) => (item.aweme_info ? mapPost(item.aweme_info, niche, country, generic) : null))
      .filter((v): v is Video => v !== null)
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // Niche peu active sur 7 jours → on élargit à 30 (un seul retry).
    if (videos.length < 4 && period === 7) {
      return fetchKeywordVideos(query, niche, country, generic, 30);
    }
    cache.set(key, { at: Date.now(), videos });
    return videos;
  } catch (error) {
    console.error('TikTok provider error', error);
    return hit?.videos ?? [];
  }
}

function fetchNicheVideos(niche: string, country: string): Promise<Video[]> {
  return fetchKeywordVideos(niche.toLowerCase(), niche, country);
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
  return fetchKeywordVideos(query, 'Tendance', country, true);
}

/* Vidéos réelles pour toutes les niches suivies, entrelacées
   (niche 1, niche 2, ..., puis 2e vidéo de chaque niche...). */
export async function getRealVideos(niches: string[], country: string): Promise<Video[]> {
  if (!realDataEnabled() || !niches.length) return [];
  const perNiche = await Promise.all(niches.slice(0, 8).map((n) => fetchNicheVideos(n, country)));
  const out: Video[] = [];
  const max = Math.max(...perNiche.map((l) => l.length), 0);
  for (let i = 0; i < max; i++) {
    for (const list of perNiche) {
      if (list[i]) out.push(list[i]);
    }
  }
  return out;
}
