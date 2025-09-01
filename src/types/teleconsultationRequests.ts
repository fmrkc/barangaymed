export interface TeleconsultationRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  barangayId: string;
  preferredDate: Date;
  preferredTime: string;
  symptoms: string;
  additionalNotes?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  requestDate: Date;
  confirmedDate?: Date;
  completedDate?: Date;
  doctorAssigned?: string;
  meetingLink?: string;
  notes?: string;
}
