export interface Notification {
  id: string;
  userId: string;
  userEmail: string;
  type: 'status_change' | 'admin_note' | 'system' | 'announcement' | 'new_announcement' | 'medicine_request_created' | 'medicine_request_status_update' | 'teleconsultation_request_created' | 'teleconsultation_request_status_update' | 'user_login';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  isShown: boolean;
  metadata: {
    requestId?: string;
    oldStatus?: string;
    newStatus?: string;
    adminNotes?: string;
    medicineName?: string;
    announcementId?: string;
    announcementTitle?: string;
  };
}

export interface NotificationFilters {
  read?: boolean;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
