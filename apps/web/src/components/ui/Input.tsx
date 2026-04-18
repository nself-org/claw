import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}

let idCounter = 0;
function useStableId(providedId?: string): string {
  const [id] = React.useState(() => providedId ?? `nclaw-input-${++idCounter}`);
  return id;
}

export function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  className,
  containerClassName,
  id: providedId,
  disabled,
  onFocus,
  onBlur,
  style,
  ...props
}: InputProps): React.ReactElement {
  const id = useStableId(providedId);
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const [focused, setFocused] = React.useState(false);

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--color-bg-input)',
    border: `1px solid ${error ? 'var(--color-error)' : focused ? 'var(--color-border-focus)' : 'var(--color-border)'}`,
    borderRadius: '8px',
    padding: '0 12px',
    height: '40px',
    transition: 'border-color var(--transition-fast)',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : undefined,
    outline: focused ? '2px solid transparent' : undefined,
    boxShadow: focused && !error ? '0 0 0 3px var(--color-border-focus)' : undefined,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--color-text)',
    fontSize: '14px',
    lineHeight: 1.5,
    width: '100%',
    cursor: disabled ? 'not-allowed' : undefined,
  };

  const iconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    color: 'var(--color-text-muted)',
  };

  return (
    <div
      className={containerClassName}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            cursor: disabled ? 'not-allowed' : 'default',
          }}
        >
          {label}
        </label>
      )}

      <div style={wrapperStyle}>
        {prefix && <span style={iconStyle} aria-hidden="true">{prefix}</span>}

        <input
          id={id}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId ?? hintId}
          className={className}
          style={{ ...inputStyle, ...style }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...props}
        />

        {suffix && <span style={iconStyle} aria-hidden="true">{suffix}</span>}
      </div>

      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ fontSize: '12px', color: 'var(--color-error)', lineHeight: 1.4 }}
        >
          {error}
        </span>
      )}

      {hint && !error && (
        <span
          id={hintId}
          style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}
        >
          {hint}
        </span>
      )}

      <style>{`
        #${id}::placeholder {
          color: var(--color-text-placeholder);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default Input;
