export interface AnnouncementImage {
  url: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  barangayId: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  images?: AnnouncementImage[];
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  images?: File[];
}