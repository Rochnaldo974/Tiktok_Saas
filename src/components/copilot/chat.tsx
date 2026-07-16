'use client';

import { useEffect, useRef, useState } from 'react';
import { Bolt, Search } from '@/components/icons';
import { answer } from '@/components/copilot/answer';

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
            <span className="msg-avatar">{m.role === 'ai' ? <Bolt /> : 'Moi'}</span>
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
