// app/lib/timeRounding.ts

import type { OBTimeSplit } from './obCalculation';

/**
 * Rounds OB time split to nearest 0.5 hours
 * Ensures minimum 0.5 hours per category if any time exists
 * @param obSplit OB time split to round
 * @returns Rounded OB time split
 */
export function roundOBTimeSplit(obSplit: OBTimeSplit): OBTimeSplit {
 const rounded: OBTimeSplit = {
  regular: Math.round(obSplit.regular * 2) / 2, // Round to nearest 0.5
  evening: Math.round(obSplit.evening * 2) / 2,
  night: Math.round(obSplit.night * 2) / 2,
  weekend: Math.round(obSplit.weekend * 2) / 2,
  total: 0,
 };

 // Ensure minimum 0.5 hours if any time exists in a category
 if (obSplit.regular > 0 && rounded.regular < 0.5) {
  rounded.regular = 0.5;
 }
 if (obSplit.evening > 0 && rounded.evening < 0.5) {
  rounded.evening = 0.5;
 }
 if (obSplit.night > 0 && rounded.night < 0.5) {
  rounded.night = 0.5;
 }
 if (obSplit.weekend > 0 && rounded.weekend < 0.5) {
  rounded.weekend = 0.5;
 }

 // Recalculate total
 rounded.total = rounded.regular + rounded.evening + rounded.night + rounded.weekend;

 return rounded;
}

