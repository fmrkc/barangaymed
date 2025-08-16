export interface Notification {
  id: string;
  userId: string;
  userEmail: string;
  type: 'status_change' | 'admin_note' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  medicineId: string;
  metadata: {
    requestId?: string;
    oldStatus?: string;
    newStatus?: string;
    adminNotes?: string;
    medicineName?: string;
  };
}

export interface NotificationFilters {
  read?: boolean;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
