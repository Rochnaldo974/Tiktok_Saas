import type { Video } from '@/lib/data';
import { hashStr, mulberry32 } from '@/lib/data';
import type {
  ContentStyle,
  FilmingCheckItem,
  GeneratedContent,
  PrimaryGoal,
  Scene,
} from './types';
import { GOAL_LABELS } from './types';

/* Générateur de contenu local, déterministe et instantané : reprend la
   MÉCANIQUE d'une tendance (structure, rythme, type de hook), jamais le
   contenu d'un autre créateur. C'est la version « pour tous » ; le
   bouton « Rédiger avec l'IA » (API Claude, connecté) reste le bonus. */

export interface AdaptationInput {
  subject: string;
  objective: PrimaryGoal;
  style: ContentStyle;
}

export type GeneratedDraft = Omit<
  GeneratedContent,
  | 'id'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'scheduledBucket'
  | 'scheduledDate'
  | 'videoMetadata'
  | 'videoReview'
  | 'publishedAt'
  | 'publishedUrl'
  | 'performanceMetrics'
  | 'performanceInsights'
  | 'filmingChecklist'
>;

/* ---------- tables éditoriales par style ---------- */

interface StyleVoice {
  hook: (subject: string) => string;
  setupSpoken: (subject: string) => string;
  setupVisual: string;
  devSpoken: (subject: string) => string;
  payoffSpoken: (subject: string) => string;
  concept: (subject: string) => string;
}

const VOICES: Record<ContentStyle, StyleVoice> = {
  direct: {
    hook: (s) => `Voilà exactement quoi faire pour ${s}, en 20 secondes.`,
    setupSpoken: (s) => `Pas d'intro : le problème avec ${s}, c'est qu'on complique tout. Il n'y a que trois choses qui comptent.`,
    setupVisual: 'Face caméra, cadrage buste, fond neutre, regard objectif.',
    devSpoken: () => 'Un. [votre premier point]. Deux. [votre deuxième point]. Trois. [le point que personne ne fait].',
    payoffSpoken: () => 'Si vous ne retenez qu’une chose : [votre règle en une phrase].',
    concept: (s) => `Une vidéo directe qui donne la méthode complète sur ${s}, sans détour.`,
  },
  pedagogique: {
    hook: (s) =>
      /erreur|faute|piège/i.test(s)
        ? `Personne ne vous prévient : ${s}. Voilà comment les éviter.`
        : `L'erreur n°1 que tout le monde fait avec ${s} — et comment la corriger.`,
    setupSpoken: (s) => `Quand on débute avec ${s}, on fait presque tous la même erreur. Je vous montre laquelle, puis la correction.`,
    setupVisual: 'Montrez le résultat final 2 secondes AVANT l’explication, puis revenez face caméra.',
    devSpoken: () => 'Voici l’erreur en images : [démonstration]. Et maintenant la bonne méthode, étape par étape : [étapes].',
    payoffSpoken: () => 'La différence avant/après, côte à côte. C’est ce contraste qui fait comprendre.',
    concept: (s) => `Un format éducatif erreur → correction sur ${s}, avec démonstration à l'écran.`,
  },
  storytelling: {
    hook: (s) => `Il y a 6 mois, j'ai tout raté avec ${s}. Aujourd'hui, voilà ce qui a changé.`,
    setupSpoken: (s) => `Plantez le décor en une phrase : où vous étiez, ce que vous croyiez sur ${s}, et le moment où ça a basculé.`,
    setupVisual: 'Commencez au milieu de l’action, comme si la caméra tournait déjà. B-roll de contexte.',
    devSpoken: () => 'Racontez la tentative, l’obstacle, puis le déclic — une idée par plan, coupes rapides.',
    payoffSpoken: () => 'Livrez la leçon promise par le hook — pas avant. C’est elle qu’on attend.',
    concept: (s) => `Un récit personnel avant/après sur ${s}, construit sur un arc de tension.`,
  },
  authentique: {
    hook: (s) => `Personne ne montre la vraie réalité de ${s}. Alors je le fais.`,
    setupSpoken: (s) => `Sans filtre : voilà ce que ${s} donne vraiment au quotidien, y compris ce qui ne marche pas.`,
    setupVisual: 'Selfie, lumière naturelle, sans montage apparent. L’imperfection crédibilise.',
    devSpoken: () => 'Montrez le vrai processus, les ratés inclus. Nommez ce que les autres cachent.',
    payoffSpoken: () => 'Terminez par ce que vous referiez différemment — le conseil qu’on ne vous a jamais donné.',
    concept: (s) => `Un format transparent qui montre la réalité de ${s} sans mise en scène.`,
  },
  humoristique: {
    hook: (s) => `POV : c'est ta première fois avec ${s}.`,
    setupSpoken: (s) => `Posez la situation banale que tout le monde connaît avec ${s}... avant de la faire dérailler.`,
    setupVisual: 'Jouez les deux rôles ou utilisez l’incrustation texte pour le dialogue intérieur.',
    devSpoken: () => 'Enchaînez 2-3 situations reconnaissables, chacune un cran plus absurde. Le contraste fait le rire.',
    payoffSpoken: () => 'La chute : la situation la plus vraie de toutes — celle qu’on partage à un ami.',
    concept: (s) => `Une comédie relatable sur les situations que tout le monde vit avec ${s}.`,
  },
  premium: {
    hook: (s) => `Ce que les meilleurs font différemment avec ${s} — en 3 détails.`,
    setupSpoken: (s) => `Il y a un écart entre faire ${s} et le faire avec exigence. Trois détails font la différence.`,
    setupVisual: 'Plans posés, cadrages soignés, rythme plus lent que la moyenne — l’esthétique EST le message.',
    devSpoken: () => 'Détail un : [précision]. Détail deux : [précision]. Détail trois : [celui qui coûte le moins et rapporte le plus].',
    payoffSpoken: () => 'Fermez sur le résultat final, silencieux, 2 secondes. Laissez l’image conclure.',
    concept: (s) => `Un format soigné qui positionne votre expertise sur ${s} par le détail.`,
  },
};

