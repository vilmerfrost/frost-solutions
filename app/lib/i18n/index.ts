// app/lib/i18n/index.ts

/**
 * i18n Hook and Utilities
 * Based on Claude implementation
 */

'use client';

import { sv } from './locales/sv';

type Locale = 'sv';
const defaultLocale: Locale = 'sv';

const translations = {
  sv,
};

/**
 * Get translation value by key path
 * Example: t('ocr.upload.title') => 'Ladda upp dokument'
 */
export function useTranslation(locale: Locale = defaultLocale) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace params
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || '';
      });
    }

    return value;
  };

  return { t };
}

/**
 * Format Swedish date (DD.MM.YYYY)
 */
export function formatDate(date: Date | string, locale: Locale = defaultLocale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (locale === 'sv') {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
  
  return d.toLocaleDateString();
}

/**
 * Format Swedish currency (1 234,56 SEK)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'SEK',
  locale: Locale = defaultLocale
): string {
  if (locale === 'sv') {
    return `${amount.toLocaleString('sv-SE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format Swedish number
 */
export function formatNumber(value: number, locale: Locale = defaultLocale): string {
  if (locale === 'sv') {
    return value.toLocaleString('sv-SE');
  }
  
  return value.toLocaleString();
}

