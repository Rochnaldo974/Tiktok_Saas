'use client';

import { useEffect, useRef, useState } from 'react';
import { Bolt, X } from '@/components/icons';
import { answer } from '@/components/copilot/answer';
import { track } from '@/lib/analytics';
import type { Timeframe } from '@/lib/data';

/* Copilote contextuel « Demander à Signal » : plus une destination,
   une assistance. S'ouvre via openCopilot(context, subject) depuis les
   opportunités, les scripts et Aujourd'hui, avec des suggestions
   adaptées au contexte. Réponses de démonstration locales — jamais
   présentées comme une vraie IA. */

export type CopilotContext = 'today' | 'opportunity' | 'script';

const COPILOT_EVENT = 'signal:copilot';

export function openCopilot(context: CopilotContext, subject?: string): void {
  window.dispatchEvent(new CustomEvent(COPILOT_EVENT, { detail: { context, subject } }));
}

const SUGGESTIONS: Record<CopilotContext, string[]> = {
  today: [
    'Que dois-je publier maintenant ?',
    'Donne-moi une option plus facile.',
    'Trouve-moi une idée sans face caméra.',
  ],
  opportunity: [
    'Pourquoi cette tendance me correspond-elle ?',
    'Donne-moi un angle plus original.',
    'Adapte-la à une audience débutante.',
  ],
  script: [
    'Rends ce hook plus fort.',
    'Réduis la vidéo à 15 secondes.',
    'Donne-moi une version plus naturelle.',
    'Transforme-la en storytelling.',
  ],
};

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: React.ReactNode;
}

export function ContextCopilot({
  country,
  timeframe,
  followedNiches,
}: {
  country: string;
  timeframe: Timeframe;
  followedNiches: string[];
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<CopilotContext>('today');
  const [subject, setSubject] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const idRef = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);
  const q = `country=${encodeURIComponent(country)}&tf=${encodeURIComponent(timeframe)}`;

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ context: CopilotContext; subject?: string }>).detail;
      setContext(detail.context);
      setSubject(detail.subject ?? null);
      setMessages([]);
      setOpen(true);
      track('contextual_copilot_used', { context: detail.context });
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener(COPILOT_EVENT, onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(COPILOT_EVENT, onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, thinking]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setInput('');
    setMessages((prev) => [...prev, { id: idRef.current++, role: 'user', content: clean }]);
    setThinking(true);
    const enriched = subject ? `${clean} — ${subject}` : clean;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: 'ai', content: answer(enriched, country, timeframe, q, followedNiches) },
      ]);
      setThinking(false);
    }, 600);
  }

  if (!open) return null;

  return (
    <div className="copilot-pop" role="dialog" aria-label="Demander à Signal">
      <div className="copilot-pop-head">
        <span className="msg-avatar" aria-hidden="true"><Bolt /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong>Demander à Signal</strong>
          <span className="copilot-pop-sub">
            {subject ? `À propos de « ${subject.slice(0, 44)}${subject.length > 44 ? '…' : ''} »` : 'Mode démonstration'}
          </span>
        </div>
        <button className="icon-btn" aria-label="Fermer" onClick={() => setOpen(false)}>
          <X />
        </button>
      </div>
      <div className="copilot-pop-thread" ref={threadRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="chip-row" style={{ padding: '4px 0' }}>
            {SUGGESTIONS[context].map((s) => (
              <button key={s} className="chip" style={{ cursor: 'pointer' }} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
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
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre question…"
          aria-label="Votre question à Signal"
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={thinking}>
          Envoyer
        </button>
      </form>
      <p className="copilot-pop-note">Réponses de démonstration générées localement.</p>
    </div>
  );
}
