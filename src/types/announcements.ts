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
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
  updatedByEmail?: string;
  updatedByName?: string;
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