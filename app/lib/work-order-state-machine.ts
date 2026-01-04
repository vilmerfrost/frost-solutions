// lib/work-order-state-machine.ts

export type WorkOrderStatus =
 | 'new'
 | 'assigned'
 | 'in_progress'
 | 'awaiting_approval'
 | 'approved'
 | 'completed';

export type WorkOrderPriority = 'critical' | 'high' | 'medium' | 'low';

export type Role = 'admin' | 'manager' | 'employee';

// Standard transitions (valid business flow)
const transitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
 new: ['assigned'],
 assigned: ['in_progress'],
 in_progress: ['awaiting_approval'],
 awaiting_approval: ['approved'],
 approved: ['completed'],
 completed: [] // terminal - no transitions allowed
};

// Role-based permissions (what each role can do)
const rolePermissions: Record<Role, Partial<Record<WorkOrderStatus, WorkOrderStatus[]>>> = {
 admin: {
  new: ['assigned'],
  assigned: ['in_progress', 'assigned', 'new'], // Admin can revert
  in_progress: ['awaiting_approval', 'in_progress', 'assigned'],
  awaiting_approval: ['approved', 'completed', 'in_progress'],
  approved: ['completed', 'approved'],
  completed: []
 },
 manager: {
  new: ['assigned'],
  assigned: ['in_progress', 'assigned'],
  in_progress: ['awaiting_approval', 'in_progress'],
  awaiting_approval: ['approved', 'in_progress'],
  approved: ['completed'],
  completed: []
 },
 employee: {
  new: [],
  assigned: ['in_progress'], // Employee can start work
  in_progress: ['awaiting_approval'], // Employee can mark as ready for approval
  awaiting_approval: [], // Cannot approve own work
  approved: [],
  completed: []
 }
};

export class WorkOrderStateMachine {
 /**
  * Returns valid next statuses for a given current status + role
  */
 static getValidTransitions(from: WorkOrderStatus, role: Role): WorkOrderStatus[] {
  const allowed = transitions[from] ?? [];
  const roleAllowed = rolePermissions[role]?.[from] ?? [];
  
  // Intersection: must be both valid in flow AND allowed by role
  return allowed.filter(s => roleAllowed.includes(s));
 }

 /**
  * Validate a transition is allowed
  */
 static isValidTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
  role: Role
 ): boolean {
  return this.getValidTransitions(from, role).includes(to);
 }

 /**
  * Get user-friendly error message if transition is invalid
  */
 static getTransitionError(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
  role: Role
 ): string | null {
  if (from === to) {
   return 'Status kan inte ändras till samma värde.';
  }

  const flowAllowed = (transitions[from] ?? []).includes(to);
  if (!flowAllowed) {
   return `Ogiltig statusövergång: '${from}' → '${to}'. Tillåtna övergångar: ${transitions[from]?.join(', ') || 'inga'}.`;
  }

  const roleAllowed = (rolePermissions[role]?.[from] ?? []).includes(to);
  if (!roleAllowed) {
   if (role === 'employee' && from === 'awaiting_approval') {
    return 'Du kan inte godkänna ditt eget arbete.';
   }
   if (role === 'employee' && from === 'completed') {
    return 'Arbetsorder är redan slutförd.';
   }
   if (role === 'manager' && from === 'approved' && to === 'completed') {
    return 'Endast administratörer kan markera som slutförd.';
   }
   return `Din roll (${role}) får inte genomföra övergången '${from}' → '${to}'.`;
  }

  return null;
 }
}

