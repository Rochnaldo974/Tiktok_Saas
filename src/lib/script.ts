import type { Video } from '@/lib/data';
import { hashStr } from '@/lib/data';

/* Générateur de script déterministe : transforme une vidéo tendance
   en plan de tournage prêt à filmer (hook → corps → révélation → CTA),
   minuté sur la durée du format. Sera remplacé par l'API Claude (P3)
   sans changer l'UI du panneau. */

export interface ScriptSection {
  label: string;
  time: string;
  text: string;
}

const SETUPS: Record<string, string> = {
  Storytelling: "Plante le décor en une phrase : où tu étais, ce que tu croyais, et ce qui a changé. Parle comme à un ami, pas comme à une caméra.",
  Tutoriel: "Annonce le résultat final d'abord (montre-le à l'écran), puis « voilà comment faire en 3 étapes ». Le spectateur doit voir la destination avant la route.",
  UGC: "Filme en selfie, lumière naturelle, sans montage apparent. Commence au milieu de l'action, comme si la caméra tournait déjà.",
  Comédie: "Pose la situation banale que tout le monde connaît... avant de la faire dérailler. Le contraste fait le rire.",
  Éducatif: "Donne le chiffre ou le fait qui surprend, puis promets l'explication : « et voilà pourquoi ça change tout pour toi ».",
  Lifestyle: "Enchaîne 3 plans courts de ton quotidien réel (pas idéalisé) avec le texte en incrustation qui raconte.",
  'Test produit': "Montre le produit et annonce ton verdict en une phrase AVANT le test. On reste pour vérifier si tu as raison.",
  Réaction: "Montre le contenu original 2 secondes, fige l'image sur le moment clé, et lance ta réaction à chaud.",
  Interview: "Ouvre sur la réponse la plus forte de l'interview, puis remonte au contexte : qui parle, et pourquoi ça compte.",
  Coulisses: "Montre le résultat fini 2 secondes, puis « voilà ce que personne ne voit » — et bascule derrière la caméra.",
};

const DEVELOPMENTS = [
  "Déroule ton point en 2 ou 3 temps maximum, une idée par plan. Coupe chaque plan sous les 2 secondes — le rythme EST la rétention.",
  "Montre, ne raconte pas : chaque affirmation doit avoir son image. Texte en incrustation sur les mots clés uniquement.",
  "Garde le meilleur argument pour la fin du développement — c'est lui qui déclenche le rewatch.",
  "Nomme l'erreur que fait ton audience, puis corrige-la à l'écran. On regarde pour vérifier si c'est nous.",
];

const PAYOFFS = [
  "Livre la révélation promise par ton hook — pas avant. Si tu l'as donnée trop tôt, réécris le hook.",
  "Résume en une phrase mémorisable, formulée comme une règle : « Retiens ça : ... ».",
  "Montre le avant/après côte à côte. Le contraste visuel vaut tous les arguments.",
];

function pickFrom<T>(arr: readonly T[], seed: number): T {
  return arr[(seed >>> 0) % arr.length];
}

export function buildScript(v: Video): ScriptSection[] {
  const seed = hashStr(v.id + v.title);
  const hookEnd = 3;
  const devEnd = Math.max(hookEnd + 4, Math.round(v.duration * 0.75));
  return [
    {
      label: 'Hook',
      time: `0–${hookEnd} s`,
      text: `« ${v.hook.text} » — face caméra, sans intro, sans logo. ${v.hook.explanation}`,
    },
    {
      label: 'Mise en place',
      time: `${hookEnd}–${Math.round(v.duration * 0.35)} s`,
      text: SETUPS[v.contentType] ?? SETUPS['Storytelling'],
    },
    {
      label: 'Développement',
      time: `${Math.round(v.duration * 0.35)}–${devEnd} s`,
      text: pickFrom(DEVELOPMENTS, seed),
    },
    {
      label: 'Révélation',
      time: `${devEnd}–${v.duration - 2} s`,
      text: pickFrom(PAYOFFS, seed >>> 3),
    },
    {
      label: 'CTA',
      time: `${v.duration - 2}–${v.duration} s`,
      text: `« ${v.cta} » — dis-le en regardant l'objectif, texte identique en incrustation. Un seul CTA, jamais deux.`,
    },
  ];
}

export function scriptToText(v: Video, sections: ScriptSection[]): string {
  return [
    `${v.title} — script Signal (${v.duration} s, son : « ${v.sound.name} »)`,
    '',
    ...sections.map((s) => `[${s.label} · ${s.time}]\n${s.text}`),
  ].join('\n\n');
}
