'use client';

import Link from 'next/link';
import { hashStr } from '@/lib/data';
import { GOAL_LABELS } from '@/lib/content/types';
import { useHydrated, useProfile } from '@/lib/content/use-store';
import { Ring } from '@/components/cards/ring';
import { Radar, ArrowRight } from '@/components/icons';

/* Diagnostic personnel : alimenté par le dernier audit TikTok réel
   (page /analyse) quand il existe, sinon par un conseil déterministe
   dérivé de la niche + l'objectif. Plus jamais une page obligatoire. */

const ADVICE_BY_GOAL: Record<string, { strength: string; priority: string }> = {
  grow_audience: {
    strength: 'rendre un sujet de niche accessible au grand public',
    priority: 'ouvrir chaque vidéo sur la promesse, pas sur le contexte',
  },
  get_leads: {
    strength: 'prouver votre expertise par des cas concrets',
    priority: 'terminer chaque vidéo par un CTA visible à l’écran',
  },
  sell_product: {
    strength: 'montrer le produit en usage réel plutôt qu’en argumentaire',
    priority: 'placer le résultat avant l’explication dans les 2 premières secondes',
  },
  build_authority: {
    strength: 'structurer des idées complexes en formats courts',
    priority: 'utiliser des hooks chiffrés qui ancrent la promesse',
  },
  find_clients: {
    strength: 'montrer les coulisses de votre travail',
    priority: 'nommer explicitement pour qui vous travaillez dans le hook',
  },
  boost_engagement: {
    strength: 'déclencher des réactions par des angles légèrement clivants',
    priority: 'poser une vraie question en CTA, pas un « abonne-toi » générique',
  },
};

export function DiagnosticCard({
  profileScore,
  profileHandle,
}: {
  profileScore: number | null;
  profileHandle: string | null;
}) {
  const hydrated = useHydrated();
  const profile = useProfile();

  /* Audit réel disponible → le score et le lien vers l'audit complet. */
  if (profileScore !== null) {
    return (
      <div className="card rail-card reveal">
        <h4><span className="pulse" /> Votre angle de progression</h4>
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
          Revoir mon audit complet <ArrowRight />
        </Link>
      </div>
    );
  }

  if (!hydrated) {
    return <div className="skeleton" style={{ height: 170, borderRadius: 'var(--r-lg)' }} />;
  }

  const goal = profile?.primaryGoal ?? 'grow_audience';
  const advice = ADVICE_BY_GOAL[goal];
  const niche = profile?.primaryNiche || 'votre niche';
  /* variation déterministe légère selon la niche */
  const flip = profile ? hashStr(profile.primaryNiche) % 2 === 0 : false;

  return (
    <div className="card rail-card reveal">
      <h4><span className="pulse" /> Votre angle de progression</h4>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)' }}>
        <strong>Votre force potentielle :</strong>{' '}
        {flip ? `rendre ${niche.toLowerCase()} simple et concret` : advice.strength}.
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--muted)', marginTop: 8 }}>
        <strong>Votre priorité :</strong> {advice.priority} — c&apos;est le levier n°1 pour «{' '}
        {GOAL_LABELS[goal].toLowerCase()} ».
      </p>
      <Link className="btn btn-primary btn-sm" style={{ marginTop: 14, width: '100%' }} href="/opportunites?mode=easy">
        Appliquer ce conseil à mon prochain contenu
      </Link>
      <Link className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%' }} href="/analyse">
        <Radar /> Affiner avec mon @ TikTok
      </Link>
    </div>
  );
}
