import { FieldValue, Timestamp } from "firebase-admin/firestore";

export interface Notification {
  id: string;
  userId: string;
  type: 'status_change' | 'admin_note' | 'system' | 'announcement' | 'new_announcement' | 'medicine_request_created' | 'medicine_request_status_update' | 'teleconsultation_request_created' | 'teleconsultation_request_status_update' | 'user_login' | 'user.medical_record.created' | 'user.medical_record.updated';
  title: string;
  message: string;
  timestamp: FieldValue | Timestamp;
  read: boolean;
  isShown: boolean;
  icon?: string; // Optional icon name from ionicons
  metadata?: {
    requestId?: string;
    oldStatus?: string;
    newStatus?: string;
    adminNotes?: string;
    medicineName?: string;
    announcementId?: string;
    announcementTitle?: string;
  };
}
