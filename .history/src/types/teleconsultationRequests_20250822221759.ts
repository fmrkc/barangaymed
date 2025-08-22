export interface TeleconsultationRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userBarangay: string;
  preferredDate: Date;
  preferredTime: string;
  symptoms: string;
  additionalNotes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  requestDate: Date;
  confirmedDate?: Date;
  completedDate?: Date;
  doctorAssigned?: string;
  meetingLink?: string;
  notes?: string;
}

export interface ConsultationType {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
}