const ON_SCREEN_BY_STAGE = [
  '', // hook : le texte prononcé EST le texte à l'écran
  'Contexte en 3-4 mots max',
  'Mots-clés du point en cours, jamais des phrases',
  'La règle à retenir, en une ligne',
  '',
];

const CTA_BY_GOAL: Record<PrimaryGoal, string> = {
  grow_audience: 'Abonne-toi, la partie 2 arrive demain.',
  get_leads: 'Le guide complet est en lien dans ma bio.',
  sell_product: 'Le lien est en bio si tu veux tester par toi-même.',
  build_authority: 'Enregistre cette vidéo, tu en auras besoin.',
  find_clients: 'Écris « info » en commentaire, je t’explique comment on travaille ensemble.',
  boost_engagement: 'Raconte ta pire expérience en commentaire.',
};

const TIPS_POOL = [
  'Montrez le résultat dès la première scène.',
  'Changez de cadrage après cinq secondes.',
  'Gardez les sous-titres courts — trois mots par ligne.',
  'Coupez chaque silence : le rythme est la rétention.',
  'Prononcez le hook AVANT que le logo ou le décor n’apparaisse.',
  'Enregistrez la voix off séparément si le lieu est bruyant.',
];

const SLOTS = ['18 h – 20 h', '12 h – 13 h', '19 h – 21 h', '7 h 30 – 9 h'];

const EQUIPMENT: Record<'Easy' | 'Medium' | 'Hard', string> = {
  Easy: 'Un smartphone et la lumière d’une fenêtre suffisent.',
  Medium: 'Smartphone, trépied et micro-cravate conseillés.',
  Hard: 'Trépied, micro, deuxième source de lumière et plan de tournage.',
};

/* ---------- helpers ---------- */

