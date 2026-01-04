export type QuoteStatus =
 | 'draft' | 'pending_approval' | 'approved' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'archived'

const transitions: Record<QuoteStatus, QuoteStatus[]> = {
 draft: ['pending_approval', 'archived'],
 pending_approval: ['approved', 'rejected', 'archived'],
 approved: ['sent', 'archived'],
 sent: ['viewed', 'expired', 'archived'],
 viewed: ['accepted', 'rejected', 'expired', 'archived'],
 accepted: ['archived'],
 rejected: ['archived'],
 expired: ['archived'],
 archived: []
}

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
 return transitions[from]?.includes(to) ?? false
}

