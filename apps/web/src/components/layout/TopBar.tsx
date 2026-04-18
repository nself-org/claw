'use client';

import { Menu } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useChatStore } from '@/store/chat-store';

export function TopBar() {
  const { setSidebarOpen, settings } = useAppStore();
  const { currentConversationId, conversations } = useChatStore();

  // Only render when a conversation is active
  if (!currentConversationId) return null;

  const currentConv = conversations.find((c) => c.id === currentConversationId);
  const title = currentConv?.title?.trim() || 'ɳClaw';

  const modelSel = settings?.modelSelection;
  const modelLabel = (() => {
    if (!modelSel) return null;
    if (modelSel.mode === 'manual' && modelSel.modelId) return modelSel.modelId;
    if (modelSel.mode === 'auto') {
      const strategyLabels: Record<string, string> = {
        fastest: 'Auto · Fast',
        balanced: 'Auto · Balanced',
        best: 'Auto · Best',
      };
      return strategyLabels[modelSel.autoStrategy] ?? 'Auto';
    }
    return 'Auto';
  })();

  return (
    <header
      className="flex items-center gap-3 px-4 flex-shrink-0"
      style={{
        height: 52,
        background: 'rgba(15,15,26,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
      aria-label="Top bar"
    >
      {/* Mobile hamburger — only on small screens */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] flex-shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
        }}
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb / title */}
      <h1
        className="flex-1 text-sm font-medium truncate min-w-0"
        style={{ color: 'var(--color-text)' }}
        title={title}
      >
        {title}
      </h1>

      {/* Model chip */}
      {modelLabel && (
        <div
          className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium select-none"
          style={{
            background: 'rgba(99,102,241,0.12)',
            color: 'var(--color-primary-text)',
            border: '1px solid rgba(99,102,241,0.22)',
          }}
          aria-label={`Current model: ${modelLabel}`}
        >
          {modelLabel}
        </div>
      )}
    </header>
  );
}
