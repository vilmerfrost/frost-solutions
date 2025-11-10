// app/lib/rot/rot-utils.ts
import * as crypto from 'crypto';

// --- Type Definitions ---
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Definition av data som behövs för ROT-avdrag. */
export interface RotData {
  personnummer: string;
  propertyId: string; // Fastighetsbeteckning eller Bostadsrättsföreningsorgnummer
  laborCost: number; // Arbetskostnad (inkl. moms)
  appliedDeduction: number; // Begärt avdragsbelopp
}

/** Resultat av en valideringsfunktion. */
type ValidationResult = Result<true, string>; // Error är en sträng med felmeddelandet

// --- Validation Helpers ---
/**
 * @function isValidSwedishId
 * Validerar ett svenskt personnummer (starkt format).
 * @param pnr - Personnummer (ÅÅÅÅMMDD-XXXX eller ÅÅMMDD-XXXX).
 * @returns {ValidationResult} - True om giltigt, annars felmeddelande.
 */
export function isValidSwedishId(pnr: string): ValidationResult {
  const cleaned = pnr.replace(/[\s-]/g, '');
  
  // Must be 10 or 12 digits
  if (!/^\d{10}$|^\d{12}$/.test(cleaned)) {
    return { ok: false, error: 'Ogiltigt format på personnummer.' };
  }
  
  // Use last 10 digits for validation
  const digits = cleaned.slice(-10);
  
  // Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(digits[i], 10);
    
    // Double every other digit
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  const checksum = parseInt(digits[9], 10);
  const isValid = (sum + checksum) % 10 === 0;
  
  if (!isValid) {
    return { ok: false, error: 'Personnummer failerar Luhn-algoritm validering.' };
  }
  
  return { ok: true, value: true };
}

/**
 * @function isRotEligible
 * Kontrollerar grundläggande behörighet för ROT.
 * @param laborCost - Arbetskostnaden.
 * @param deduction - Det begärda avdraget.
 * @returns {ValidationResult}
 */
export function isRotEligible(laborCost: number, deduction: number): ValidationResult {
  if (laborCost <= 0) {
    return { ok: false, error: 'Arbetskostnaden måste vara positiv.' };
  }
  
  // Max avdrag är 30% av arbetskostnaden (för 2025, kan vara 50% efter maj)
  const maxDeduction = laborCost * 0.30; 
  
  if (deduction > maxDeduction + 0.01) { // 0.01 tolerans
    return { ok: false, error: `Begärt avdrag (${deduction}) överskrider maximalt tillåtet (${maxDeduction}).` };
  }
  
  return { ok: true, value: true };
}

// --- Calculation Utilities ---
/**
 * @function calculateMaxDeduction
 * Beräknar maximalt ROT-avdrag för en given arbetskostnad.
 * @param laborCost - Arbetskostnad (inkl. moms).
 * @returns Maximalt avdragsbelopp, avrundat till närmaste heltal.
 */
export function calculateMaxDeduction(laborCost: number): number {
  return Math.floor(laborCost * 0.30);
}

// --- Formatting Utilities ---
/**
 * @function toSkatteverketAmount
 * Formaterar ett belopp till strängformatet Skatteverket kräver (heltal i öre).
 * @param amount - Belopp i SEK.
 * @returns Belopp i öre som sträng, t.ex. 12500.50 -> "1250050"
 */
export function toSkatteverketAmount(amount: number): string {
  // Multiplicera med 100 och avrunda för att hantera flyttalsprecision
  const amountInOre = Math.round(amount * 100);
  return amountInOre.toString();
}

// --- XML Generation Helper (Simplified) ---
/**
 * @function generateRotXmlSnippet
 * Genererar en XML-snutt för en enskild begäran (förenklat för Skatteverket).
 * @param data - RotData-objektet.
 * @param requestDate - Datum för begäran.
 * @returns XML-sträng för begäran.
 */
export function generateRotXmlSnippet(data: RotData, requestDate: Date): string {
  // Använd toSkatteverketAmount för att säkerställa korrekt format
  const deductionOre = toSkatteverketAmount(data.appliedDeduction);
  const laborOre = toSkatteverketAmount(data.laborCost);
  const dateStr = requestDate.toISOString().split('T')[0];
  
  return `
  <Request>
    <PayerId>${data.personnummer.replace(/-/g, '')}</PayerId>
    <PropertyId>${data.propertyId}</PropertyId>
    <RequestDate>${dateStr}</RequestDate>
    <AppliedDeductionOre>${deductionOre}</AppliedDeductionOre>
    <LaborCostOre>${laborOre}</LaborCostOre>
  </Request>`;
}

