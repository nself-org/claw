import React from 'react';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  lines?: number;
  className?: string;
  style?: React.CSSProperties;
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

const pulseStyle: React.CSSProperties = {
  animation: 'skeleton-pulse 1.6s ease-in-out infinite',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
};

function SingleSkeleton({
  variant = 'rect',
  width,
  height,
  className,
  style,
}: Omit<SkeletonProps, 'lines'>): React.ReactElement {
  let shapeStyle: React.CSSProperties = {};

  switch (variant) {
    case 'text':
      shapeStyle = {
        height: height ?? '1em',
        width: width ?? '100%',
        borderRadius: '4px',
      };
      break;
    case 'circle':
      shapeStyle = {
        width: width ?? 40,
        height: height ?? width ?? 40,
        borderRadius: '9999px',
        flexShrink: 0,
      };
      break;
    case 'rect':
      shapeStyle = {
        width: width ?? '100%',
        height: height ?? 40,
        borderRadius: '8px',
      };
      break;
    case 'card':
      shapeStyle = {
        width: width ?? '100%',
        height: height ?? 120,
        borderRadius: 'var(--radius-card)',
      };
      break;
  }

  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn(className)}
      style={{ display: 'block', ...pulseStyle, ...shapeStyle, ...style }}
    />
  );
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines,
  className,
  style,
}: SkeletonProps): React.ReactElement {
  if (variant === 'text' && lines && lines > 1) {
    return (
      <span
        role="presentation"
        aria-hidden="true"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: width ?? '100%' }}
      >
        {Array.from({ length: lines }, (_, i) => (
          <SingleSkeleton
            key={i}
            variant="text"
            width={i === lines - 1 ? '70%' : '100%'}
            height={height}
            className={className}
            style={style}
          />
        ))}
      </span>
    );
  }

  return (
    <SingleSkeleton
      variant={variant}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );
}

export default Skeleton;
