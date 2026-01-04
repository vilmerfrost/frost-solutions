// app/lib/ai/common.ts
import { NextResponse } from 'next/server';
import { extractErrorMessage } from '@/lib/errorUtils';

export const runtime = 'nodejs';

export function ok<T>(data: T) {
 return NextResponse.json({ success: true, ...data }, { status: 200 });
}

export function fail(e: unknown, fallbackMsg = 'Något gick fel.') {
 const detail = extractErrorMessage(e);
 return NextResponse.json({ success: false, error: fallbackMsg, detail }, { status: 500 });
}

