import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  TeleconsultationRequest, 
  TeleconsultationRequestStatus, 
  TeleconsultationRequestError, 
  TeleconsultationRequestErrorInfo 
} from '../types/teleconsultationRequests';
import { 
  executeWithRetry, 
  logFirestoreError, 
  FirestoreOperationError 
} from '../utils/firestoreErrorHandler';
import { logEvent } from '../utils/logger';

export class TeleconsultationRequestService {
  private static instance: TeleconsultationRequestService;
  private collectionRef = collection(db, 'teleconsultationRequests');

  public static getInstance(): TeleconsultationRequestService {
    if (!TeleconsultationRequestService.instance) {
      TeleconsultationRequestService.instance = new TeleconsultationRequestService();
    }
    return TeleconsultationRequestService.instance;
  }

  /**
   * Checks if a user is verified and can create teleconsultation requests
   */
  public async checkUserVerification(userId: string): Promise<boolean> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        logEvent('warn', `[TELECONSULTATION] User document not found`, { userId });
        return false;
      }

      const userData = userDoc.data();
      const isVerified = userData?.verificationStatus === 'verified';

      logEvent('info', `[TELECONSULTATION] User verification check`, {
        userId,
        isVerified,
        verificationStatus: userData?.verificationStatus
      });

      return isVerified;
    } catch (error) {
      logFirestoreError('checkUserVerification', error, { userId });
      return false;
    }
  }

  /**
   * Creates a new teleconsultation request with proper error handling and validation
   */
  public async createRequest(
    request: Omit<TeleconsultationRequest, 'id' | 'dateRequested' | 'status'>
  ): Promise<string> {
    const { userId } = request;

    // Check if user is verified
    const isVerified = await this.checkUserVerification(userId);
    if (!isVerified) {
      const errorInfo: TeleconsultationRequestErrorInfo = {
        type: TeleconsultationRequestError.USER_NOT_VERIFIED,
        message: 'User must be verified to create teleconsultation requests. Please complete your registration verification.',
        details: { userId }
      };
      throw new FirestoreOperationError(
        errorInfo.message,
        'permission-denied',
        false,
        { errorType: TeleconsultationRequestError.USER_NOT_VERIFIED }
      );
    }

    // Validate required fields
    if (!request.reason || request.reason.trim().length === 0) {
      const errorInfo: TeleconsultationRequestErrorInfo = {
        type: TeleconsultationRequestError.INVALID_DATA,
        message: 'Reason for request is required',
        details: { userId }
      };
      throw new FirestoreOperationError(
        errorInfo.message,
        'invalid-argument',
        false,
        { errorType: TeleconsultationRequestError.INVALID_DATA }
      );
    }

    // Sanitize and prepare request
    const newRequest = {
      ...request,
      notes: request.notes ?? "", // ✅ prevent undefined
      dateRequested: serverTimestamp(), // ✅ better than `new Date()`
      status: TeleconsultationRequestStatus.PENDING,
    };

    try {
      logEvent('info', `[TELECONSULTATION] Creating request`, {
        userId,
        reason: request.reason.substring(0, 100) + (request.reason.length > 100 ? '...' : '')
      });

      const result = await executeWithRetry(
        async () => {
          const docRef = await addDoc(this.collectionRef, newRequest);
          return docRef.id;
        },
        'createTeleconsultationRequest',
        { maxRetries: 3 },
        { userId, reason: request.reason }
      );

      logEvent('info', `[TELECONSULTATION] Request created successfully`, {
        userId,
        requestId: result
      });

      return result;
    } catch (error) {
      logFirestoreError('createTeleconsultationRequest', error, {
        userId,
        reason: request.reason
      });

      if (error instanceof FirestoreOperationError) {
        throw error;
      }

      const errorCode = (error && typeof error === 'object' && 'code' in error) 
        ? String(error.code) 
        : 'unknown';

      let errorType = TeleconsultationRequestError.UNKNOWN_ERROR;
      let errorMessage = 'Failed to create teleconsultation request. Please try again.';

      switch (errorCode) {
        case 'permission-denied':
          errorType = TeleconsultationRequestError.PERMISSION_DENIED;
          errorMessage = 'You do not have permission to create teleconsultation requests. Please contact support.';
          break;
        case 'unavailable':
        case 'deadline-exceeded':
          errorType = TeleconsultationRequestError.NETWORK_ERROR;
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'invalid-argument':
          errorType = TeleconsultationRequestError.INVALID_DATA;
          errorMessage = 'Invalid request data. Please check your input and try again.';
          break;
      }

      throw new FirestoreOperationError(
        errorMessage,
        errorCode,
        false,
        { errorType, originalError: error }
      );
    }
  }

  public async getRequestsByUser(userId: string): Promise<TeleconsultationRequest[]> {
    const q = query(this.collectionRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const requests: TeleconsultationRequest[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<TeleconsultationRequest, 'id'>;
      requests.push({ id: docSnap.id, ...data });
    });
    return requests;
  }

  public async updateRequestStatus(
    requestId: string, 
    status: TeleconsultationRequestStatus, 
    rejectionReason?: string
  ): Promise<void> {
    const docRef = doc(this.collectionRef, requestId);
    const updateData: Partial<TeleconsultationRequest> = { status };
    if (status === TeleconsultationRequestStatus.REJECTED && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    await updateDoc(docRef, updateData);
  }
}