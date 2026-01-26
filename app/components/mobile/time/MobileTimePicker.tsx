'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Coffee } from 'lucide-react';
import { GloveFriendlyButton } from '../GloveFriendlyButton';
import { MobileActionSheet, type ActionSheetOption } from '../MobileActionSheet';

interface MobileTimePickerProps {
  date: string;
  onDateChange: (date: string) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  breakDuration: string;
  onBreakChange: (duration: string) => void;
}

const breakOptions: ActionSheetOption[] = [
  { id: 'Ingen', label: 'Ingen rast' },
  { id: '30 min', label: '30 minuter' },
  { id: '60 min', label: '60 minuter' },
];

// Generate time options (every 15 minutes)
const generateTimeOptions = (): ActionSheetOption[] => {
  const options: ActionSheetOption[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      options.push({ id: time, label: time });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

/**
 * MobileTimePicker - Field-First Design System
 * 
 * Time entry component optimized for field workers:
 * - Date: Large date display with prev/next day buttons (64px each)
 * - Start/End Time: Full-width buttons that open MobileActionSheet
 * - Break: Horizontal pill buttons (64px height each)
 */
export function MobileTimePicker({
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  breakDuration,
  onBreakChange,
}: MobileTimePickerProps) {
  const [showStartSheet, setShowStartSheet] = useState(false);
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [showBreakSheet, setShowBreakSheet] = useState(false);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

    if (isToday) return 'Idag';
    if (isYesterday) return 'Igår';
    if (isTomorrow) return 'Imorgon';

    return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
  };

  const changeDate = (direction: 'prev' | 'next') => {
    const d = new Date(date);
    d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Calculate worked hours
  const calculateHours = () => {
    if (!startTime || !endTime) return 0;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight
    
    const breakMinutes = breakDuration === '30 min' ? 30 : breakDuration === '60 min' ? 60 : 0;
    totalMinutes -= breakMinutes;
    
    return Math.max(0, totalMinutes / 60);
  };

  const hours = calculateHours();

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div>
        <label className="field-text-large mb-3 block">Datum</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => changeDate('prev')}
            className="touch-target-primary field-secondary w-16 h-16 rounded-lg flex items-center justify-center"
            aria-label="Föregående dag"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="flex-1 field-card p-4 text-center">
            <p className="field-text-xl">{formatDate(date)}</p>
            <p className="text-sm text-gray-500 mt-1">{date}</p>
          </div>
          
          <button
            type="button"
            onClick={() => changeDate('next')}
            className="touch-target-primary field-secondary w-16 h-16 rounded-lg flex items-center justify-center"
            aria-label="Nästa dag"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Start time */}
      <div>
        <label className="field-text-large mb-3 block">Starttid</label>
        <button
          type="button"
          onClick={() => setShowStartSheet(true)}
          className="touch-target-primary field-secondary w-full rounded-lg text-lg flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-500" />
            <span>Start</span>
          </div>
          <span className="font-bold text-xl">{startTime}</span>
        </button>
      </div>

      {/* End time */}
      <div>
        <label className="field-text-large mb-3 block">Sluttid</label>
        <button
          type="button"
          onClick={() => setShowEndSheet(true)}
          className="touch-target-primary field-secondary w-full rounded-lg text-lg flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-500" />
            <span>Slut</span>
          </div>
          <span className="font-bold text-xl">{endTime}</span>
        </button>
      </div>

      {/* Break duration - Pill buttons */}
      <div>
        <label className="field-text-large mb-3 block">Rast</label>
        <div className="flex gap-3">
          {['Ingen', '30 min', '60 min'].map((option) => {
            const isSelected = breakDuration === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onBreakChange(option)}
                className={`
                  touch-target-primary flex-1 rounded-lg text-base flex items-center justify-center gap-2
                  ${isSelected ? 'field-primary' : 'field-secondary'}
                `}
              >
                <Coffee className="w-5 h-5" />
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary card */}
      <div className="field-card p-4">
        <div className="flex items-center justify-between">
          <span className="field-text">Arbetstid:</span>
          <span className="field-text-xl">{hours.toFixed(1)} timmar</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {startTime} - {endTime} med {breakDuration.toLowerCase()} rast
        </p>
      </div>

      {/* Action sheets */}
      <MobileActionSheet
        isOpen={showStartSheet}
        onClose={() => setShowStartSheet(false)}
        title="Välj starttid"
        options={timeOptions}
        onSelect={(id) => onStartTimeChange(id)}
      />

      <MobileActionSheet
        isOpen={showEndSheet}
        onClose={() => setShowEndSheet(false)}
        title="Välj sluttid"
        options={timeOptions}
        onSelect={(id) => onEndTimeChange(id)}
      />

      <MobileActionSheet
        isOpen={showBreakSheet}
        onClose={() => setShowBreakSheet(false)}
        title="Välj rast"
        options={breakOptions}
        onSelect={(id) => onBreakChange(id)}
      />
    </div>
  );
}

export default MobileTimePicker;
