export interface TeleconsultationRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  reason: string;
  status: 'pending' | 'cancelled' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'no show';
  createdAt: Date;
  updatedAt: Date;
  barangayId?: string;
  notes?: string;
  scheduledDate?: Date;
  meetingLink?: string;
  adminNotes?: string;
}

export interface TeleconsultationRequestFormData {
  reason: string;
}
