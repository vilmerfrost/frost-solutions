'use client';

import React from 'react';

export interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  status?: 'default' | 'success' | 'error';
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const statusClasses: Record<NonNullable<MobileCardProps['status']>, string> = {
  default: 'field-card',
  success: 'field-card-success',
  error: 'field-card-error',
};

const paddingClasses: Record<NonNullable<MobileCardProps['padding']>, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * MobileCard - Field-First Design System
 * 
 * A touch-optimized card with thick borders for visibility in sunlight.
 * - 2px borders for high visibility
 * - High contrast backgrounds
 * - Optional selected state with orange highlight
 * - Touch feedback with scale animation
 */
export function MobileCard({
  children,
  onClick,
  selected = false,
  status = 'default',
  className = '',
  padding = 'md',
}: MobileCardProps) {
  const baseClasses = selected ? 'field-card-selected' : statusClasses[status];
  const interactiveClasses = onClick ? 'touch-manipulation active:scale-[0.98] transition-transform cursor-pointer' : '';
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${paddingClasses[padding]}
        ${interactiveClasses}
        w-full text-left
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </Component>
  );
}

/**
 * MobileCardHeader - Title and optional subtitle for cards
 */
export function MobileCardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="field-text-large truncate">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * MobileCardContent - Main content area
 */
export function MobileCardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mt-3 ${className}`}>{children}</div>;
}

/**
 * MobileCardFooter - Footer with actions or metadata
 */
export function MobileCardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

export default MobileCard;
