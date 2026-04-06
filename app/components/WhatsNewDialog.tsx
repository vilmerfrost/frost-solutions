'use client';

import { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  Columns3,
  FolderOpen,
  HardHat,
  Users,
  Palette,
  CalendarDays,
  ShieldAlert,
  UserCheck,
  FileSignature,
  ClipboardList,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CURRENT_VERSION = '2.0';
const STORAGE_KEY = 'frost-whats-new-seen';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TOP_FEATURES: FeatureItem[] = [
  {
    icon: <Palette className="w-4 h-4" />,
    title: 'Ny design',
    description: 'Varmt amber-tema med förbättrad navigering',
  },
  {
    icon: <BarChart3 className="w-4 h-4" />,
    title: 'Rapporter & Analys',
    description: 'Lönsamhet, beläggning och kassaflöde i realtid',
  },
  {
    icon: <Columns3 className="w-4 h-4" />,
    title: 'ÄTA Kanban',
    description: 'Pipeline-vy med detaljpanel och granskningskedja',
  },
  {
    icon: <FolderOpen className="w-4 h-4" />,
    title: 'Dokumenthantering',
    description: 'BSAB-mappar, versionshantering och delning',
  },
  {
    icon: <HardHat className="w-4 h-4" />,
    title: 'Materialpriser',
    description: 'Sök, jämför och bevaka priser från leverantörer',
  },
  {
    icon: <Users className="w-4 h-4" />,
    title: 'Kundportal',
    description: 'Kunder kan logga in, se projekt och godkänna ÄTA',
  },
];

const MORE_FEATURES: FeatureItem[] = [
  {
    icon: <CalendarDays className="w-4 h-4" />,
    title: 'Schemaläggning',
    description: 'Veckoöversikt med konflikthantering',
  },
  {
    icon: <ShieldAlert className="w-4 h-4" />,
    title: 'Säkerhetsdashboard',
    description: 'Certifikat, incidenter och riskbedömningar',
  },
  {
    icon: <UserCheck className="w-4 h-4" />,
    title: 'Underentreprenörer',
    description: 'F-skatt-verifiering och betalningsöversikt',
  },
  {
    icon: <FileSignature className="w-4 h-4" />,
    title: 'Kontraktsmallar',
    description: 'AB04, ABT06 och konsumentmallar',
  },
  {
    icon: <ClipboardList className="w-4 h-4" />,
    title: 'Personalliggare',
    description: 'In- och utcheckning med exportfunktion',
  },
  {
    icon: <BrainCircuit className="w-4 h-4" />,
    title: 'AI-prediktioner',
    description: 'Smarta prognoser i lönsamhetsrapporter',
  },
];

export function WhatsNewDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== CURRENT_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Nyheter i Frost Solutions
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Version {CURRENT_VERSION} — April 2026
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature list */}
        <div className="px-5 pb-2 space-y-3 max-h-[60vh] overflow-y-auto">
          {TOP_FEATURES.map((feature) => (
            <div key={feature.title} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white flex-shrink-0">
                {feature.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">
                  {feature.title}
                </div>
                <div className="text-xs text-stone-400">
                  {feature.description}
                </div>
              </div>
            </div>
          ))}

          {/* Expandable section */}
          {!showMore && (
            <button
              onClick={() => setShowMore(true)}
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 transition-colors mx-auto pt-1"
            >
              <span>+ {MORE_FEATURES.length} fler nyheter</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {showMore && (
            <>
              {MORE_FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-lg bg-amber-600/80 flex items-center justify-center text-white flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">
                      {feature.title}
                    </div>
                    <div className="text-xs text-stone-400">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowMore(false)}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-400 transition-colors mx-auto pt-1"
              >
                <span>Visa färre</span>
                <ChevronUp className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="p-5 pt-3">
          <button
            onClick={handleDismiss}
            className="w-full bg-amber-600 hover:bg-amber-500 text-stone-900 font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            Utforska nyheterna
          </button>
        </div>
      </div>
    </div>
  );
}
