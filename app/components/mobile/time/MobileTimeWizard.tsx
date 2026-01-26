'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/http/fetcher';
import { MobileWizard, type WizardStep } from '../MobileWizard';
import { MobileProjectPicker, type Project } from './MobileProjectPicker';
import { MobileTimePicker } from './MobileTimePicker';
import { MobileOBSelector, type OBType } from './MobileOBSelector';
import { GloveFriendlyButton } from '../GloveFriendlyButton';
import { MobileCard } from '../MobileCard';

interface MobileTimeWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * MobileTimeWizard - Field-First Design System
 * 
 * 3-step wizard for time entry optimized for field workers:
 * - Step 1: Project Selection (MobileProjectPicker)
 * - Step 2: Time Entry (MobileTimePicker)
 * - Step 3: OB Type (MobileOBSelector)
 * 
 * After completion, shows summary with "Add Another" option.
 */
export function MobileTimeWizard({ onComplete, onCancel }: MobileTimeWizardProps) {
  const router = useRouter();
  
  // Form state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakDuration, setBreakDuration] = useState('30 min');
  const [obType, setObType] = useState<OBType>('work');
  
  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savedEntry, setSavedEntry] = useState<{
    projectName: string;
    date: string;
    hours: number;
    obType: OBType;
  } | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await apiFetch<{ projects?: Project[] }>('/api/projects/list');
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  // Calculate hours
  const calculateHours = () => {
    if (!startTime || !endTime) return 0;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const breakMinutes = breakDuration === '30 min' ? 30 : breakDuration === '60 min' ? 60 : 0;
    totalMinutes -= breakMinutes;
    
    return Math.max(0, totalMinutes / 60);
  };

  const hours = calculateHours();

  // Submit time entry
  const handleSubmit = async () => {
    if (!projectId) return;
    
    setSubmitting(true);
    
    try {
      const project = projects.find(p => p.id === projectId);
      
      await apiFetch('/api/time-entries', {
        method: 'POST',
        body: JSON.stringify({
          date,
          obType,
          startTime,
          endTime,
          breakDuration,
          projectId,
          hoursTotal: hours,
          obHours: obType.startsWith('ob-') ? hours : 0,
        }),
      });
      
      setSavedEntry({
        projectName: project?.name || 'Okänt projekt',
        date,
        hours,
        obType,
      });
      setCompleted(true);
      onComplete?.();
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Kunde inte spara tidrapporten. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset for new entry
  const handleAddAnother = () => {
    setProjectId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('07:00');
    setEndTime('16:00');
    setBreakDuration('30 min');
    setObType('work');
    setCurrentStep(0);
    setCompleted(false);
    setSavedEntry(null);
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard');
    }
  };

  // Completion screen
  if (completed && savedEntry) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="field-text-2xl mb-2">Tidrapport sparad!</h1>
          
          {/* Summary card */}
          <MobileCard className="mt-6 max-w-sm" status="success">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Projekt:</span>
                <span className="font-bold">{savedEntry.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Datum:</span>
                <span className="font-bold">{savedEntry.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timmar:</span>
                <span className="font-bold">{savedEntry.hours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Typ:</span>
                <span className="font-bold capitalize">{savedEntry.obType.replace('-', ' ')}</span>
              </div>
            </div>
          </MobileCard>
        </div>
        
        {/* Actions */}
        <div className="space-y-3 mt-6">
          <GloveFriendlyButton 
            variant="primary" 
            onClick={handleAddAnother}
            icon={Plus}
          >
            Lägg till fler timmar
          </GloveFriendlyButton>
          
          <GloveFriendlyButton 
            variant="secondary" 
            onClick={() => router.push('/dashboard')}
          >
            Klar
          </GloveFriendlyButton>
        </div>
      </div>
    );
  }

  // Wizard steps
  const steps: WizardStep[] = [
    {
      id: 'project',
      title: 'Välj projekt',
      subtitle: 'Vilket projekt arbetar du på?',
      isValid: !!projectId,
      component: (
        <MobileProjectPicker
          projects={projects}
          selectedId={projectId}
          onSelect={(id) => {
            setProjectId(id);
            // Auto-advance after selection
            setTimeout(() => setCurrentStep(1), 200);
          }}
          loading={loading}
        />
      ),
    },
    {
      id: 'time',
      title: 'Ange tid',
      subtitle: 'När arbetade du?',
      isValid: true, // Always valid as defaults are set
      component: (
        <MobileTimePicker
          date={date}
          onDateChange={setDate}
          startTime={startTime}
          onStartTimeChange={setStartTime}
          endTime={endTime}
          onEndTimeChange={setEndTime}
          breakDuration={breakDuration}
          onBreakChange={setBreakDuration}
        />
      ),
    },
    {
      id: 'obtype',
      title: 'Typ av tid',
      subtitle: 'Välj typ av arbetstid',
      isValid: true, // Always valid as default is set
      component: (
        <MobileOBSelector
          value={obType}
          onChange={setObType}
        />
      ),
    },
  ];

  return (
    <MobileWizard
      title="Tidrapportering"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onComplete={handleSubmit}
      onCancel={handleCancel}
      isLoading={submitting}
      completeLabel="Spara tidrapport"
      nextLabel="Nästa"
      backLabel="Tillbaka"
      cancelLabel="Avbryt"
    />
  );
}

export default MobileTimeWizard;
