'use client';

import React, { useState, useMemo } from 'react';
import { Search, Building2, Check } from 'lucide-react';
import { MobileCard, MobileCardHeader } from '../MobileCard';

export interface Project {
  id: string;
  name: string;
  client?: string;
  address?: string;
}

interface MobileProjectPickerProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (projectId: string) => void;
  loading?: boolean;
}

/**
 * MobileProjectPicker - Field-First Design System
 * 
 * Vertical card list for project selection:
 * - 64px minimum height per card
 * - Search input at top (64px height)
 * - Project name + client visible
 * - Tap to select, auto-advances to next step
 */
export function MobileProjectPicker({
  projects,
  selectedId,
  onSelect,
  loading = false,
}: MobileProjectPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    
    const search = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.client?.toLowerCase().includes(search) ||
        p.address?.toLowerCase().includes(search)
    );
  }, [projects, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="field-input animate-pulse bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="field-card p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
        <input
          type="text"
          placeholder="Sök projekt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="field-input pl-14"
        />
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="field-card p-6 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="field-text">Inga projekt hittades</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-orange-600 font-semibold"
              >
                Rensa sökning
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isSelected = selectedId === project.id;
            
            return (
              <MobileCard
                key={project.id}
                onClick={() => onSelect(project.id)}
                selected={isSelected}
                className="min-h-[72px]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <MobileCardHeader
                      title={project.name}
                      subtitle={project.client || project.address}
                    />
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </MobileCard>
            );
          })
        )}
      </div>

      {/* Project count */}
      <p className="text-center text-sm text-gray-500">
        {filteredProjects.length} av {projects.length} projekt
      </p>
    </div>
  );
}

export default MobileProjectPicker;
