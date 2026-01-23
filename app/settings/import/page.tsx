'use client';

import React from 'react';
import Sidebar from '@/components/SidebarClient';
import { CSVUploader } from '@/components/import/CSVUploader';
import { FileUp, Database, ArrowRight, CheckCircle } from 'lucide-react';

export default function ImportPage() {
  const handleImportComplete = (result: { imported: number; total: number }) => {
    // Could refresh data or show additional UI here
    console.log('Import complete:', result);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="space-y-6 p-4 md:p-6 lg:p-10 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-500 rounded-lg shadow-md">
              <FileUp size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Importera från Bygglet
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Importera projekt, kunder, anställda och tidsrapporter från CSV-filer
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Så fungerar det
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Exportera från Bygglet</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ladda ner CSV-export från ditt nuvarande system
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Ladda upp här</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Dra och släpp filen eller klicka för att välja
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Granska & importera</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kontrollera datan och bekräfta importen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CSV Uploader */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <CSVUploader onImportComplete={handleImportComplete} />
          </div>

          {/* Supported Data Types */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Database size={20} />
              Datatyper som stöds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Projekt',
                  description: 'Namn, kund, budget, timpris, status, datum',
                  icon: '📁',
                },
                {
                  title: 'Tidsrapporter',
                  description: 'Datum, anställd, projekt, timmar, typ',
                  icon: '⏱️',
                },
                {
                  title: 'Anställda',
                  description: 'Namn, e-post, telefon, timpris, roll',
                  icon: '👤',
                },
                {
                  title: 'Kunder',
                  description: 'Företag, kontakt, adress, org.nummer',
                  icon: '🏢',
                },
                {
                  title: 'Fakturor',
                  description: 'Nummer, kund, belopp, datum, status',
                  icon: '📄',
                },
              ].map((type) => (
                <div
                  key={type.title}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{type.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">💡 Tips för en smidig import</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Importera i rätt ordning: Kunder → Anställda → Projekt → Tidsrapporter → Fakturor</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Kontrollera att CSV-filen är sparad i UTF-8 format för att svenska tecken ska fungera</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Ladda ner en mall först för att se rätt kolumnformat</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Dubbletter (samma namn/e-post) hoppas automatiskt över</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
