// app/lib/obCalculation.ts

/**
 * OB (Overtime/Premium) calculation utilities
 * Handles calculation of hours and amounts for different OB types
 */

/**
 * OB time split interface
 */
export interface OBTimeSplit {
 regular: number; // Regular hours (06:00-18:00 weekday) - 1.0x
 evening: number; // Evening hours (18:00-22:00 weekday) - 1.5x
 night: number;  // Night hours (22:00-06:00 weekday) - 1.5x
 weekend: number; // Weekend hours (all day Saturday/Sunday) - 2.0x
 total: number;  // Total hours
}

/**
 * Calculates OB hours split based on start time, end time, and date
 * @param startTime Start time in HH:MM format
 * @param endTime End time in HH:MM format
 * @param date Date object for determining weekday/weekend
 * @returns OBTimeSplit with hours for each OB type
 */
export function calculateOBHours(startTime: string, endTime: string, date: Date): OBTimeSplit {
 const split: OBTimeSplit = {
  regular: 0,
  evening: 0,
  night: 0,
  weekend: 0,
  total: 0,
 };

 // Parse times
 const [startHour, startMin] = startTime.split(':').map(Number);
 const [endHour, endMin] = endTime.split(':').map(Number);

 const startMinutes = startHour * 60 + startMin;
 const endMinutes = endHour * 60 + endMin;

 // Check if it's weekend
 const dayOfWeek = date.getDay();
 const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6

 // Calculate total duration in minutes
 let totalMinutes = endMinutes - startMinutes;
 if (totalMinutes < 0) {
  totalMinutes += 24 * 60; // Handle overnight
 }

 if (isWeekend) {
  // Weekend: All hours are weekend hours (2.0x)
  split.weekend = totalMinutes / 60;
 } else {
  // Weekday: Split by time periods
  // Regular: 06:00-18:00 (1.0x)
  // Evening: 18:00-22:00 (1.5x)
  // Night: 22:00-06:00 (1.5x)

  const regularStart = 6 * 60; // 06:00
  const regularEnd = 18 * 60; // 18:00
  const eveningStart = 18 * 60; // 18:00
  const eveningEnd = 22 * 60; // 22:00
  const nightEnd = 6 * 60; // 06:00 (next day)

  // Handle overnight spans
  if (endMinutes < startMinutes) {
   // Spans midnight
   // Part before midnight
   const beforeMidnight = 24 * 60 - startMinutes;
   // Part after midnight
   const afterMidnight = endMinutes;

   // Calculate regular hours (before midnight)
   if (startMinutes < regularStart) {
    // Starts before 06:00 - night hours
    if (startMinutes < eveningEnd) {
     const nightEndHere = Math.min(eveningEnd, 24 * 60);
     split.night += (nightEndHere - startMinutes) / 60;
     if (nightEndHere < 24 * 60) {
      split.evening += Math.min(eveningEnd - nightEndHere, beforeMidnight) / 60;
     }
    }
   } else if (startMinutes < eveningStart) {
    // Regular hours
    split.regular += Math.min(regularEnd - startMinutes, beforeMidnight) / 60;
    if (regularEnd < 24 * 60) {
     split.evening += Math.min(eveningEnd - regularEnd, beforeMidnight - (regularEnd - startMinutes)) / 60;
    }
   } else if (startMinutes < eveningEnd) {
    // Evening hours
    split.evening += Math.min(eveningEnd - startMinutes, beforeMidnight) / 60;
   }

   // After midnight
   if (afterMidnight <= nightEnd) {
    split.night += afterMidnight / 60;
   } else if (afterMidnight <= regularEnd) {
    split.night += nightEnd / 60;
    split.regular += (afterMidnight - nightEnd) / 60;
   } else {
    split.night += nightEnd / 60;
    split.regular += (regularEnd - nightEnd) / 60;
    split.evening += Math.min(eveningEnd - regularEnd, afterMidnight - regularEnd) / 60;
   }
  } else {
   // Same day
   let currentMin = startMinutes;

   while (currentMin < endMinutes) {
    if (currentMin >= regularStart && currentMin < regularEnd) {
     // Regular hours
     const regularEndHere = Math.min(regularEnd, endMinutes);
     split.regular += (regularEndHere - currentMin) / 60;
     currentMin = regularEndHere;
    } else if (currentMin >= eveningStart && currentMin < eveningEnd) {
     // Evening hours
     const eveningEndHere = Math.min(eveningEnd, endMinutes);
     split.evening += (eveningEndHere - currentMin) / 60;
     currentMin = eveningEndHere;
    } else if (currentMin >= eveningEnd || currentMin < regularStart) {
     // Night hours (22:00-06:00)
     let nightEndHere: number;
     if (currentMin >= eveningEnd) {
      nightEndHere = Math.min(24 * 60, endMinutes);
     } else {
      nightEndHere = Math.min(regularStart, endMinutes);
     }
     split.night += (nightEndHere - currentMin) / 60;
     currentMin = nightEndHere;
    } else {
     // Should not happen, but break to avoid infinite loop
     break;
    }
   }
  }
 }

 // Calculate total
 split.total = split.regular + split.evening + split.night + split.weekend;

 return split;
}

/**
 * Calculates total amount based on OB hours and base rate
 * @param obSplit OB time split
 * @param baseRate Base hourly rate in SEK
 * @returns Total amount in SEK
 */
export function calculateTotalAmount(obSplit: OBTimeSplit, baseRate: number): number {
 const regularAmount = obSplit.regular * baseRate * 1.0; // 1.0x
 const eveningAmount = obSplit.evening * baseRate * 1.5; // 1.5x
 const nightAmount = obSplit.night * baseRate * 1.5; // 1.5x
 const weekendAmount = obSplit.weekend * baseRate * 2.0; // 2.0x

 return regularAmount + eveningAmount + nightAmount + weekendAmount;
}

