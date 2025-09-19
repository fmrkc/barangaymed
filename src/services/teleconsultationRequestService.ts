import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { TeleconsultationRequest, TeleconsultationRequestStatus } from '../types/teleconsultationRequests';

export class TeleconsultationRequestService {
  private static instance: TeleconsultationRequestService;
  private collectionRef = collection(db, 'teleconsultationRequests');

  public static getInstance(): TeleconsultationRequestService {
    if (!TeleconsultationRequestService.instance) {
      TeleconsultationRequestService.instance = new TeleconsultationRequestService();
    }
    return TeleconsultationRequestService.instance;
  }

  public async createRequest(request: Omit<TeleconsultationRequest, 'id' | 'dateRequested' | 'status'>): Promise<string> {
    const newRequest = {
      ...request,
      dateRequested: new Date(),
      status: TeleconsultationRequestStatus.PENDING,
    };
    const docRef = await addDoc(this.collectionRef, newRequest);
    return docRef.id;
  }

  public async getRequestsByUser(userId: string): Promise<TeleconsultationRequest[]> {
    const q = query(this.collectionRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const requests: TeleconsultationRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<TeleconsultationRequest, 'id'>;
      requests.push({ id: doc.id, ...data });
    });
    return requests;
  }

  public async updateRequestStatus(requestId: string, status: TeleconsultationRequestStatus, rejectionReason?: string): Promise<void> {
    const docRef = doc(this.collectionRef, requestId);
    const updateData: Partial<TeleconsultationRequest> = { status };
    if (status === TeleconsultationRequestStatus.REJECTED && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    await updateDoc(docRef, updateData);
  }
}
