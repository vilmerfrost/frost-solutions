// app/lib/featureFlags.ts

/**
 * Feature flags utility
 * Simple feature flag implementation for enabling/disabling features
 */

/**
 * Gets a feature flag value
 * Supports both simple usage: getFeatureFlag('flagName')
 * And tenant-aware usage: getFeatureFlag(tenantId, 'flagName')
 * @param tenantIdOrFlagName Either the tenant ID (if two args) or flag name (if one arg)
 * @param flagNameOrDefault Either the flag name (if two args) or default value (if one arg)
 * @param defaultValue Default value if flag is not set (default: true)
 * @returns Feature flag value
 */
export async function getFeatureFlag(
 tenantIdOrFlagName: string,
 flagNameOrDefault?: string | boolean,
 defaultValue: boolean = true
): Promise<boolean> {
 // Determine which calling convention is being used
 let flagName: string;
 let defValue: boolean = defaultValue;
 
 if (typeof flagNameOrDefault === 'string') {
  // Two-arg tenant-aware call: getFeatureFlag(tenantId, flagName)
  // tenantId is ignored for now (could be used for per-tenant flags later)
  flagName = flagNameOrDefault;
 } else {
  // One-arg simple call: getFeatureFlag(flagName) or getFeatureFlag(flagName, defaultValue)
  flagName = tenantIdOrFlagName;
  if (typeof flagNameOrDefault === 'boolean') {
   defValue = flagNameOrDefault;
  }
 }
 
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
 return defValue;
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

