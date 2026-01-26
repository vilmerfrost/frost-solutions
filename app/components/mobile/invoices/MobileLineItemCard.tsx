'use client';

import React, { useState } from 'react';
import { Pencil, Check, X, Package } from 'lucide-react';
import { MobileCard } from '../MobileCard';
import { GloveFriendlyButton } from '../GloveFriendlyButton';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface MobileLineItemCardProps {
  item: LineItem;
  onEdit: (id: string, item: Partial<LineItem>) => void;
  onDelete?: (id: string) => void;
  currency?: string;
}

/**
 * MobileLineItemCard - Field-First Design System
 * 
 * Invoice line item displayed as card (not table row):
 * - Description, Qty × Price = Total
 * - Edit button on each card
 * - No swipe gestures
 */
export function MobileLineItemCard({
  item,
  onEdit,
  onDelete,
  currency = 'kr',
}: MobileLineItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  });

  const handleSave = () => {
    const total = editValues.quantity * editValues.unitPrice;
    onEdit(item.id, { ...editValues, total });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' ' + currency;
  };

  // Edit mode
  if (isEditing) {
    return (
      <MobileCard padding="lg">
        <div className="space-y-4">
          <div>
            <label className="field-text text-sm mb-2 block">Beskrivning</label>
            <input
              type="text"
              value={editValues.description}
              onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
              className="field-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-text text-sm mb-2 block">Antal</label>
              <input
                type="number"
                value={editValues.quantity}
                onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                className="field-input"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="field-text text-sm mb-2 block">Styckpris</label>
              <input
                type="number"
                value={editValues.unitPrice}
                onChange={(e) => setEditValues(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                className="field-input"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="field-text">Totalt:</span>
            <span className="field-text-xl">
              {formatCurrency(editValues.quantity * editValues.unitPrice)}
            </span>
          </div>

          <div className="flex gap-3">
            <GloveFriendlyButton
              variant="success"
              onClick={handleSave}
              icon={Check}
            >
              Spara
            </GloveFriendlyButton>
            <GloveFriendlyButton
              variant="secondary"
              onClick={handleCancel}
              icon={X}
            >
              Avbryt
            </GloveFriendlyButton>
          </div>
        </div>
      </MobileCard>
    );
  }

  // View mode
  return (
    <MobileCard>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-gray-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="field-text truncate">{item.description}</p>
          <p className="text-sm text-gray-500 mt-1">
            {item.quantity} × {formatCurrency(item.unitPrice)}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="field-text-large">{formatCurrency(item.total)}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsEditing(true)}
          className="touch-target-48 w-full flex items-center justify-center gap-2 text-orange-600 font-semibold"
        >
          <Pencil className="w-5 h-5" />
          <span>Redigera</span>
        </button>
      </div>
    </MobileCard>
  );
}

export default MobileLineItemCard;
