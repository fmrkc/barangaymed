import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonButtons,
  IonButton,
  IonModal,
} from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { refreshOutline } from 'ionicons/icons';

interface UserData {
  barangayId: string;
  contactNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  lotBlkHouseNo: string;
  middleName: string;
  selectedCityMunicipality: string;
  selectedProvince: string;
  selectedRegion: string;
  streetName: string;
  subdivisionVillageZonePurok: string;
  suffix: string;
  zipCode: string;
  userId: string;
}

interface TeleconsultationRequest {
  id: string;
  barangayId: string;
  createdAt: Timestamp;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  userData: UserData;
  // Add other fields as they become relevant, e.g., 'teleconsultationDate', 'teleconsultationLink'
}

const UserTeleList: React.FC = () => {
  const { currentUser, barangayId } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);

  const db = getFirestore();

  const fetchRequests = async () => {
    if (!currentUser || !currentUser.uid || !barangayId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'teleconsultationRequests'),
      where('userId', '==', currentUser.uid),
      where('barangayId', '==', barangayId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests: TeleconsultationRequest[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeleconsultationRequest[];
      setRequests(fetchedRequests);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching teleconsultation requests:', error);
      setLoading(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribePromise = fetchRequests();
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [currentUser, barangayId]);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchRequests();
    event.detail.complete();
  };

  const openModal = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Teleconsultation Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing...">
          </IonRefresherContent>
        </IonRefresher>

        <IonLoading isOpen={loading} message={'Loading requests...'} />

        {requests.length === 0 && !loading ? (
          <IonText className="ion-padding">
            <p>No teleconsultation requests found.</p>
          </IonText>
        ) : (
          <IonList>
            {requests.map((request) => (
              <IonCard key={request.id} onClick={() => openModal(request)}>
                <IonCardHeader>
                  <IonCardSubtitle>Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</IonCardSubtitle>
                  <IonCardTitle>{request.reason.substring(0, 50)}{request.reason.length > 50 ? '...' : ''}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Requested on: {format(request.createdAt.toDate(), 'PPP p')}</p>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        <IonModal isOpen={showModal} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeModal}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <IonText>
                  <h2>Reason:</h2>
                  <p>{selectedRequest.reason}</p>
                  <h2>Status:</h2>
                  <p>{selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}</p>
                  <h2>Requested On:</h2>
                  <p>{format(selectedRequest.createdAt.toDate(), 'PPP p')}</p>
                  {/* Add more details here as needed */}
                </IonText>
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default UserTeleList;
