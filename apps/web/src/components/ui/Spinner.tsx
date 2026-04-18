import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  'aria-label'?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

const strokeWidthMap: Record<SpinnerSize, number> = {
  sm: 2,
  md: 2.5,
  lg: 3,
};

export function Spinner({
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Loading',
}: SpinnerProps): React.ReactElement {
  const px = sizeMap[size];
  const stroke = strokeWidthMap[size];
  const r = (px - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * 0.75;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      className={className}
      aria-label={ariaLabel}
      role="status"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      <style>{`
        @keyframes nclaw-spin {
          to { transform: rotate(360deg); }
        }
        .nclaw-spinner-svg {
          animation: nclaw-spin 700ms linear infinite;
          transform-origin: center;
        }
      `}</style>
      <g className="nclaw-spinner-svg">
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          opacity={0.9}
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          opacity={0.2}
          strokeDasharray={circumference}
          strokeDashoffset={0}
        />
      </g>
    </svg>
  );
}

export default Spinner;
