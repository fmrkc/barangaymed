import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { TeleconsultationRequest, TeleconsultationRequestFormData } from '../types/teleconsultationRequests';
import { UserService } from './userService';

export class TeleconsultationService {
  private static instance: TeleconsultationService;

  public static getInstance(): TeleconsultationService {
    if (!TeleconsultationService.instance) {
      TeleconsultationService.instance = new TeleconsultationService();
    }
    return TeleconsultationService.instance;
  }

  /**
   * Creates a new teleconsultation request
   * @param userId The user ID making the request
   * @param formData The form data containing the reason
   * @returns Promise resolving to the created request ID
   */
  public async createRequest(
    userId: string,
    formData: TeleconsultationRequestFormData
  ): Promise<string> {
    try {
      const userService = UserService.getInstance();
      const userData = await userService.getUserData(userId);

      // Get user document to get email
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userEmail = userDoc.exists() ? userDoc.data()?.email || '' : '';

      const requestData: Omit<TeleconsultationRequest, 'id'> = {
        userId,
        userEmail,
        userName: `${userData.firstName} ${userData.lastName}`.trim(),
        reason: formData.reason,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        barangayId: userData.barangayId,
      };

      const docRef = await addDoc(
        collection(db, 'teleconsultationRequests'),
        {
          ...requestData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating teleconsultation request:', error);
      throw new Error('Failed to create teleconsultation request');
    }
  }

  /**
   * Gets all teleconsultation requests for a user
   * @param userId The user ID to get requests for
   * @returns Promise resolving to array of teleconsultation requests
   */
  public async getUserRequests(userId: string): Promise<TeleconsultationRequest[]> {
    try {
      // This would typically involve a query to get requests by userId
      // For now, return empty array as the full implementation would require
      // additional setup for querying by userId
      return [];
    } catch (error) {
      console.error('Error fetching user teleconsultation requests:', error);
      return [];
    }
  }
}
