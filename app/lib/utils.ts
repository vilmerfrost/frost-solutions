// app/lib/utils.ts

/**
 * Utility functions for className merging
 * Compatible with shadcn/ui pattern
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

