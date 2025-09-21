import React from 'react';
import { cn } from '../../utils/helpers';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-neutral-600 border-t-blue-500',
        sizeClasses[size],
        className
      )}
    />
  );
};

interface LoadingOverlayProps {
  children?: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        {children && (
          <p className="text-sm text-neutral-400">{children}</p>
        )}
      </div>
    </div>
  );
};