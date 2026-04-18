'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';

/** Map URL path segments to sidebar section IDs. */
const PATH_TO_SECTION: Record<string, string> = {
  profile: 'profile',
  avatar: 'avatar',
  theme: 'theme',
  'compact-mode': 'compact-mode',
  model: 'model',
  'system-prompt': 'system-prompt',
  account: 'account',
  subscription: 'subscription',
  privacy: 'privacy',
  sessions: 'sessions',
  notifications: 'notifications',
  'data-export': 'data-export',
  'data-retention': 'data-retention',
  'pool-accounts': 'pool-accounts',
  about: 'about',
  help: 'help',
  'keyboard-shortcuts': 'keyboard-shortcuts',
};

/** Human-readable breadcrumb labels per section. */
const SECTION_LABELS: Record<string, string> = {
  profile: 'Profile & Bio',
  avatar: 'Avatar',
  theme: 'Theme',
  'compact-mode': 'Compact Mode',
  model: 'Model',
  'system-prompt': 'System Prompt',
  account: 'Account',
  subscription: 'Subscription',
  privacy: 'Privacy',
  sessions: 'Sessions',
  notifications: 'Notifications',
  'data-export': 'Data Export',
  'data-retention': 'Data Retention',
  'pool-accounts': 'Pool Accounts',
  about: 'About',
  help: 'Help',
  'keyboard-shortcuts': 'Keyboard Shortcuts',
};

function resolveActiveSection(pathname: string): string {
  // pathname looks like /settings or /settings/profile or /settings/data-export
  const parts = pathname.split('/').filter(Boolean);
  // parts = ['settings'] or ['settings', 'profile']
  const segment = parts[1] ?? 'profile';
  return PATH_TO_SECTION[segment] ?? 'profile';
}

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({
  children,
}: SettingsLayoutProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();

  const activeSection = resolveActiveSection(pathname);
  const sectionLabel = SECTION_LABELS[activeSection] ?? 'Settings';

  function handleNavigate(section: string): void {
    router.push(`/settings/${section}`);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--color-bg)',
      }}
    >
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Settings
        </h1>
        <span
          aria-hidden="true"
          style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}
        >
          /
        </span>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
          }}
        >
          {sectionLabel}
        </span>
      </header>

      {/* Body: sidebar + content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar — hidden below md via inline media-query-free approach using CSS class */}
        <div
          className="settings-sidebar-wrapper"
          style={{
            flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            overflowY: 'auto',
          }}
        >
          <SettingsSidebar
            activeSection={activeSection}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Mobile section selector */}
        <div className="settings-mobile-select" aria-label="Settings section">
          <select
            value={activeSection}
            onChange={(e) => handleNavigate(e.target.value)}
            style={{
              padding: '10px 12px',
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              fontSize: '14px',
              margin: '12px',
              width: 'calc(100% - 24px)',
            }}
            aria-label="Navigate to settings section"
          >
            {Object.entries(SECTION_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>

      <style>{`
        .settings-sidebar-wrapper { display: flex; }
        .settings-mobile-select { display: none; }

        @media (max-width: 640px) {
          .settings-sidebar-wrapper { display: none; }
          .settings-mobile-select { display: block; width: 100%; border-bottom: 1px solid var(--color-border); }
        }
      `}</style>
    </div>
  );
}
