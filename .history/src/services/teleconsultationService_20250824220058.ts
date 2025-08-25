import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { TeleconsultationRequest } from '../types/teleconsultationRequests';

export class TeleconsultationService {
  private static instance: TeleconsultationService;

  public static getInstance(): TeleconsultationService {
    if (!TeleconsultationService.instance) {
      TeleconsultationService.instance = new TeleconsultationService();
    }
    return TeleconsultationService.instance;
  }

  /**
   * Fetches all teleconsultation requests for a specific user
   * @param userId The ID of the user
   * @returns Promise resolving to an array of TeleconsultationRequest objects
   */
  public async getUserTeleconsultationRequests(userId: string): Promise<TeleconsultationRequest[]> {
    const q = query(
      collection(db, 'teleconsultationRequests'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const requests: TeleconsultationRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userPhone: data.userPhone,
        userAddress: data.userAddress,
        userBarangay: data.userBarangay,
        preferredDate: data.preferredDate?.toDate(),
        preferredTime: data.preferredTime,
        symptoms: data.symptoms,
        additionalNotes: data.additionalNotes,
        status: data.status,
        requestDate: data.requestDate?.toDate(),
        confirmedDate: data.confirmedDate?.toDate(),
        completedDate: data.completedDate?.toDate(),
        doctorAssigned: data.doctorAssigned,
        meetingLink: data.meetingLink,
        notes: data.notes
      } as TeleconsultationRequest);
    });
    
    return requests.sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  }

  /**
   * Updates the status of a teleconsultation request
   * @param requestId The ID of the request to update
   * @param newStatus The new status to set
   * @returns Promise resolving when the update is complete
   */
  public async updateRequestStatus(requestId: string | undefined, newStatus: 'pending' | 'approved' | 'completed' | 'cancelled'): Promise<void> {
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    
    const requestRef = doc(db, 'teleconsultationRequests', requestId);
    
    const updateData: any = {
      status: newStatus,
      updatedAt: Timestamp.now()
    };
    
    if (newStatus === 'completed') {
      updateData.completedDate = Timestamp.now();
    }
    
    await updateDoc(requestRef, updateData);
  }

  /**
   * Fetches teleconsultation requests for a user filtered by status
   * @param userId The ID of the user
   * @param status The status to filter by
   * @returns Promise resolving to an array of filtered TeleconsultationRequest objects
   */
  public async getUserRequestsByStatus(userId: string, status: string): Promise<TeleconsultationRequest[]> {
    const allRequests = await this.getUserTeleconsultationRequests(userId);
    
    if (status === 'all') {
      return allRequests;
    }
    
    return allRequests.filter(request => request.status === status);
  }
}
