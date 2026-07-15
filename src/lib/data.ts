/* =========================================================
   Signal — moteur de données mock
   Déterministe, seedé par (pays, période) : chaque "refresh"
   donne l'impression de données live, sans backend.
   Pur et isomorphe : sûr côté serveur comme côté client,
   les deux dérivent exactement le même dataset pour une clé.
   ========================================================= */

export interface Country {
  code: string;
  name: string;
}

export interface Niche {
  name: string;
  hue: number;
  topics: string[];
}

export interface Creator {
  id: string;
  handle: string;
  niche: string;
  hue: number;
  country: string;
  followers: number;
  growth: number;
  avgViews: number;
  engagement: string;
  reason: string;
  initials: string;
}

export interface Sound {
  id: string;
  name: string;
  artist: string;
  hue: number;
  videos: number;
  growth: number;
  rising: boolean;
  note: string;
  duration: number;
}

export interface Hook {
  id: string;
  text: string;
  type: string;
  performance: number;
  industries: string[];
  avgDuration: number;
  explanation: string;
}

export interface Hashtag {
  id: string;
  tag: string;
  growth: number;
  videos: number;
  niche: string;
}

/* Valeurs internes stables (classes CSS, filtres d'URL) ;
   l'affichage passe par les maps *_LABELS ci-dessous. */
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Saturation = 'Low' | 'Medium' | 'High';
export type TrendStatus = 'New' | 'Growing' | 'Peaking' | 'Saturated';

export const STATUS_LABELS: Record<TrendStatus, string> = {
  New: 'Nouveau',
  Growing: 'En croissance',
  Peaking: 'Au pic',
  Saturated: 'Saturé',
};
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  Easy: 'Facile',
  Medium: 'Moyen',
  Hard: 'Difficile',
};
export const SATURATION_LABELS: Record<Saturation, string> = {
  Low: 'Faible',
  Medium: 'Moyenne',
  High: 'Élevée',
};

export interface Video {
  id: string;
  /* Données réelles (provider TikTok) : miniature, lien direct, marqueur. */
  cover?: string;
  url?: string;
  real?: boolean;
  title: string;
  niche: string;
  hue: number;
  angle: number;
  country: string;
  creator: Creator;
  sound: Sound;
  hook: Hook;
  contentType: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  growth: number;
  viralScore: number;
  opportunity: number;
  status: TrendStatus;
  difficulty: Difficulty;
  diffReason: string;
  prodTime: string;
  prodReason: string;
  budget: string;
  saturation: Saturation;
  satReason: string;
  chips: string[];
  emotions: string[];
  cta: string;
  uploadedH: number;
  summary: string;
  context: string;
}

export interface Dataset {
  creators: Creator[];
  sounds: Sound[];
  hooks: Hook[];
  hashtags: Hashtag[];
  videos: Video[];
}

/* ---------- RNG seedé ---------- */
type Rnd = () => number;