function timeRanges(duration: number): [string, string, string, string, string] {
  const hookEnd = 3;
  const setupEnd = Math.max(hookEnd + 3, Math.round(duration * 0.35));
  const devEnd = Math.max(setupEnd + 4, Math.round(duration * 0.75));
  const payoffEnd = Math.max(devEnd + 1, duration - 2);
  return [
    `0–${hookEnd} s`,
    `${hookEnd}–${setupEnd} s`,
    `${setupEnd}–${devEnd} s`,
    `${devEnd}–${payoffEnd} s`,
    `${payoffEnd}–${duration} s`,
  ];
}

function shortWords(text: string, max = 5): string {
  return text
    .replace(/[«»""]/g, '')
    .split(' ')
    .slice(0, max)
    .join(' ');
}

function hashtagsFor(niche: string, subject: string): string[] {
  const nicheTag = niche.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const subjectTag = subject
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, '')
    .split(' ')
    .filter((w) => w.length > 3)
    .slice(0, 2)
    .join('');
  return ['#' + nicheTag, subjectTag ? '#' + subjectTag : '#astuce', '#pourtoi'].filter(
    (t, i, a) => t.length > 1 && a.indexOf(t) === i,
  );
}

/* ---------- API ---------- */

export function generateContent(v: Video, input: AdaptationInput): GeneratedDraft {
  const seed = hashStr(v.id + '|' + input.subject + '|' + input.style);
  const rnd = mulberry32(seed);
  const voice = VOICES[input.style];
  const subject = input.subject.trim() || v.niche.toLowerCase();
  const duration = Math.max(15, Math.min(45, v.duration));
  const ranges = timeRanges(duration);
  const hook = voice.hook(subject);
  const cta = CTA_BY_GOAL[input.objective];

  const scenes: Scene[] = [
    {
      index: 1,
      timeRange: ranges[0],
      visual: 'Face caméra, plan serré, sans intro ni logo. La première image doit déjà montrer le sujet.',
      spoken: hook,
      onScreen: shortWords(hook),
    },
    {
      index: 2,
      timeRange: ranges[1],
      visual: voice.setupVisual,
      spoken: voice.setupSpoken(subject),
      onScreen: ON_SCREEN_BY_STAGE[1],
    },
    {
      index: 3,
      timeRange: ranges[2],
      visual: 'Une idée par plan, coupes sous 2 secondes. Chaque affirmation a son image.',
      spoken: voice.devSpoken(subject),
      onScreen: ON_SCREEN_BY_STAGE[2],
    },
    {
      index: 4,
      timeRange: ranges[3],
      visual: 'Le plan le plus fort de la vidéo : résultat, contraste avant/après ou chute.',
      spoken: voice.payoffSpoken(subject),
      onScreen: ON_SCREEN_BY_STAGE[3],
    },
    {
      index: 5,
      timeRange: ranges[4],
      visual: 'Regard objectif, CTA identique en incrustation pendant les 2 dernières secondes.',
      spoken: cta,
      onScreen: shortWords(cta),
    },
  ];

  const tipStart = Math.floor(rnd() * TIPS_POOL.length);
  const tips = [0, 1, 2].map((i) => TIPS_POOL[(tipStart + i * 2) % TIPS_POOL.length]);

  return {
    sourceOpportunityId: v.id,
    sourceTitle: v.title,
    title: voice.concept(subject).replace(/\.$/, ''),
    concept: voice.concept(subject),
    niche: v.niche,
    objective: input.objective,
    style: input.style,
    hook,
    scenes,
    cta,
    duration,
    difficulty: v.difficulty,
    productionTime: v.prodTime,
    equipment: EQUIPMENT[v.difficulty],
    sound: v.sound.name,
    suggestedTime: SLOTS[seed % SLOTS.length],
    hashtags: hashtagsFor(v.niche, subject),
    tips,
  };
}

export function defaultFilmingChecklist(): FilmingCheckItem[] {
  return [
    { id: 'decor', label: 'Préparer le décor', done: false },
    { id: 'lumiere', label: 'Vérifier la lumière', done: false },
    { id: 'script', label: 'Ouvrir le script', done: false },
    { id: 'son', label: 'Tester le son / micro', done: false },
    { id: 'subs', label: 'Préparer les sous-titres', done: false },
  ];
}

