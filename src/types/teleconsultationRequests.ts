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

export enum TeleconsultationRequestError {
  USER_NOT_VERIFIED = 'USER_NOT_VERIFIED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_DATA = 'INVALID_DATA',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface TeleconsultationRequestErrorInfo {
  type: TeleconsultationRequestError;
  message: string;
  details?: any;
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
