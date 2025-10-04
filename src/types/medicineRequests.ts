import { UserData } from './users';

export interface MedicineRequest {
  id?: string;
  userId: string;
  barangayId: string;
  userData?: UserData;
  reason: string;
  hasPrescription: boolean;
  prescriptionUrl?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no show' | 'pending completion';
  createdAt: Date;
  updatedAt?: Date;
  notes?: string;
  adminId?: string;
}