function mulberry32(a: number): Rnd {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---------- vocabulaire ---------- */
export const COUNTRIES: Country[] = [
  { code: 'FR', name: 'France' },
  { code: 'US', name: 'États-Unis' },
  { code: 'UK', name: 'Royaume-Uni' },
  { code: 'ES', name: 'Espagne' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australie' },
];

export const TIMEFRAMES = ["Aujourd'hui", '24 heures', '7 jours', '30 jours'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const NICHES: Niche[] = [
  { name: 'Finance',    hue: 152, topics: ["l'erreur d'argent que tout le monde fait", "comment j'ai mis 10 k€ de côté en 6 mois", 'les frais bancaires que personne ne vérifie', 'investir tes 100 premiers euros', 'pourquoi ton épargne perd de la valeur', 'la règle 50/30/20 testée', 'un revenu complémentaire qui marche vraiment', 'lire sa fiche de paie correctement'] },
  { name: 'Fitness',    hue: 12,  topics: ['les 3 seuls exercices dont tu as besoin', 'pourquoi ton entraînement ne marche plus', 'une routine matinale de 10 minutes', 'les mythes sur les protéines démontés', 'des résultats en 2 séances par semaine', 'corriger sa posture au bureau', 'marche vs course pour perdre du gras', "l'angoisse de la salle et comment la vaincre"] },
  { name: 'Cuisine',    hue: 35,  topics: ['un dîner en 5 ingrédients', 'la technique des pâtes que les chefs cachent', 'du batch cooking pour 20 € la semaine', 'pourquoi le riz du restaurant est meilleur', 'une poêle, quatre repas', "l'astuce du beurre pour le steak", 'du pain sans pétrissage', 'des courses notées par un chef'] },
  { name: 'Beauté',     hue: 320, topics: ['la routine du matin en 3 produits', 'pourquoi ton fond de teint se sépare', 'les dupes de pharmacie testés', "l'ordre des soins expliqué", 'ce que les dermatos n’achètent jamais', 'les erreurs de cils que tout le monde fait', 'les mythes sur la SPF corrigés', 'un look du quotidien en 2 minutes'] },
  { name: 'Immobilier', hue: 210, topics: ['ce que 200 k€ achètent dans chaque ville', "les red flags d'une visite de location", 'négocier son premier appartement', 'le home staging qui ajoute 15 k€', 'lire une annonce immobilière', 'pourquoi cet appart ne se vend pas', "les coûts cachés de l'achat", 'louer ou acheter en 2026'] },
  { name: 'Voyage',     hue: 190, topics: ['48 heures à Lisbonne bien faites', 'le bon moment pour réserver un vol, testé', 'la méthode du bagage cabine', 'hôtels vs appartements comparés', 'la carte des pièges à touristes', 'voyager avec 50 € par jour', 'les astuces que le personnel des aéroports utilise', 'les secrets de la basse saison'] },
  { name: 'Gaming',     hue: 265, topics: ['le réglage que les pros ne touchent jamais', 'monter un setup à moins de 800 €', 'pourquoi tu stagnes en ranked', 'les mécaniques cachées expliquées', "la routine d'échauffement qui marche", 'manette vs clavier, le débat tranché', 'les jeux qui respectent ton temps', "l'exercice d'aim qui m'a débloqué"] },
  { name: 'Lifestyle',  hue: 45,  topics: ['une routine 5h du matin réaliste', 'remettre son appart à zéro chaque semaine', 'la règle des 2 minutes en pratique', "ce que j'ai arrêté d'acheter", 'un système de dimanche lent', 'désencombrement numérique pas à pas', 'les habitudes qui composent en silence', 'rendre les semaines plus légères'] },
  { name: 'Marketing',  hue: 0,   topics: ['la formule de hook derrière 1M de vues', 'des pubs qui ressemblent à du contenu', 'pourquoi ton CTA est ignoré', 'une landing page en 60 secondes', 'organique vs payant en 2026', 'la psychologie des pages de prix', 'des briefs UGC qui convertissent', "des objets d'email testés"] },
  { name: 'Éducation',  hue: 220, topics: ['la méthode de travail des meilleurs étudiants', 'apprendre une langue en 20 min par jour', 'les systèmes de prise de notes comparés', 'les astuces mémoire qui survivent aux examens', 'pourquoi relire ne sert à rien', "les outils IA pour réviser honnêtement", "la courbe de l'oubli expliquée", 'se concentrer sans volonté'] },
];

/* Niches personnalisées : n'importe quel métier saisi par l'utilisateur
   (danse, poterie, coiffure...) obtient son contenu, généré par templates
   français seedés sur le nom de la niche. */
const CUSTOM_TOPICS = [
  "l'erreur que tout le monde fait en {n}",
  "3 choses à savoir avant de se lancer en {n}",
  '{n} : la technique que personne ne montre',
  'une journée dans ma vie de créateur {n}',
  'le matériel minimal pour débuter en {n}',
  "ce qu'un an de {n} m'a appris",
  'les 5 bases de {n} en 30 secondes',
  "j'ai testé la tendance {n} du moment",
];

export function isBuiltInNiche(name: string): boolean {
  return NICHES.some((n) => n.name === name);
}

export function customNiche(name: string): Niche {
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  return {
    name,
    hue: hashStr(name) % 360,
    topics: CUSTOM_TOPICS.map((t) => t.replace('{n}', lower)),
  };
}

const FIRST = ['lea', 'max', 'nora', 'theo', 'emma', 'lucas', 'jade', 'hugo', 'lina', 'noah', 'mila', 'adam', 'zoe', 'liam', 'ines', 'sacha', 'anna', 'elio', 'maya', 'nino'];
const SUFFIX = ['talks', 'daily', 'studio', 'notes', 'lab', 'files', 'club', 'works', 'diary', 'method', 'space', 'radar', 'signal', 'sense', 'mode', 'craft', 'scope', 'loop', 'shift', 'frame'];

const SOUND_NAMES = [
  'Golden Hour Loop', 'Midnight Drive', 'Slow Motion Blur', 'Neon Static', 'Soft Focus',
  'Velvet Tempo', 'Glass Morning', 'Analog Heart', 'Paper Planes', 'Low Tide',
  'Sugar Rush', 'Night Shift', 'Open Window', 'Silver Lining', 'Warm Static',
  'Deep Fade', 'City Bloom', 'Quiet Storm', 'Amber Waves', 'Fast Lane',
  'Cloud Cover', 'Echo Park', 'Blue Hour', 'Daydream Sequence', 'Motionless',
  'After Hours', 'First Light', 'Undertone', 'Side Streets', 'Half Speed',
  'Overexposed', 'Backseat Radio', 'Cold Brew', 'Small Hours', 'Fever Pitch',
  'Late Bloom', 'Static Dreams', 'Sunset Grid', 'North Face', 'Double Take',
  'Slow Burn', 'Cross Fade', 'High Tide', 'Afterglow', 'Clean Break',
  'Night Vision', 'Second Wind', 'Free Fall', 'Homebound', 'Wide Awake',
  'Bright Side', 'Dark Room', 'Rewind Culture', 'Solar Flare', 'Ghost Note',
  'Vantage Point', 'New Balance', 'Off Script', 'Main Character', 'Final Cut',
];
const ARTISTS = [
  'Novae', 'Kito Bay', 'Elm & Ivy', 'Marlowe', 'DJ Ceres', 'Aiko June', 'Fleur Noire',
  'The Standbys', 'Milo Reyes', 'Casa Blanca', 'Yuna Sol', 'Arcade Youth', 'Petit Bruit',
  'Hazel Grove', 'Lo-Fi Louvre', 'Nightbus', 'Clara West', 'Ombre', 'Ken Aoki', 'Vera Lune',
];

const HOOK_TEMPLATES = [
  { text: 'Personne ne parle de cette astuce sur {topic}...', type: 'Curiosité' },
  { text: 'Arrête de faire ça si {topic} compte pour toi.', type: 'Rupture' },
  { text: "J'aurais aimé qu'on me dise ça sur {topic}.", type: 'Confession' },
  { text: 'Voilà pourquoi tes résultats sur {topic} stagnent.', type: 'Diagnostic' },
  { text: "La règle sur {topic} que j'ai volée à un pro.", type: 'Autorité' },
  { text: 'POV : tu comprends enfin {topic}.', type: 'POV' },
  { text: "J'ai testé {topic} pendant 30 jours. Voilà le résultat.", type: 'Expérience' },
  { text: "Il te manque une seule habitude pour régler {topic}.", type: 'Promesse' },
  { text: 'Tout le monde se trompe sur {topic}. Voici le correctif.', type: 'À contre-courant' },
  { text: "Regarde ça avant de dépenser de l'argent dans {topic}.", type: 'Avertissement' },
  { text: 'La vérité qui dérange sur {topic}.', type: 'À contre-courant' },
  { text: '3 secondes pour expliquer {topic}. Prêt ?', type: 'Défi' },
];
const HOOK_TOPICS = ['ton budget', 'ta routine du matin', 'le meal prep', 'ta skincare', 'la location', 'le voyage en solo', 'les parties ranked', 'ta productivité', 'ta première pub', 'tes révisions', "l'épargne", 'le sport à la maison', 'la cuisson des pâtes', 'le maquillage', "la recherche d'appart", 'les vols pas chers', "l'entraînement d'aim", 'la slow life', 'les hooks', "l'apprentissage des langues"];

/* Hooks de vidéo : générés DANS la niche de la vidéo (un créateur
   musique IA ne doit jamais voir un hook « routine du matin »).
   Formulés pour accepter n'importe quel nom de niche tel quel. */
const VIDEO_HOOK_TEMPLATES = [
  { text: 'Personne ne montre cette astuce en {t}.', type: 'Curiosité' },
  { text: "L'erreur n°1 des débutants en {t}.", type: 'Diagnostic' },
  { text: "J'ai fait 30 jours de {t}, voilà le verdict.", type: 'Expérience' },
  { text: 'POV : tu te lances en {t}.', type: 'POV' },
  { text: 'Ce que personne ne te dit avant de te lancer en {t}.', type: 'Confession' },
  { text: '3 secondes pour comprendre pourquoi tu stagnes en {t}.', type: 'Défi' },
  { text: 'Le secret que les pros de {t} gardent pour eux.', type: 'Autorité' },
  { text: 'Regarde ça avant de dépenser un centime en {t}.', type: 'Avertissement' },
];

const HASHTAG_BASE = ['fyp', 'pourtoi', 'viral', 'apprendresurtiktok', 'tiktokacademie', 'astucescreateur', 'moneytok', 'fittok', 'foodtok', 'beautytok', 'immobilier', 'traveltok', 'gamingfr', 'lifestyle', 'marketingdigital', 'studytok', 'budget2026', 'gymtok', 'recetterapide', 'glowup', 'appartparis', 'cityguide', 'setupwars', 'morningroutine', 'growthhacking', 'periodedexam', 'epargne', 'homeworkout', 'batchcooking', 'skincareroutine', 'visiteappart', 'vanlife', 'esports', 'declutter', 'ugccreator', 'flashcards', 'investir', 'stretching', 'airfryer', 'maquillage', 'negociation', 'roadtrip', 'speedrun', 'slowliving', 'copywriting', 'memorisation', 'cryptofr', 'pilates', 'streetfood', 'cheveux'];

const WHY_CHIPS = ['Hook de curiosité', 'Montage rapide', 'CTA fort', 'Son tendance', 'Storytelling', 'Émotion', 'Relatable', 'Clivant', 'Éducatif', 'Authentique'];
const EMOTIONS = ['Curiosité', 'Surprise', 'Peur', 'Humour', 'Confiance', 'Luxe', 'Inspiration', 'Compétition', 'Urgence'];
export const CONTENT_TYPES = ['Storytelling', 'Tutoriel', 'UGC', 'Comédie', 'Éducatif', 'Lifestyle', 'Test produit', 'Réaction', 'Interview', 'Coulisses'];
export const TREND_STATUS = ['New', 'Growing', 'Peaking', 'Saturated'] as const;
const CTAS = ['Abonne-toi pour la partie 2', 'Raconte ta situation en commentaire', 'Enregistre pour plus tard', 'Envoie ça à un ami', 'Le guide complet est en bio', "Teste aujourd'hui et reviens me dire", 'Abonne-toi pour le prochain test', 'Fais un duo avec ta version'];

const AI_VIDEO_REASONS = [
  'Les trois premières secondes ouvrent une question que le spectateur doit résoudre.',
  "Un compte à rebours à l'écran maintient un taux de complétion inhabituellement haut.",
  "Une coupe toutes les 1,5 secondes retient l'attention jusqu'au milieu de la vidéo.",
  'Le créateur annonce une erreur puis la corrige — un arc de rétention éprouvé.',
  'Le texte incrusté contredit le visuel, ce qui force un second visionnage.',
  "Un chiffre concret dans la première phrase ancre la promesse immédiatement.",
  'La récompense est retenue jusqu’à la dernière seconde, ce qui génère des revisionnages.',
  'Un cadrage brut, non produit, paraît authentique et augmente la confiance.',
  'Une frustration partagée est nommée dès la première ligne : les commentaires se remplissent d’histoires.',
  'Le format invite au duo, ce qui multiplie la portée organique.',
];
const AI_VIDEO_CONTEXT = [
  'Il est encore assez tôt pour reproduire ce concept.',
  'Moins de 200 créateurs ont adapté ce format pour le moment.',
  "L'adoption accélère — les prochaines 48 heures comptent.",
  'Des vidéos similaires dans des niches voisines confirment le pattern.',
  'La concurrence est faible en dehors de la niche d’origine.',
  "Cette structure se transfère proprement à d'autres secteurs.",
];
const AI_CREATOR_REASONS = [
  'Croissance régulière portée par un storytelling solide.',
  'Publie chaque jour avec un format répétable que les spectateurs reconnaissent.',
  'Gagne sur les hooks — durée de visionnage bien au-dessus de la niche.',
  'A transformé un format viral en série durable.',
  'Sous-coté : fort taux d’engagement sur une petite audience.',
  'Adopte les sons montants environ deux jours avant les autres.',
  'Les commentaires montrent une communauté fidèle, pas des spectateurs passifs.',
  'Croissance portée par les enregistrements et partages, les signaux les plus forts.',
];
const AI_SOUND_NOTES = [
  'Surtout utilisé dans des vidéos Lifestyle et Finance.',
  'Fonctionne mieux sous une voix off storytelling.',
  'Adoption doublée dans les dernières 48 heures.',
  'Encore sous les 5 000 vidéos — fenêtre de tir ouverte.',
  'Se marie bien avec les révélations avant/après.',
  'Fort en Beauté, commence à percer en Cuisine.',
  'Les créateurs qui l’utilisent tôt dépassent leurs moyennes.',
  'Le drop à la 7e seconde est l’endroit où placer la révélation.',
];
const HOOK_EXPLANATIONS = [
  'Crée un manque d’information que le spectateur reste pour combler.',
  'Nomme d’abord une erreur — on regarde pour vérifier si c’est la sienne.',
  'Une interpellation directe qui stoppe le scroll en plein geste.',
  'Suggère un savoir d’initié, ce qui augmente la valeur perçue.',
  'Annonce la promesse d’entrée : le spectateur connaît la récompense.',
  'Utilise une controverse légère pour déclencher des réponses en commentaire.',
  'Le format confession crée une confiance immédiate.',
  'La précision donne l’impression d’un fait testé, pas vendu.',
];

const DIFF_REASONS: Record<Difficulty, string> = {
  Easy: 'Une prise, face caméra, aucune compétence de montage requise.',
  Medium: 'Des coupes simples et du texte incrusté, mais ni décor ni équipe.',
  Hard: 'Plusieurs lieux, du b-roll et un rythme de montage serré.',
};
const PROD_REASONS: Record<string, string> = {
  '15 min': 'Une seule prise plus les sous-titres — filme-la à ta prochaine pause.',
  '35 min': 'Une session de tournage et un montage simple dans CapCut.',
  '1 heure': 'Une courte liste de plans et une passe de montage.',
  '2 heures': "Planifie le b-roll d'abord ; le montage porte ce format.",
};
const SAT_REASONS: Record<Saturation, string> = {
  Low: 'Peu de créateurs l’ont adapté — le potentiel de découverte est élevé.',
  Medium: 'Adoption en hausse. Différencie-toi avec l’angle de ta niche.',
  High: 'Massivement copié. Seul un vrai twist personnel sortira du lot.',
};

/* ---------- générateurs ---------- */
function pick<T>(rnd: Rnd, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function int(rnd: Rnd, min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

function buildCreators(rnd: Rnd, country: string, n: number, niches: Niche[]): Creator[] {
  const used = new Set<string>();
  const out: Creator[] = [];
  for (let i = 0; i < n; i++) {
    const niche = niches[i % niches.length];
    let handle: string;
    do {
      handle = '@' + pick(rnd, FIRST) + '.' + pick(rnd, SUFFIX);
    } while (used.has(handle));
    used.add(handle);
    const followers = int(rnd, 8, 900) * 1000;
    out.push({
      id: 'c' + i,
      handle,
      niche: niche.name,
      hue: (niche.hue + int(rnd, -14, 14) + 360) % 360,
      country,
      followers,
      growth: int(rnd, 4, 120) / 10,
      avgViews: Math.round(followers * (0.4 + rnd() * 2.2)),
      engagement: (2 + rnd() * 9).toFixed(1),
      reason: pick(rnd, AI_CREATOR_REASONS),
      initials: handle.slice(1, 3).toUpperCase(),
    });
  }
  return out.sort((a, b) => b.growth - a.growth);
}

function buildSounds(rnd: Rnd, n: number): Sound[] {
  const out: Sound[] = [];
  for (let i = 0; i < n; i++) {
    const name = SOUND_NAMES[i % SOUND_NAMES.length] + (i >= SOUND_NAMES.length ? ' II' : '');
    const videos = int(rnd, 300, 48000);
    out.push({
      id: 's' + i,
      name,
      artist: pick(rnd, ARTISTS),
      hue: int(rnd, 0, 359),
      videos,
      growth: int(rnd, 15, 640),
      rising: videos < 6000,
      note: pick(rnd, AI_SOUND_NOTES),
      duration: int(rnd, 8, 32),
    });
  }
  return out.sort((a, b) => b.growth - a.growth);
}

function buildHooks(rnd: Rnd, n: number, allNiches: Niche[]): Hook[] {
  const out: Hook[] = [];
  for (let i = 0; i < n; i++) {
    const t = HOOK_TEMPLATES[i % HOOK_TEMPLATES.length];
    const topic = HOOK_TOPICS[(i * 7 + int(rnd, 0, 3)) % HOOK_TOPICS.length];
    const niches = [pick(rnd, allNiches).name, pick(rnd, allNiches).name].filter((v, ix, a) => a.indexOf(v) === ix);
    out.push({
      id: 'h' + i,
      text: t.text.replace('{topic}', topic),
      type: t.type,
      performance: int(rnd, 62, 97),
      industries: niches,
      avgDuration: int(rnd, 12, 34),
      explanation: pick(rnd, HOOK_EXPLANATIONS),
    });
  }
  return out.sort((a, b) => b.performance - a.performance);
}

function buildHashtags(rnd: Rnd, n: number, allNiches: Niche[], customs: string[]): Hashtag[] {
  const out: Hashtag[] = [];
  for (let i = 0; i < n; i++) {
    const tag = HASHTAG_BASE[i % HASHTAG_BASE.length] + (i >= HASHTAG_BASE.length ? String(i % 9) : '');
    out.push({
      id: 't' + i,
      tag: '#' + tag,
      growth: int(rnd, -20, 420),
      videos: int(rnd, 2, 480) * 1000,
      niche: pick(rnd, allNiches).name,
    });
  }
  // Un hashtag dédié par niche personnalisée, pour que « sa » niche
  // apparaisse aussi dans la distribution.
  customs.forEach((name, i) => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    if (!slug) return;
    out.push({
      id: 'tc' + i,
      tag: '#' + slug,
      growth: int(rnd, 30, 420),
      videos: int(rnd, 2, 220) * 1000,
      niche: name,
    });
  });
  return out.sort((a, b) => b.growth - a.growth);
}

function buildVideos(rnd: Rnd, country: string, creators: Creator[], sounds: Sound[], n: number, niches: Niche[]): Video[] {
  const out: Video[] = [];
  for (let i = 0; i < n; i++) {
    const niche = niches[(i + int(rnd, 0, 2)) % niches.length];
    const nicheCreators = creators.filter((c) => c.niche === niche.name);
    const creator = nicheCreators.length ? pick(rnd, nicheCreators) : pick(rnd, creators);
    const sound = pick(rnd, sounds);
    // Hook cohérent : toujours dans la niche de la vidéo.
    const hookTemplate = pick(rnd, VIDEO_HOOK_TEMPLATES);
    const nicheLower = niche.name.charAt(0).toLowerCase() + niche.name.slice(1);
    const hook: Hook = {
      id: 'vh' + i,
      text: hookTemplate.text.replace('{t}', nicheLower),
      type: hookTemplate.type,
      performance: int(rnd, 70, 97),
      industries: [niche.name],
      avgDuration: int(rnd, 12, 34),
      explanation: pick(rnd, HOOK_EXPLANATIONS),
    };
    const views = int(rnd, 40, 8200) * 1000;
    const growth = int(rnd, 40, 1900);
    const duration = int(rnd, 9, 58);
    const status: TrendStatus = growth > 900 ? 'Peaking' : growth > 400 ? 'Growing' : growth > 150 ? 'New' : 'Saturated';
    const diff: Difficulty = duration < 20 ? 'Easy' : duration < 38 ? 'Medium' : 'Hard';
    const prod = diff === 'Easy' ? pick(rnd, ['15 min', '35 min']) : diff === 'Medium' ? pick(rnd, ['35 min', '1 heure']) : '2 heures';
    const sat: Saturation = status === 'Saturated' ? 'High' : status === 'Peaking' ? 'Medium' : 'Low';
    const chips = [...WHY_CHIPS].sort(() => rnd() - 0.5).slice(0, 3);
    const emotions = [...EMOTIONS].sort(() => rnd() - 0.5).slice(0, 2);
    out.push({
      id: 'v' + i,
      title: pick(rnd, niche.topics),
      niche: niche.name,
      hue: (niche.hue + int(rnd, -18, 18) + 360) % 360,
      angle: int(rnd, 100, 260),
      country,
      creator,
      sound,
      hook,
      contentType: pick(rnd, CONTENT_TYPES),
      duration,
      views,
      likes: Math.round(views * (0.05 + rnd() * 0.12)),
      comments: Math.round(views * (0.002 + rnd() * 0.012)),
      shares: Math.round(views * (0.004 + rnd() * 0.02)),
      growth,
      viralScore: Math.min(99, Math.round(52 + growth / 28 + rnd() * 14)),
      opportunity: Math.min(98, Math.round(45 + (sat === 'Low' ? 26 : sat === 'Medium' ? 12 : 0) + rnd() * 22)),
      status,
      difficulty: diff,
      diffReason: DIFF_REASONS[diff],
      prodTime: prod,
      prodReason: PROD_REASONS[prod],
      budget: pick(rnd, ['Gratuit', 'Gratuit', 'Faible', 'Faible', 'Moyen', 'Élevé']),
      saturation: sat,
      satReason: SAT_REASONS[sat],
      chips,
      emotions,
      cta: pick(rnd, CTAS),
      uploadedH: int(rnd, 1, 46),
      summary: pick(rnd, AI_VIDEO_REASONS),
      context: pick(rnd, AI_VIDEO_CONTEXT),
    });
  }
  return out.sort((a, b) => b.growth - a.growth);
}

/* ---------- dataset (mémoïsé par état) ---------- */
const cache = new Map<string, Dataset>();

export function dataset(countryName: string, timeframe: string, extraNiches: string[] = []): Dataset {
  const customs = [...new Set(extraNiches.filter((n) => n && !isBuiltInNiche(n)))].sort();
  const key = countryName + '|' + timeframe + '|' + customs.join('~');
  const hit = cache.get(key);
  if (hit) return hit;
  const allNiches = [...NICHES, ...customs.map(customNiche)];
  const rnd = mulberry32(hashStr(key));
  const creators = buildCreators(rnd, countryName, 80 + customs.length * 6, allNiches);
  const sounds = buildSounds(rnd, 60);
  const hooks = buildHooks(rnd, 100, allNiches);
  const hashtags = buildHashtags(rnd, 80, allNiches, customs);
  const videos = buildVideos(rnd, countryName, creators, sounds, 120 + customs.length * 10, allNiches);
  const ds: Dataset = { creators, sounds, hooks, hashtags, videos };
  cache.set(key, ds);
  return ds;
}

/* ---------- vidéos réelles (provider TikTok) ----------
   Le provider ne fournit que les faits bruts (titre, stats, cover, lien) ;
   tout l'enrichissement éditorial (hook dans la niche, plan de prod,
   explications) est dérivé ici, de façon déterministe par vidéo. */
/* Hooks génériques pour les vidéos tendance globales (sans niche). */
const GENERIC_VIDEO_HOOKS = [
  { text: 'Regarde jusqu’à la fin, tu vas comprendre.', type: 'Curiosité' },
  { text: 'Personne ne s’attendait à cette fin.', type: 'Surprise' },
  { text: 'POV : tu tombes sur LA vidéo du jour.', type: 'POV' },
  { text: 'Tout le monde refait ce format en ce moment.', type: 'Tendance' },
  { text: 'Ce détail change tout — regarde bien.', type: 'Défi' },
];

export interface RealVideoInput {
  id: string;
  title: string;
  niche: string;
  country: string;
  /* vrai pour les tendances globales : hook générique (pas de niche) */
  generic?: boolean;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  createTime?: number;
  creatorHandle: string;
  creatorFollowers: number;
  soundName: string;
  soundArtist: string;
  cover: string;
  url: string;
}

export function realVideo(input: RealVideoInput): Video {
  const rnd = mulberry32(hashStr('real|' + input.id));
  const engagement = input.views > 0 ? (input.likes + input.comments * 3 + input.shares * 5) / input.views : 0;
  const growth = Math.max(25, Math.min(1900, Math.round(engagement * 6000)));
  const duration = Math.max(5, Math.min(180, Math.round(input.duration)));
  const status: TrendStatus = growth > 900 ? 'Peaking' : growth > 400 ? 'Growing' : growth > 150 ? 'New' : 'Saturated';
  const diff: Difficulty = duration < 20 ? 'Easy' : duration < 38 ? 'Medium' : 'Hard';
  const prod = diff === 'Easy' ? pick(rnd, ['15 min', '35 min']) : diff === 'Medium' ? pick(rnd, ['35 min', '1 heure']) : '2 heures';
  const sat: Saturation = status === 'Saturated' ? 'High' : status === 'Peaking' ? 'Medium' : 'Low';
  const hookTemplate = input.generic ? pick(rnd, GENERIC_VIDEO_HOOKS) : pick(rnd, VIDEO_HOOK_TEMPLATES);
  const nicheLower = input.niche.charAt(0).toLowerCase() + input.niche.slice(1);
  const hoursAgo = input.createTime
    ? Math.max(1, Math.round((Date.now() / 1000 - input.createTime) / 3600))
    : int(rnd, 2, 46);
  const handle = input.creatorHandle.startsWith('@') ? input.creatorHandle : '@' + input.creatorHandle;
  return {
    id: 'r' + input.id,
    cover: input.cover,
    url: input.url,
    real: true,
    title: input.title,
    niche: input.niche,
    hue: hashStr(input.niche) % 360,
    angle: int(rnd, 100, 260),
    country: input.country,
    creator: {
      id: 'rc' + input.id,
      handle,
      niche: input.niche,
      hue: hashStr(handle) % 360,
      country: input.country,
      followers: input.creatorFollowers,
      growth: int(rnd, 4, 120) / 10,
      avgViews: input.views,
      engagement: Math.min(15, engagement * 100).toFixed(1),
      reason: pick(rnd, AI_CREATOR_REASONS),
      initials: handle.slice(1, 3).toUpperCase(),
    },
    sound: {
      id: 'rs' + input.id,
      name: input.soundName || 'Son original',
      artist: input.soundArtist || handle,
      hue: hashStr(input.soundName) % 360,
      videos: int(rnd, 300, 48000),
      growth: int(rnd, 15, 640),
      rising: rnd() > 0.5,
      note: pick(rnd, AI_SOUND_NOTES),
      duration: Math.min(60, duration),
    },
    hook: {
      id: 'rh' + input.id,
      text: input.generic ? hookTemplate.text : hookTemplate.text.replace('{t}', nicheLower),
      type: hookTemplate.type,
      performance: int(rnd, 70, 97),
      industries: [input.niche],
      avgDuration: duration,
      explanation: pick(rnd, HOOK_EXPLANATIONS),
    },
    contentType: pick(rnd, CONTENT_TYPES),
    duration,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    growth,
    viralScore: Math.min(99, Math.round(52 + growth / 28 + rnd() * 14)),
    opportunity: Math.min(98, Math.round(45 + (sat === 'Low' ? 26 : sat === 'Medium' ? 12 : 0) + rnd() * 22)),
    status,
    difficulty: diff,
    diffReason: DIFF_REASONS[diff],
    prodTime: prod,
    prodReason: PROD_REASONS[prod],
    budget: pick(rnd, ['Gratuit', 'Gratuit', 'Faible', 'Moyen']),
    saturation: sat,
    satReason: SAT_REASONS[sat],
    chips: [...WHY_CHIPS].sort(() => rnd() - 0.5).slice(0, 3),
    emotions: [...EMOTIONS].sort(() => rnd() - 0.5).slice(0, 2),
    cta: pick(rnd, CTAS),
    uploadedH: hoursAgo,
    summary: pick(rnd, AI_VIDEO_REASONS),
    context: pick(rnd, AI_VIDEO_CONTEXT),
  };
}

/* ---------- validation des paramètres d'URL ---------- */
export function resolveCountry(raw: string | undefined): string {
  return COUNTRIES.some((c) => c.name === raw) ? (raw as string) : 'France';
}
export function resolveTimeframe(raw: string | undefined): Timeframe {
  return (TIMEFRAMES as readonly string[]).includes(raw ?? '') ? (raw as Timeframe) : "Aujourd'hui";
}
export function resolveNiche(raw: string | undefined): string {
  return NICHES.some((n) => n.name === raw) ? (raw as string) : '';
}

/* ---------- formateurs ---------- */
export function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.0', '').replace('.', ',') + ' M';
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace('.0', '').replace('.', ',') + ' k';
  return String(n);
}
export function dur(s: number): string {
  return '0:' + String(s).padStart(2, '0');
}
export function ago(h: number): string {
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
}
