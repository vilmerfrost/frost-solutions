// app/lib/featureFlags.ts

/**
 * Feature flags utility
 * Simple feature flag implementation for enabling/disabling features
 */

/**
 * Gets a feature flag value
 * @param flagName Name of the feature flag
 * @param defaultValue Default value if flag is not set (default: true)
 * @returns Feature flag value
 */
export function getFeatureFlag(flagName: string, defaultValue: boolean = true): boolean {
 // Check environment variable first
 const envValue = process.env[`FEATURE_${flagName.toUpperCase()}`];
 if (envValue !== undefined) {
  return envValue === 'true' || envValue === '1';
 }

 // Check localStorage (client-side only)
 if (typeof window !== 'undefined') {
  try {
   const stored = localStorage.getItem(`feature_${flagName}`);
   if (stored !== null) {
    return stored === 'true';
   }
  } catch (error) {
   console.warn('Error reading feature flag from localStorage:', error);
  }
 }

 // Return default value
 return defaultValue;
}

/**
 * Sets a feature flag value
 * @param flagName Name of the feature flag
 * @param value Value to set
 */
export function setFeatureFlag(flagName: string, value: boolean): void {
 if (typeof window !== 'undefined') {
  try {
   localStorage.setItem(`feature_${flagName}`, value.toString());
  } catch (error) {
   console.warn('Error setting feature flag in localStorage:', error);
  }
 }
}

