import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontWeight: 500,
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast), opacity var(--transition-fast), box-shadow var(--transition-fast)',
  outline: 'none',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  lineHeight: 1,
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: '13px', padding: '6px 12px', height: '32px' },
  md: { fontSize: '14px', padding: '8px 16px', height: '40px' },
  lg: { fontSize: '16px', padding: '10px 20px', height: '48px' },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
  },
  danger: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    color: 'var(--color-error)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ButtonProps): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const isDisabled = disabled || loading;

  const hoverOverlay: React.CSSProperties = React.useMemo(() => {
    if (!hovered || isDisabled) return {};
    if (variant === 'primary') return { backgroundColor: 'var(--color-primary-hover)' };
    if (variant === 'ghost') return { backgroundColor: 'rgba(255,255,255,0.05)' };
    if (variant === 'danger') return { backgroundColor: 'rgba(248, 113, 113, 0.22)' };
    if (variant === 'outline') return { backgroundColor: 'rgba(255,255,255,0.05)' };
    return {};
  }, [hovered, isDisabled, variant]);

  const focusRing: React.CSSProperties =
    focused && !isDisabled
      ? { outline: '2px solid var(--color-primary)', outlineOffset: '2px' }
      : {};

  const computedStyle: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...hoverOverlay,
    ...focusRing,
    opacity: isDisabled ? 0.4 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    pointerEvents: isDisabled ? 'none' : 'auto',
    ...style,
  };

  return (
    <button
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={cn(className)}
      style={computedStyle}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      {...props}
    >
      {loading ? (
        <>
          <Loader2
            size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
            style={{ animation: 'nclaw-btn-spin 700ms linear infinite', flexShrink: 0 }}
            aria-hidden="true"
          />
          <style>{`@keyframes nclaw-btn-spin { to { transform: rotate(360deg); } }`}</style>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
