import { UserData } from './users';

export interface MedicineRequest {
  id?: string;
  userId: string;
  barangayId: string;
  userData?: UserData;
  reason: string;
  hasPrescription: boolean;
  prescriptionUrl?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'processed' | 'scheduled' | 'completed' | 'cancelled' | 'no show' | 'pending completion';
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
  adminId?: string;
  scheduleDate?: Date;
  scheduleTime?: string;
  schedulePlace?: string;
  dispensedMedicines?: { [key: string]: number };
  processNote?: string;
  auditTrail?: { action: string; userId: string; userEmail: string; timestamp: Date }[];
}
