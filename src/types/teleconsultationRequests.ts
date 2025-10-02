export interface TeleconsultationRequest {
  id?: string;
  userId: string;
  barangayId: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no show';
  createdAt: Date;
  updatedAt?: Date;
  scheduledAt?: Date;
  notes?: string;
  doctorId?: string;
  meetingLink?: string;
}
