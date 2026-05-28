import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'line' | 'avatar' | 'custom';
  className?: string;
  lines?: number;
}

function LoadingSkeleton({ variant = 'line', className = '', lines = 3 }: LoadingSkeletonProps) {
  if (variant === 'line') {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h- 3.5 rounded-md bg-gray-100/80 animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    );
  }
  if (variant === 'card') {
    return <div className={`${className} h-28 rounded-xl bg-gray-100/80 animate-pulse`} />;
  }
  if (variant === 'table') {
    return <div className={`${className} h-10 rounded-lg bg-gray-100/80 animate-pulse`} />;
  }
  if (variant === 'avatar') {
    return <div className={`${className} w-9 h-9 rounded-lg bg-gray-100/80 animate-pulse`} />;
  }
  return <div className={`${className} bg-gray-100/80 animate-pulse rounded-lg`} />;
}

export { LoadingSkeleton };
export default LoadingSkeleton;