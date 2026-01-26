'use client';

import React, { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { GloveFriendlyButton } from '../GloveFriendlyButton';

export interface VerificationField {
  id: string;
  label: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  type?: 'text' | 'number' | 'date' | 'currency';
}

interface MobileVerificationCardProps {
  field: VerificationField;
  onConfirm: (id: string) => void;
  onEdit: (id: string, newValue: string) => void;
}

/**
 * MobileVerificationCard - Field-First Design System
 * 
 * Single-field verification card for OCR results:
 * - Shows field label (large, bold)
 * - Extracted value (extra large, black)
 * - Confidence indicator (green/yellow/red bar)
 * - Two buttons: "Confirm" (64px, green) | "Edit" (64px, orange)
 */
export function MobileVerificationCard({
  field,
  onConfirm,
  onEdit,
}: MobileVerificationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value);

  const confidenceClasses: Record<VerificationField['confidence'], string> = {
    high: 'field-confidence-high',
    medium: 'field-confidence-medium',
    low: 'field-confidence-low',
  };

  const confidenceLabels: Record<VerificationField['confidence'], string> = {
    high: 'Hög säkerhet',
    medium: 'Medel säkerhet',
    low: 'Låg säkerhet - kontrollera',
  };

  const handleSaveEdit = () => {
    onEdit(field.id, editValue);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(field.value);
    setIsEditing(false);
  };

  // Edit mode
  if (isEditing) {
    return (
      <div className="field-card p-6">
        <label className="field-text text-sm uppercase tracking-wide">
          {field.label}
        </label>
        
        <input
          type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="field-input mt-4"
          autoFocus
        />
        
        <div className="flex gap-4 mt-6">
          <GloveFriendlyButton
            variant="success"
            onClick={handleSaveEdit}
            icon={Check}
          >
            Spara
          </GloveFriendlyButton>
          <GloveFriendlyButton
            variant="secondary"
            onClick={handleCancelEdit}
            icon={X}
          >
            Avbryt
          </GloveFriendlyButton>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="field-card p-6">
      <label className="field-text text-sm uppercase tracking-wide">
        {field.label}
      </label>
      
      <p className="text-2xl font-bold text-black dark:text-white mt-2">
        {field.value || '—'}
      </p>
      
      {/* Confidence indicator */}
      <div className="mt-4">
        <div className={`${confidenceClasses[field.confidence]} w-full`} />
        <p className="text-xs text-gray-500 mt-1">{confidenceLabels[field.confidence]}</p>
      </div>
      
      <div className="flex gap-4 mt-6">
        <GloveFriendlyButton
          variant="success"
          onClick={() => onConfirm(field.id)}
          icon={Check}
        >
          Bekräfta
        </GloveFriendlyButton>
        <GloveFriendlyButton
          variant="primary"
          onClick={() => setIsEditing(true)}
          icon={Pencil}
        >
          Ändra
        </GloveFriendlyButton>
      </div>
    </div>
  );
}

export default MobileVerificationCard;
