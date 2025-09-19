export enum TeleconsultationRequestStatus {
  PENDING = 'Pending',
  CANCELLED = 'Cancelled',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  UNDER_REVIEW = 'Under Review',
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  NO_SHOW = 'No Show'
}

export interface TeleconsultationRequest {
  id: string;
  userId: string;
  userData: {
    firstName: string;
    lastName: string;
    contactNumber?: string;
    email?: string;
  };
  reason: string;
  notes?: string;
  dateRequested: Date;
  status: TeleconsultationRequestStatus;
  rejectionReason?: string;
  scheduledDate?: Date;
  completedDate?: Date;
}
