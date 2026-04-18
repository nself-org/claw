import React from 'react';

type GlassCardVariant = 'default' | 'elevated' | 'modal';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  className?: string;
  children?: React.ReactNode;
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

const variantStyles: Record<GlassCardVariant, React.CSSProperties> = {
  default: {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
  },
  elevated: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
  },
  modal: {
    background: 'rgba(22, 22, 42, 0.95)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-modal)',
  },
};

export function GlassCard({
  variant = 'default',
  className,
  children,
  style,
  ...props
}: GlassCardProps): React.ReactElement {
  return (
    <div
      className={cn(className)}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
