'use client';

import React from 'react';
import {
  Bell,
  Camera,
  Clock,
  Cpu,
  CreditCard,
  Download,
  HelpCircle,
  Info,
  Key,
  Keyboard,
  LayoutList,
  MessageSquare,
  Palette,
  Shield,
  User,
  Users,
  Zap,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ICON_SIZE = 16;

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Profile',
    items: [
      {
        id: 'profile',
        label: 'Profile & Bio',
        icon: <User size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'avatar',
        label: 'Avatar',
        icon: <Camera size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
  {
    label: 'Appearance',
    items: [
      {
        id: 'theme',
        label: 'Theme',
        icon: <Palette size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'compact-mode',
        label: 'Compact Mode',
        icon: <LayoutList size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
  {
    label: 'AI & Models',
    items: [
      {
        id: 'model',
        label: 'Model',
        icon: <Cpu size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'system-prompt',
        label: 'System Prompt',
        icon: <MessageSquare size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
  {
    label: 'Account & Billing',
    items: [
      {
        id: 'account',
        label: 'Account',
        icon: <CreditCard size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'subscription',
        label: 'Subscription',
        icon: <Zap size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
  {
    label: 'Privacy & Security',
    items: [
      {
        id: 'privacy',
        label: 'Privacy',
        icon: <Shield size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'sessions',
        label: 'Sessions',
        icon: <Key size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
  {
    label: 'Notifications',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <Bell size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
  {
    label: 'Data & Sync',
    items: [
      {
        id: 'data-export',
        label: 'Data Export',
        icon: <Download size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'data-retention',
        label: 'Data Retention',
        icon: <Clock size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'pool-accounts',
        label: 'Pool Accounts',
        icon: <Users size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
  {
    label: 'About & Help',
    items: [
      {
        id: 'about',
        label: 'About',
        icon: <Info size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'help',
        label: 'Help',
        icon: <HelpCircle size={ICON_SIZE} aria-hidden="true" />,
      },
      {
        id: 'keyboard-shortcuts',
        label: 'Keyboard Shortcuts',
        icon: <Keyboard size={ICON_SIZE} aria-hidden="true" />,
      },
    ],
  },
];

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavItemButton({
  item,
  isActive,
  onClick,
}: NavItemButtonProps): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);

  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '7px 10px 7px 12px',
    borderRadius: '6px',
    border: 'none',
    background: isActive
      ? 'rgba(99, 102, 241, 0.1)'
      : hovered
      ? 'rgba(255, 255, 255, 0.04)'
      : 'transparent',
    borderLeft: isActive
      ? '2px solid var(--color-primary)'
      : '2px solid transparent',
    color: isActive ? 'var(--color-primary-text)' : 'var(--color-text-muted)',
    fontSize: '13px',
    fontWeight: isActive ? 500 : 400,
    cursor: 'pointer',
    textAlign: 'left',
    transition:
      'background-color var(--transition-fast), color var(--transition-fast)',
    outline: 'none',
    userSelect: 'none',
  };

  return (
    <button
      type="button"
      role="menuitem"
      aria-current={isActive ? 'page' : undefined}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
    </button>
  );
}

interface SettingsSidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export function SettingsSidebar({
  activeSection,
  onNavigate,
}: SettingsSidebarProps): React.ReactElement {
  return (
    <nav
      aria-label="Settings navigation"
      role="menu"
      style={{
        width: '220px',
        flexShrink: 0,
        height: '100%',
        overflowY: 'auto',
        padding: '8px 8px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}
    >
      {NAV_GROUPS.map((group, groupIndex) => (
        <React.Fragment key={group.label}>
          {groupIndex > 0 && (
            <div
              aria-hidden="true"
              style={{
                height: '1px',
                background: 'var(--color-border)',
                margin: '8px 4px',
              }}
            />
          )}
          <div style={{ padding: '8px 4px 4px' }}>
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                padding: '0 8px 4px',
                userSelect: 'none',
              }}
            >
              {group.label}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {group.items.map((item) => (
                <NavItemButton
                  key={item.id}
                  item={item}
                  isActive={activeSection === item.id}
                  onClick={() => onNavigate(item.id)}
                />
              ))}
            </div>
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}

export default SettingsSidebar;
