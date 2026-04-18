'use client';

import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

const SUBTITLE_VARIANTS = [
  "What's on your mind?",
  'How can I help you today?',
  'Ready when you are.',
  "What would you like to explore?",
] as const;

function getGreetingPrefix(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function resolveName(
  displayName: string | null | undefined,
  email: string | null | undefined
): string {
  if (displayName?.trim()) return displayName.trim();
  if (email?.trim()) {
    const local = email.split('@')[0];
    if (local) return local;
  }
  return 'there';
}

/** Picks a subtitle index that is stable per browser session. */
function useSessionSubtitleIndex(): number {
  const ref = useRef<number | null>(null);
  if (ref.current === null) {
    ref.current = Math.floor(Math.random() * SUBTITLE_VARIANTS.length);
  }
  return ref.current;
}

export function GreetingBanner(): React.ReactElement {
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);

  const name = useMemo(
    () => resolveName(settings?.displayName ?? user?.displayName, user?.email),
    [settings?.displayName, user?.displayName, user?.email]
  );

  const prefix = useMemo(() => getGreetingPrefix(), []);
  const subtitleIndex = useSessionSubtitleIndex();
  const subtitle = SUBTITLE_VARIANTS[subtitleIndex] ?? SUBTITLE_VARIANTS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2 py-12 text-center"
    >
      <h1
        className="text-3xl font-semibold tracking-tight"
        style={{ color: 'var(--color-text)' }}
      >
        {prefix},{' '}
        <span style={{ color: 'var(--color-text)' }}>{name}</span>
      </h1>
      <p
        className="text-base"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {subtitle}
      </p>
    </motion.div>
  );
}

export default GreetingBanner;
