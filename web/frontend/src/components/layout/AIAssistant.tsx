'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  ArrowUp,
  ImagePlus,
  Maximize2,
  Minimize2,
  Bot,
} from 'lucide-react';
import { useUiStore } from '@/lib/uiStore';
import { SpikeMark } from '@/components/brand/SpikeMark';

type Msg = { id: number; role: 'user' | 'ai'; text: string };

const SUGGESTIONS = [
  'Summarise current crowd risk',
  'Which zones need responders?',
  'Draft an evacuation advisory for Ramkund',
  'Analyse the latest CCTV sighting',
];

const SEED: Msg[] = [
  {
    id: 0,
    role: 'ai',
    text: 'I monitor crowd density, missing-person cases and responder positions in real time. Ask me anything, or upload an image for incident analysis.',
  },
];

export default function AIAssistant() {
  const open = useUiStore((s) => s.assistantOpen);
  const setOpen = useUiStore((s) => s.setAssistant);
  const toggle = useUiStore((s) => s.toggleAssistant);

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    // Local stub response — wire to the existing Groq orchestrator when ready.
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: 'Analysing live telemetry... Ramkund Ghat is trending toward its warning threshold (density 3.8/m2). I recommend rerouting two responder units from Tapovan Exit and issuing a soft advisory. Want me to draft the broadcast?',
        },
      ]);
    }, 650);
  }

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="fixed bottom-6 right-6 z-40 grid place-items-center size-13 h-13 w-13 rounded-2xl bg-coral text-on-primary shadow-[0_8px_30px_rgba(255,128,31,0.35)]"
            aria-label="Open AI assistant"
          >
            <Sparkles size={20} />
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-accent-green ring-2 ring-canvas" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={
              'fixed z-40 flex flex-col rounded-2xl border border-hairline bg-surface-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden ' +
              (expanded
                ? 'inset-4 sm:inset-8 lg:inset-x-auto lg:right-6 lg:top-6 lg:bottom-6 lg:w-[480px]'
                : 'bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-[400px] h-[600px] max-h-[80vh]')
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 hairline-b shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center size-8 rounded-lg bg-coral/12 text-coral">
                  <SpikeMark className="size-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold text-ink">Raksha AI</p>
                  <p className="text-[10px] text-accent-green flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-accent-green" /> Online · Groq
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="grid place-items-center size-8 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="grid place-items-center size-8 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors"
                  aria-label="Close assistant"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={'flex gap-2.5 ' + (m.role === 'user' ? 'flex-row-reverse' : '')}>
                  <span
                    className={
                      'grid place-items-center size-7 rounded-lg shrink-0 ' +
                      (m.role === 'user' ? 'bg-surface-elevated text-muted' : 'bg-coral/12 text-coral')
                    }
                  >
                    {m.role === 'user' ? <span className="text-[11px] font-semibold">CR</span> : <Bot size={15} />}
                  </span>
                  <div
                    className={
                      'max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ' +
                      (m.role === 'user'
                        ? 'bg-surface-elevated text-ink'
                        : 'bg-surface-soft text-body border border-hairline')
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {messages.length <= 1 && (
                <div className="grid grid-cols-1 gap-2 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[12px] text-body px-3 py-2 rounded-lg border border-hairline bg-surface-soft hover:border-coral/40 hover:text-ink transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="p-3 hairline-t shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2 rounded-xl border border-hairline bg-surface-soft p-2 focus-within:border-coral/40 transition-colors"
              >
                <button type="button" className="grid place-items-center size-9 rounded-lg text-muted hover:text-ink hover:bg-surface-elevated transition-colors" aria-label="Upload image">
                  <ImagePlus size={17} />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask Raksha AI…"
                  className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted-soft outline-none resize-none max-h-28 py-2"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="grid place-items-center size-9 rounded-lg bg-coral text-on-primary disabled:opacity-40 hover:bg-coral-active transition-colors"
                  aria-label="Send"
                >
                  <ArrowUp size={17} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
