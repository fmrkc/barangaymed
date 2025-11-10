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
  barangayName?: string;
  userData?: UserData;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no show';
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
    rejectionReason?: string;
    cancellationReason?: string;
    prescriptionUrl?: string;
    medicalRecord?: MedicalRecord;
    auditTrail?: { action: string; userId: string; userEmail: string; userName?: string; timestamp: Date }[];
    uploadedFile?: { url: string; name: string; };
  isShown?: boolean;
}
