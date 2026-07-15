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

function nicheToTag(niche: string): string {
  return niche
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
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

function mapPost(post: RawPost, niche: string, country: string): Video | null {
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
    title: title || `Vidéo ${niche} de @${handle}`,
    niche,
    country,
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

async function fetchNicheVideos(niche: string, country: string): Promise<Video[]> {
  const token = process.env.ENSEMBLEDATA_TOKEN;
  if (!token) return [];
  const key = `${niche}|${country}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.videos;

  const tag = nicheToTag(niche);
  if (!tag) return [];
  try {
    const params = new URLSearchParams({ name: tag, cursor: '0', token });
    const res = await fetch(`https://ensembledata.com/apis/tt/hashtag/posts?${params}`, {
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`TikTok provider: ${res.status} pour #${tag}`);
      return hit?.videos ?? [];
    }
    const payload = (await res.json()) as {
      data?: { posts?: RawPost[]; data?: RawPost[] } | RawPost[];
    };
    const d = payload.data;
    const rawPosts = Array.isArray(d) ? d : d?.data ?? d?.posts ?? [];
    const videos = rawPosts
      .map((p) => mapPost(p, niche, country))
      .filter((v): v is Video => v !== null)
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
    cache.set(key, { at: Date.now(), videos });
    return videos;
  } catch (error) {
    console.error('TikTok provider error', error);
    return hit?.videos ?? [];
  }
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
