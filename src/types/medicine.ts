import { Timestamp } from 'firebase/firestore';

export interface AuditTrailEntry {
  action: string;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: Date;
}

export interface FirestoreAuditTrailEntry {
  action: string;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: Timestamp;
}
export interface Medicine {
  id?: string;
  medicine_name: string;
  dosage_form: string;
  strength: string;
  category: string;
  requires_prescription: boolean;
  description?: string;
  created_at: Date;
  expiration_date: Date;
  unit_name: string;
  conversion_factor: number;
  quantity: number;
  auditTrail?: AuditTrailEntry[];
}
