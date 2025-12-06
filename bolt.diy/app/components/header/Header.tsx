import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { AboutModal } from './AboutModal';
import { useState } from 'react';

export function Header() {
  const chat = useStore(chatStore);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <header
      className={classNames('flex items-center px-8 py-4 h-[var(--header-height)] bg-black border-b-2', {
        'border-transparent': !chat.started,
        'border-white': chat.started,
      })}
    >
      <button
        onClick={() => window.location.href = '/'}
        className="flex items-center gap-4 bg-transparent hover:opacity-80 transition-opacity cursor-pointer border-none"
        title="Go to home page"
      >
        <div className="w-12 h-12 bg-white flex items-center justify-center border-2 border-white">
          <div className="i-ph:code-bold text-3xl text-black" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter text-white">WORKSPACE</span>
          <span className="text-[10px] text-white/60 tracking-[0.3em] uppercase font-bold">Development Environment</span>
        </div>
      </button>
      {chat.started && (
        <>
          <span className="flex-1 px-6 truncate text-center text-white font-mono text-sm">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-3">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
      {!chat.started && <div className="flex-1" />}

      {/* About button - always visible */}
      <button
        onClick={() => setIsAboutOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-black hover:text-white border-2 border-white transition-all"
        title="Learn about WORKSPACE"
      >
        <span className="i-ph:info text-base" />
        <span>About</span>
      </button>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </header>
  );
}
