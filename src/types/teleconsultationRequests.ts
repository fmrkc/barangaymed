import { UserData } from './users';

export interface MedicalRecord {
  symptoms: string[];
  conditions: string[];
  allergies: string[];
  historyFiles: {
    fileName: string;
    fileURL: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeleconsultationRequest {
  id?: string;
  userId: string;
  barangayId: string;
  userData?: UserData;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no show' | 'pending completion';
  createdAt: Date;
  updatedAt?: Date;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  meetingLink?: string;
  superadminMarkedComplete?: boolean;
  medicalRecord?: MedicalRecord;
}
