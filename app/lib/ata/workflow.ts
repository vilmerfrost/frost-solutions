/**
 * ÄTA Legal Fortress — state machine and validation
 *
 * Workflow:
 *   created → admin_reviewed → approval_sent → customer_approved → work_completed → invoice_generated
 *
 * Unforeseen ÄTA requires at least 1 photo before it can be reviewed.
 */

export const ATA_STATUSES = [
  'created',
  'admin_reviewed',
  'approval_sent',
  'customer_approved',
  'customer_rejected',
  'work_completed',
  'invoice_generated',
] as const

export type AtaStatus = (typeof ATA_STATUSES)[number]

const VALID_TRANSITIONS: Record<string, AtaStatus[]> = {
  created: ['admin_reviewed'],
  admin_reviewed: ['approval_sent'],
  approval_sent: ['customer_approved', 'customer_rejected'],
  customer_approved: ['work_completed'],
  customer_rejected: [],          // terminal unless re-sent
  work_completed: ['invoice_generated'],
  invoice_generated: [],          // terminal
}

export function canTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed) return false
  return allowed.includes(to as AtaStatus)
}

export function getNextStatuses(current: string): AtaStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}

export interface AtaValidationContext {
  ataType: 'foreseen' | 'unforeseen'
  photoCount: number
}

/**
 * Validates that an unforeseen ÄTA has at least one photo before review.
 */
export function validateForReview(ctx: AtaValidationContext): { valid: boolean; error?: string } {
  if (ctx.ataType === 'unforeseen' && ctx.photoCount < 1) {
    return { valid: false, error: 'Unforeseen ÄTA requires at least 1 photo before review' }
  }
  return { valid: true }
}

/**
 * Full transition validation: checks both state machine and business rules.
 */
export function validateTransition(
  from: string,
  to: string,
  ctx?: AtaValidationContext
): { valid: boolean; error?: string } {
  if (!canTransition(from, to)) {
    return { valid: false, error: `Invalid transition from "${from}" to "${to}"` }
  }

  // Business rules for specific transitions
  if (to === 'admin_reviewed' && ctx) {
    return validateForReview(ctx)
  }

  return { valid: true }
}
