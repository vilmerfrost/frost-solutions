'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface GloveFriendlyButtonProps {
  variant: 'primary' | 'success' | 'destructive' | 'secondary' | 'warning';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
}

const variantClasses: Record<GloveFriendlyButtonProps['variant'], string> = {
  primary: 'field-primary',
  success: 'field-success',
  destructive: 'field-destructive',
  secondary: 'field-secondary',
  warning: 'field-warning',
};

/**
 * GloveFriendlyButton - Field-First Design System
 * 
 * A button optimized for construction workers using phones with gloves in sunlight.
 * - Minimum 64px height for glove-friendly touch targets
 * - High contrast colors visible in direct sunlight
 * - No hover states (touch-only)
 * - Active state with scale feedback
 */
export function GloveFriendlyButton({
  variant,
  children,
  onClick,
  disabled = false,
  fullWidth = true,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
}: GloveFriendlyButtonProps) {
  const baseClasses = 'touch-target-primary rounded-lg text-lg flex items-center justify-center gap-3 px-6';
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${widthClass}
        ${disabledClasses}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-6 h-6 flex-shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-6 h-6 flex-shrink-0" />}
    </button>
  );
}

export default GloveFriendlyButton;
