'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { dataset, fmt, NICHES, type Dataset } from '@/lib/data';
import { Bolt, Check, ArrowRight, Search } from '@/components/icons';

/* Copilote de démonstration : les réponses sont dérivées localement du
   dataset déterministe (même moteur que les pages). L'appel à un vrai
   modèle (API Claude) remplacera `answer()` sans changer l'UI. */

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: React.ReactNode;
}

const SUGGESTIONS = [
  "Que poster aujourd'hui ?",
  'Analyse la niche Finance',
  'Trouve-moi un son qui monte',
  'Donne-moi un hook qui retient',
];

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
            Hook conseillé : <b>« {hook.text} »</b> ({hook.performance} % de rétention)
          </span>
        </li>
      </ul>
      <div className="chip-row">
        <Link className="chip hot" href={`/idees?${q}&niche=${encodeURIComponent(niche)}`}>
          Ouvrir le flux {niche} <ArrowRight style={{ width: 11, height: 11 }} />
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
        <li><Check /><span>Filmer <b>« {v.title} »</b> ({v.prodTime}, niche {v.niche}) — {v.context}</span></li>
        <li><Check /><span>Poser le son <b>« {s.name} »</b> (+{s.growth} %, encore {fmt(s.videos)} vidéos)</span></li>
        <li><Check /><span>Ouvrir avec : <b>« {h.text} »</b> — {h.explanation}</span></li>
        <li><Check /><span>Conclure avec : <b>« {v.cta} »</b></span></li>
      </ul>
      <div className="chip-row">
        <Link className="chip hot" href={`/idees?${q}`}>
          Voir toutes les idées du jour <ArrowRight style={{ width: 11, height: 11 }} />
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
            <span><b>« {s.name} »</b> — {s.artist}, +{s.growth} %. {s.note}</span>
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
            <span><b>« {h.text} »</b> — {h.performance} % de rétention. {h.explanation}</span>
          </li>
        ))}
      </ul>
      <p>Copiez-en un depuis la page Aujourd&apos;hui, ou dites-moi votre niche pour un hook sur mesure.</p>
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
        En attendant : la vidéo la plus chaude du moment est <b>« {v.title} »</b> (+{v.growth} %) en {v.niche}.
      </p>
    </>
  );
}

function answer(text: string, country: string, timeframe: string, q: string, followedNiches: string[]): React.ReactNode {
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
  if (/poster|plan|aujourd|idée|idee|filmer|publier/.test(t)) return todayPlan(d, q);
  return fallback(d, country);
}

export function CopilotChat({
  country,
  timeframe,
  followedNiches = [],
}: {
  country: string;
  timeframe: string;
  followedNiches?: string[];
}) {
  const q = `country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setInput('');
    setMessages((prev) => [...prev, { id: idRef.current++, role: 'user', content: clean }]);
    setThinking(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: 'ai', content: answer(clean, country, timeframe, q, followedNiches) },
      ]);
      setThinking(false);
    }, 700);
  }

  return (
    <div className="card chat reveal">
      <div className="chat-thread" ref={threadRef} style={{ maxHeight: 520, overflowY: 'auto' }} aria-live="polite">
        <div className="msg ai">
          <span className="msg-avatar"><Bolt /></span>
          <div className="msg-bubble">
            <p>
              Bonjour ! Je surveille TikTok {country} sur la période « {timeframe.toLowerCase()} ».
              Posez-moi une question, ou partez d&apos;une suggestion :
            </p>
            <div className="chip-row" style={{ marginTop: 10 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" style={{ cursor: 'pointer' }} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            <span className="msg-avatar">{m.role === 'ai' ? <Bolt /> : 'ER'}</span>
            <div className="msg-bubble">{typeof m.content === 'string' ? <p>{m.content}</p> : m.content}</div>
          </div>
        ))}
        {thinking && (
          <div className="msg ai">
            <span className="msg-avatar"><Bolt /></span>
            <div className="msg-bubble"><span className="typing"><i /><i /><i /></span></div>
          </div>
        )}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Search style={{ width: 16, height: 16, color: 'var(--faint)', flex: 'none' }} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex. : « analyse la niche Beauté », « trouve-moi un son »..."
          aria-label="Votre question au copilote"
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={thinking}>
          Envoyer
        </button>
      </form>
    </div>
  );
}
