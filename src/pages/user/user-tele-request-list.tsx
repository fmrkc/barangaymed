import React, { useEffect, useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonLoading,
  IonButtons,
  IonBackButton,
  IonModal,
  IonButton,
  IonAlert,
} from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { getBarangayNameByCode, getZipCodeByBarangay } from '../../services/addressService';

const db = getFirestore();

const UserTeleRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'unsuccessful'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const userId = currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const q = query(
        collection(db, 'teleconsultationRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Loading timed out. Please try again.');
    }, 10000);

    const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
            clearTimeout(timeoutId);
            const reqs: TeleconsultationRequest[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const req: TeleconsultationRequest = {
                    id: doc.id,
                    userId: data.userId,
                    barangayId: data.barangayId,
                    userData: data.userData,
                    reason: data.reason,
                    status: data.status,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt ? (data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)) : undefined,
                    scheduledAt: data.scheduledAt ? (data.scheduledAt instanceof Timestamp ? data.scheduledAt.toDate() : new Date(data.scheduledAt)) : undefined,
                    notes: data.notes,
                    doctorId: data.doctorId,
                    meetingLink: data.meetingLink,
                };
                reqs.push(req);
            });
            setRequests(reqs);
            setLoading(false);
        },
        (err) => {
            clearTimeout(timeoutId);
            setError('Failed to fetch teleconsultation requests');
            setLoading(false);
        }
    );

    return () => {
        clearTimeout(timeoutId);
        unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    let filtered: TeleconsultationRequest[] = [];
    switch (filter) {
      case 'all':
        filtered = requests;
        break;
      case 'active':
        filtered = requests.filter((r) =>
          ['pending', 'accepted', 'scheduled'].includes(r.status)
        );
        break;
      case 'completed':
        filtered = requests.filter((r) => r.status === 'completed');
        break;
      case 'unsuccessful':
        filtered = requests.filter((r) =>
          ['rejected', 'cancelled', 'no show'].includes(r.status)
        );
        break;
    }
    setFilteredRequests(filtered);
  }, [filter, requests]);

  useEffect(() => {
    const resolveAddresses = async () => {
      const newResolvedAddresses: Record<string, string> = {};
      for (const request of requests) {
        if (request.userData) {
          const { lotBlkHouseNo, streetName, subdivisionVillageZonePurok, selectedCityMunicipality, selectedProvince, selectedRegion, barangayId, zipCode } = request.userData;
          let barangayName = '';
          if (barangayId) {
            barangayName = await getBarangayNameByCode(barangayId) || '';
          }
          let zip = zipCode || '';
          if (!zip && barangayId) {
            zip = await getZipCodeByBarangay(barangayId) || '';
          }
          const addressParts = [
            lotBlkHouseNo,
            streetName,
            subdivisionVillageZonePurok,
            barangayName,
            selectedCityMunicipality,
            selectedProvince,
            selectedRegion,
            zip
          ].filter(Boolean);
          newResolvedAddresses[request.id || ''] = addressParts.join(', ');
        }
      }
      setResolvedAddresses(newResolvedAddresses);
    };
    resolveAddresses();
  }, [requests]);

  const handleViewDetails = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleCancelRequest = async () => {
    if (!requestToCancel) return;
    try {
      const requestRef = doc(db, 'teleconsultationRequests', requestToCancel);
      await updateDoc(requestRef, {
        status: 'cancelled',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error cancelling request: ", error);
      setError("Failed to cancel the request.");
    }
    setRequestToCancel(null);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/dashboard/requests" />
          </IonButtons>
          <IonTitle>My Teleconsultation Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSegment value={filter} onIonChange={e => setFilter(e.detail.value as any)}>
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="active">
            <IonLabel>Active</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="unsuccessful">
            <IonLabel>Unsuccessful</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading && <IonLoading isOpen={loading} message="Loading requests..." />}
        {error && (
          <IonText color="danger" className="ion-padding">
            {error}
          </IonText>
        )}

        {!loading && !error && filteredRequests.length === 0 && (
          <IonText className="ion-padding">No requests found for this category.</IonText>
        )}

        <IonList>
          {filteredRequests.map((request) => (
            <IonCard key={request.id} style={{ borderLeft: `5px solid var(--ion-color-primary)`}}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Reason:</strong> {request.reason}</p>
                <p><strong>Created At:</strong> {request.createdAt ? request.createdAt.toLocaleString() : 'N/A'}</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                  {['pending', 'accepted', 'scheduled'].includes(request.status) && (
                    <IonButton color="danger" onClick={() => {
                      setRequestToCancel(request.id!);
                      setShowCancelAlert(true);
                    }}>Cancel</IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <p><strong>Status:</strong> {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                <p><strong>Created At:</strong> {selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</p>
                {selectedRequest.userData && (
                  <>
                    <p><strong>Name:</strong> {selectedRequest.userData.firstName} {selectedRequest.userData.middleName || ''} {selectedRequest.userData.lastName} {selectedRequest.userData.suffix || ''}</p>
                    <p><strong>Contact Number:</strong> {selectedRequest.userData.contactNumber || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedRequest.userData.email || 'N/A'}</p>
                    <p><strong>Address:</strong> {resolvedAddresses[selectedRequest.id || ''] || 'N/A'}</p>
                  </>
                )}
                {selectedRequest.scheduledAt && (
                  <p><strong>Scheduled At:</strong> {selectedRequest.scheduledAt.toLocaleString()}</p>
                )}
                {selectedRequest.notes && (
                  <p><strong>Notes:</strong> {selectedRequest.notes}</p>
                )}
                 {selectedRequest.meetingLink && (
                  <p><strong>Meeting Link:</strong> <a href={selectedRequest.meetingLink} target="_blank" rel="noopener noreferrer">{selectedRequest.meetingLink}</a></p>
                )}
              </>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header={'Confirm Cancellation'}
          message={'Are you sure you want to cancel this teleconsultation request?'}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => {
                setRequestToCancel(null);
              }
            },
            {
              text: 'Yes',
              handler: handleCancelRequest
            }
          ]}
        />
      </IonContent>
    </>
  );
};

export default UserTeleRequestList;
