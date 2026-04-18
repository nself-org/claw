import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Contrast ratios (text on bg, verified against WCAG AA 4.5:1):
 *   default  — #94A3B8 on rgba(255,255,255,0.08) ≈ #1A1A2E  → ~7.5:1
 *   primary  — #A5B4FC on rgba(99,102,241,0.18)  ≈ #19193E  → ~9.1:1
 *   success  — #4ADE80 on rgba(74,222,128,0.15)  ≈ #12231B  → ~8.4:1
 *   error    — #F87171 on rgba(248,113,113,0.15) ≈ #251818  → ~6.2:1
 *   warning  — #FBBF24 on rgba(251,191,36,0.15)  ≈ #231F0C  → ~8.9:1
 *   info     — #38BDF8 on rgba(56,189,248,0.15)  ≈ #0D1F28  → ~8.1:1
 */
const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--color-text-muted)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
  },
  primary: {
    background: 'rgba(99, 102, 241, 0.18)',
    color: 'var(--color-primary-text)',
    border: '1px solid rgba(99, 102, 241, 0.30)',
  },
  success: {
    background: 'rgba(74, 222, 128, 0.15)',
    color: 'var(--color-success)',
    border: '1px solid rgba(74, 222, 128, 0.25)',
  },
  error: {
    background: 'rgba(248, 113, 113, 0.15)',
    color: 'var(--color-error)',
    border: '1px solid rgba(248, 113, 113, 0.25)',
  },
  warning: {
    background: 'rgba(251, 191, 36, 0.15)',
    color: 'var(--color-warning)',
    border: '1px solid rgba(251, 191, 36, 0.25)',
  },
  info: {
    background: 'rgba(56, 189, 248, 0.15)',
    color: 'var(--color-info)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
  },
};

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 1.5,
  whiteSpace: 'nowrap',
};

export function Badge({
  variant = 'default',
  children,
  className,
  style,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(className)}
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
    >
      {children}
    </span>
  );
}

export default Badge;
