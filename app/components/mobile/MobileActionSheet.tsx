'use client';

import React, { useEffect, useState } from 'react';
import { LucideIcon, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { GloveFriendlyButton } from './GloveFriendlyButton';

export interface ActionSheetOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
}

export interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: ActionSheetOption[];
  onSelect: (id: string) => void;
  cancelLabel?: string;
}

/**
 * MobileActionSheet - Field-First Design System
 * 
 * Full-width bottom sheet that replaces dropdowns on mobile.
 * - Slides up from bottom
 * - 64px touch targets for each option
 * - Full-width cancel button
 * - Backdrop tap to close
 */
export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  options,
  onSelect,
  cancelLabel = 'Avbryt',
}: MobileActionSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('field-action-sheet-enter');
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      setAnimationClass('field-action-sheet-exit');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  const sheet = (
    <div
      className="field-action-sheet-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-sheet-title"
    >
      <div className={`field-action-sheet ${animationClass}`}>
        {/* Handle bar for visual affordance */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Title */}
        <div className="px-4 pb-4">
          <h2 id="action-sheet-title" className="field-text-large text-center">
            {title}
          </h2>
        </div>

        {/* Options */}
        <div className="px-4 space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`
                touch-target-primary w-full rounded-lg text-lg flex items-center justify-center gap-3 px-6
                ${option.destructive ? 'field-destructive' : 'field-secondary'}
              `}
            >
              {option.icon && <option.icon className="w-6 h-6 flex-shrink-0" />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <div className="p-4 mt-2">
          <GloveFriendlyButton variant="secondary" onClick={onClose}>
            {cancelLabel}
          </GloveFriendlyButton>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

export default MobileActionSheet;
