'use client';

import Link from 'next/link';
import { dataset, fmt, NICHES, type Dataset } from '@/lib/data';
import { Check, ArrowRight } from '@/components/icons';

/* Moteur de réponses de DÉMONSTRATION du copilote : dérivées localement
   du dataset déterministe (jamais présentées comme une vraie IA — badge
   « Mode démonstration » dans l'UI). Partagé entre la page /copilote et
   le copilote contextuel. Un vrai appel Claude remplacera answer()
   sans changer les UI. */

function nicheBrief(d: Dataset, niche: string, country: string, q: string) {
  const videos = d.videos.filter((v) => v.niche === niche).slice(0, 2);
  const hook = d.hooks.find((h) => h.industries.includes(niche)) ?? d.hooks[0];
  return (
    <>
      <p>
        Voici ce qui bouge en <strong>{niche}</strong> ({country}) :
      </p>
      <ul>
        {videos.map((v) => (
          <li key={v.id}>
            <Check />
            <span>
              <b>« {v.title} »</b> — +{v.growth} %, {fmt(v.views)} vues. {v.summary}
            </span>
          </li>
        ))}
        <li>
          <Check />
          <span>
            Hook conseillé : <b>« {hook.text} »</b>
          </span>
        </li>
      </ul>
      <div className="chip-row">
        <Link className="chip hot" href={`/opportunites?${q}&niche=${encodeURIComponent(niche)}`}>
          Ouvrir les opportunités {niche} <ArrowRight style={{ width: 11, height: 11 }} />
        </Link>
      </div>
    </>
  );
}

function todayPlan(d: Dataset, q: string) {
  const v = d.videos[0];
  const s = d.sounds[0];
  const h = d.hooks[0];
  return (
    <>
      <p>Mon plan pour aujourd&apos;hui, dans l&apos;ordre :</p>
      <ul>
        <li><Check /><span>Tourner <b>« {v.title} »</b> ({v.prodTime}, niche {v.niche}) — {v.context}</span></li>
        <li><Check /><span>Poser le son <b>« {s.name} »</b>{s.videos > 0 ? <> (encore {fmt(s.videos)} vidéos)</> : null}</span></li>
        <li><Check /><span>Ouvrir avec : <b>« {h.text} »</b> — {h.explanation}</span></li>
        <li><Check /><span>Conclure avec : <b>« {v.cta} »</b></span></li>
      </ul>
      <div className="chip-row">
        <Link className="chip hot" href={`/opportunites?${q}`}>
          Voir toutes les opportunités <ArrowRight style={{ width: 11, height: 11 }} />
        </Link>
      </div>
    </>
  );
}

function soundsBrief(d: Dataset) {
  const sounds = d.sounds.filter((s) => s.rising).slice(0, 3);
  const list = sounds.length ? sounds : d.sounds.slice(0, 3);
  return (
    <>
      <p>Trois sons à prendre <strong>maintenant</strong>, avant la foule :</p>
      <ul>
        {list.map((s) => (
          <li key={s.id}>
            <Check />
            <span><b>« {s.name} »</b> — {s.artist}. {s.note}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function hooksBrief(d: Dataset) {
  const hooks = d.hooks.slice(0, 3);
  return (
    <>
      <p>Les ouvertures qui retiennent le mieux en ce moment :</p>
      <ul>
        {hooks.map((h) => (
          <li key={h.id}>
            <Check />
            <span><b>« {h.text} »</b> — {h.explanation}</span>
          </li>
        ))}
      </ul>
      <p>Copiez-en un, ou dites-moi votre niche pour un hook sur mesure.</p>
    </>
  );
}

function creatorsBrief(d: Dataset, country: string) {
  const creators = d.creators.slice(0, 3);
  return (
    <>
      <p>Les comptes qui grandissent le plus vite en {country} :</p>
      <ul>
        {creators.map((c) => (
          <li key={c.id}>
            <Check />
            <span><b>{c.handle}</b> ({c.niche}) — +{c.growth} % cette semaine. {c.reason}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function fallback(d: Dataset, country: string) {
  const v = d.videos[0];
  return (
    <>
      <p>
        Je peux vous aider sur les tendances {country} : demandez-moi{' '}
        <strong>quoi poster</strong>, une <strong>analyse de niche</strong> ({NICHES.map((n) => n.name).slice(0, 4).join(', ')}...),
        des <strong>sons</strong>, des <strong>hooks</strong> ou des <strong>créateurs</strong>.
      </p>
      <p>
        En attendant : le format le plus chaud du moment est <b>« {v.title} »</b> (+{v.growth} %) en {v.niche}.
      </p>
    </>
  );
}

export function answer(
  text: string,
  country: string,
  timeframe: string,
  q: string,
  followedNiches: string[],
): React.ReactNode {
  const d = dataset(country, timeframe, followedNiches);
  const t = text.toLowerCase();
  // Les niches suivies (y compris personnalisées) d'abord, puis les intégrées.
  const followed = followedNiches.find((n) => t.includes(n.toLowerCase()));
  if (followed) return nicheBrief(d, followed, country, q);
  const niche = NICHES.find((n) => t.includes(n.name.toLowerCase()));
  if (niche) return nicheBrief(d, niche.name, country, q);
  if (/\bson(s)?\b|musique|audio/.test(t)) return soundsBrief(d);
  if (/hook|accroche|ouverture/.test(t)) return hooksBrief(d);
  if (/créateur|createur|compte|profil/.test(t)) return creatorsBrief(d, country);
  if (/poster|plan|aujourd|idée|idee|filmer|tourner|publier|simple|facile/.test(t)) return todayPlan(d, q);
  return fallback(d, country);
}
