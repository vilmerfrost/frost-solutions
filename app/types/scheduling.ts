// types/scheduling.ts
export type ScheduleStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
export type ShiftType = 'day' | 'night' | 'evening' | 'weekend' | 'other';

export interface ScheduleSlot {
 id: string;
 tenant_id: string;
 employee_id: string;
 project_id: string;
 start_time: string; // ISO
 end_time: string;  // ISO
 status: ScheduleStatus;
 shift_type?: ShiftType; // Type of shift
 transport_time_minutes?: number; // Transport time in minutes
 notes?: string | null;
 created_at: string;
 updated_at: string;
 created_by: string;
 // Extended fields for UI (populated from joins)
 employee_name?: string;
 project_name?: string;
 has_conflict?: boolean; // Conflict indicator from conflict check
}

export type AbsenceType = 'vacation' | 'sick' | 'other';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';
export interface Absence {
 id: string;
 tenant_id: string;
 employee_id: string;
 start_date: string; // YYYY-MM-DD
 end_date: string;  // YYYY-MM-DD
 type: AbsenceType;
 status: AbsenceStatus;
 reason?: string | null;
 created_at: string;
 updated_at: string;
}

export interface CreateScheduleRequest {
 employee_id: string;
 project_id: string;
 start_time: string;
 end_time: string;
 status?: ScheduleStatus;
 shift_type?: ShiftType;
 transport_time_minutes?: number;
 notes?: string;
}

export interface UpdateScheduleRequest {
 start_time?: string;
 end_time?: string;
 status?: ScheduleStatus;
 shift_type?: ShiftType;
 transport_time_minutes?: number;
 notes?: string;
 employee_id?: string; // Allow changing employee on drag
 project_id?: string; // Allow changing project
}

export interface ConflictCheckRequest {
 employee_id: string;
 start_time: string;
 end_time: string;
 exclude_id?: string;
}

export interface ConflictCheckResponse {
 hasConflict: boolean;
 conflicts: Array<Pick<ScheduleSlot, 'id' | 'start_time' | 'end_time' | 'status'>>;
}

export interface ScheduleFilters {
 employee_id?: string;
 project_id?: string;
 status?: ScheduleStatus;
 start_date?: string; // YYYY-MM-DD format
 end_date?: string;  // YYYY-MM-DD format
}

export interface TimeEntry {
 id: string;
 tenant_id: string;
 employee_id: string;
 project_id: string;
 date: string;
 hours: number;
 description?: string | null;
 source_schedule_id?: string | null;
 is_auto_generated: boolean;
 status: 'draft' | 'submitted' | 'approved' | 'invoiced';
 created_at: string;
 updated_at: string;
}