/* Variantes de hook — transformations déterministes par templates. */
export function hookVariant(
  hook: string,
  mode: 'variant' | 'more_direct' | 'more_intriguing',
  step: number,
): string {
  const core = hook.replace(/[.!?…]+$/, '');
  if (mode === 'more_direct') {
    const options = [
      `${core}. Sans blabla.`,
      `Regarde ça avant de faire quoi que ce soit d'autre : ${core.charAt(0).toLowerCase()}${core.slice(1)}.`,
      `${core} — en 15 secondes chrono.`,
    ];
    return options[step % options.length];
  }
  if (mode === 'more_intriguing') {
    const options = [
      `Personne ne t'a dit ça : ${core.charAt(0).toLowerCase()}${core.slice(1)}.`,
      `${core}… et la fin va te surprendre.`,
      `J'ai hésité à partager ça. ${core}.`,
    ];
    return options[step % options.length];
  }
  const options = [
    `Attends de voir la fin : ${core.charAt(0).toLowerCase()}${core.slice(1)}.`,
    `${core} — voilà la preuve.`,
    `Si tu scrolles, tu vas le regretter : ${core.charAt(0).toLowerCase()}${core.slice(1)}.`,
  ];
  return options[step % options.length];
}

/* Réécritures simples du contenu — locales et honnêtes. */
export type RewritableContent = Pick<GeneratedContent, 'scenes' | 'hook' | 'concept' | 'duration'>;

export function rewriteContent(
  c: RewritableContent,
  mode: 'simplify' | 'shorten' | 'other_angle',
): RewritableContent {
  if (mode === 'shorten') {
    const duration = Math.max(12, Math.round(c.duration * 0.7));
    const ranges = timeRanges(duration);
    const kept = [c.scenes[0], c.scenes[1], c.scenes[3] ?? c.scenes[2], c.scenes[c.scenes.length - 1]]
      .filter(Boolean)
      .map((s, i) => ({ ...s, index: i + 1, timeRange: ranges[i === 3 ? 4 : i] }));
    return { scenes: kept, hook: c.hook, concept: c.concept, duration };
  }
  if (mode === 'simplify') {
    const scenes = c.scenes.map((s) => ({
      ...s,
      visual: s.index === 1 ? s.visual : 'Un seul plan fixe, face caméra. Zéro montage complexe.',
      onScreen: s.onScreen ? shortWords(s.onScreen, 3) : s.onScreen,
    }));
    return { scenes, hook: c.hook, concept: c.concept + ' Version simplifiée, une seule prise.', duration: c.duration };
  }
  /* other_angle : bascule le hook en question + inverse la promesse */
  const core = c.hook.replace(/[.!?…]+$/, '');
  const hook = `Et si tout le monde se trompait ? ${core.charAt(0).toLowerCase()}${core.slice(1)} — version contre-pied.`;
  const scenes = c.scenes.map((s) =>
    s.index === 1 ? { ...s, spoken: hook, onScreen: shortWords(hook) } : s,
  );
  return { scenes, hook, concept: c.concept + ' Angle contre-intuitif.', duration: c.duration };
}

/* Sérialisation copiable du script complet. */
export type CopyableContent = Pick<
  GeneratedContent,
  'title' | 'concept' | 'objective' | 'duration' | 'sound' | 'scenes' | 'cta' | 'suggestedTime' | 'hashtags'
>;

export function contentToText(c: CopyableContent): string {
  return [
    `${c.title}`,
    `Concept : ${c.concept}`,
    `Objectif : ${GOAL_LABELS[c.objective]} · ${c.duration} s · son : « ${c.sound} »`,
    '',
    ...c.scenes.map((s) =>
      [
        `Scène ${s.index} — ${s.timeRange}`,
        `Visuel : ${s.visual}`,
        `Texte prononcé : ${s.spoken}`,
        s.onScreen ? `Texte à l'écran : ${s.onScreen}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    '',
    `CTA : ${c.cta}`,
    `Créneau suggéré : ${c.suggestedTime}`,
    `Hashtags : ${c.hashtags.join(' ')}`,
  ].join('\n\n');
}
