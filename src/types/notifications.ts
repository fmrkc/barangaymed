export interface Notification {
  id: string;
  userId: string;
  userEmail: string;
  type: 'status_change' | 'admin_note' | 'system' | 'announcement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
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
