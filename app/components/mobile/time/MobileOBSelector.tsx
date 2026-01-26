'use client';

import React from 'react';
import { 
  Hammer, 
  Moon, 
  Stars, 
  PartyPopper, 
  Hospital,
  Baby,
  Palmtree,
  Home,
  LucideIcon
} from 'lucide-react';

export type OBType = 'work' | 'ob-evening' | 'ob-night' | 'ob-weekend' | 'sick' | 'vab' | 'vacation' | 'absence';

interface OBTypeOption {
  id: OBType;
  icon: LucideIcon;
  label: string;
  emoji: string;
}

const obTypes: OBTypeOption[] = [
  { id: 'work', icon: Hammer, label: 'Arbete', emoji: '🔨' },
  { id: 'ob-evening', icon: Moon, label: 'OB Kväll', emoji: '🌙' },
  { id: 'ob-night', icon: Stars, label: 'OB Natt', emoji: '🌃' },
  { id: 'ob-weekend', icon: PartyPopper, label: 'OB Helg', emoji: '🎉' },
  { id: 'sick', icon: Hospital, label: 'Sjuk', emoji: '🏥' },
  { id: 'vab', icon: Baby, label: 'VAB', emoji: '👶' },
  { id: 'vacation', icon: Palmtree, label: 'Semester', emoji: '🌴' },
  { id: 'absence', icon: Home, label: 'Frånvaro', emoji: '🏠' },
];

interface MobileOBSelectorProps {
  value: OBType;
  onChange: (value: OBType) => void;
}

/**
 * MobileOBSelector - Field-First Design System
 * 
 * 2x4 grid of OB type buttons optimized for glove use:
 * - 64px minimum touch targets
 * - Icon + label on each button
 * - High contrast selected state (orange border, light orange background)
 */
export function MobileOBSelector({ value, onChange }: MobileOBSelectorProps) {
  return (
    <div className="w-full">
      <label className="field-text-large mb-4 block">Typ av tid</label>
      
      <div className="grid grid-cols-2 gap-4">
        {obTypes.map((type) => {
          const isSelected = value === type.id;
          const Icon = type.icon;
          
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={`
                touch-target-primary
                flex flex-col items-center justify-center gap-2
                aspect-square rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'field-card-selected' 
                  : 'field-card hover:border-gray-400'
                }
              `}
            >
              <span className="text-3xl" aria-hidden="true">
                {type.emoji}
              </span>
              <span className={`text-sm font-bold ${isSelected ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MobileOBSelector;
