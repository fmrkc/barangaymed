export interface Announcement {
  id?: string;
  title: string;
  content: string;
  barangay: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
}
