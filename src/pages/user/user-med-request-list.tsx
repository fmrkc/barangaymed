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
  IonItem,
  IonItemDivider,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';

const db = getFirestore();

const UserMedRequestList: React.FC = () => {
  const { currentUser, verificationStatus } = useAuth();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MedicineRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'completed' | 'unsuccessful' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const userId = currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    if (verificationStatus !== 'verified') {
      setError('You must be a verified resident to view medicine requests.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
        collection(db, 'medicineRequests'),
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
            console.log("Data received from Firestore. Number of documents:", querySnapshot.size);
            clearTimeout(timeoutId);
            setLoading(false); // Just stop loading, do nothing else.
            const reqs: MedicineRequest[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const req: MedicineRequest = {
                    id: doc.id,
                    userId: data.userId,
                    barangayId: data.barangayId,
                    userData: data.userData,
                    reason: data.reason,
                    hasPrescription: data.hasPrescription,
                    prescriptionUrl: data.prescriptionUrl,
                    status: data.status,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt ? (data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)) : undefined,
                    notes: data.notes,
                    adminId: data.adminId,
                    scheduleDate: data.scheduleDate ? (data.scheduleDate instanceof Timestamp ? data.scheduleDate.toDate() : new Date(data.scheduleDate)) : undefined,
                    scheduleTime: data.scheduleTime,
                    schedulePlace: data.schedulePlace,
                    dispensedMedicines: data.dispensedMedicines,
                    processNote: data.processNote,
                };
                reqs.push(req);
            });
            setRequests(reqs);
            setLoading(false);
        },
                    (err) => {
                        clearTimeout(timeoutId);
                        console.error("Firestore error fetching medicine requests:", err);
                        setError('Failed to fetch medicine requests');
                        setLoading(false);
                    }    );

    return () => {
        clearTimeout(timeoutId);
        unsubscribe();
    };
  }, [userId, verificationStatus]);


  useEffect(() => {
    let filtered: MedicineRequest[] = [];
    switch (filter) {
      case 'all':
        filtered = requests;
        break;
      case 'pending':
        filtered = requests.filter((r) => r.status === 'pending');
        break;
      case 'active':
        filtered = requests.filter((r) =>
          ['accepted', 'scheduled', 'pending completion'].includes(r.status)
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

  const handleViewDetails = (request: MedicineRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleCancelRequest = async () => {
    if (!requestToCancel) return;
    try {
      const requestRef = doc(db, 'medicineRequests', requestToCancel);
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

  const handleRefresh = async (event: CustomEvent) => {
    setLoading(true);
    // Simulate refresh delay to show loading
    setTimeout(() => {
      setLoading(false);
      event.detail.complete();
    }, 1500);
  };

  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false);
  const [requestToMarkComplete, setRequestToMarkComplete] = useState<string | null>(null);

  const handleMarkAsComplete = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'medicineRequests', requestId);
      await updateDoc(requestRef, {
        status: 'completed',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error marking request as complete: ", error);
      setError("Failed to mark the request as complete.");
    }
  };

  const confirmMarkAsComplete = (requestId: string) => {
    setRequestToMarkComplete(requestId);
    setShowMarkCompleteAlert(true);
  };

  return (
    <>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/dashboard/requests" />
          </IonButtons>
          <IonTitle>My Medicine Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>

        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonSegment scrollable value={filter} onIonChange={e => setFilter(e.detail.value as any)}>
          <IonSegmentButton value="pending">
            <IonLabel>Pending</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="active">
            <IonLabel>Active</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="unsuccessful">
            <IonLabel>Not Completed</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading && <IonLoading isOpen={loading} message="Loading requests..." />}
        {error && (
          <IonText color="danger" className="ion-padding">
            {error}
          </IonText>
        )}

        {!loading && !error && filteredRequests.length === 0 && (
          <IonCard className="ion-padding">
            <IonText className="ion-padding">No requests found for this category.</IonText>
          </IonCard>
        )}

        <IonList style={{ backgroundColor: 'transparent' }}>
          {filteredRequests.map((request) => (
            <IonCard key={request.id} style={{ borderLeft: `10px solid var(--ion-color-primary)`}}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Reason:</strong> {request.reason}</p>
                <p><strong>Has Prescription:</strong> {request.hasPrescription ? 'Yes' : 'No'}</p>
                <p><strong>Created At:</strong> {request.createdAt ? request.createdAt.toLocaleString() : 'N/A'}</p>
                {(request.status === 'pending completion' || request.status === 'completed') && (
                  <>
                    <p><strong>Dispensed Medicines:</strong> {Object.entries(request.dispensedMedicines || {}).map(([id, qty]) => `${id}: ${qty}`).join(', ')}</p>
                    <p><strong>Process Note:</strong> {request.processNote}</p>
                  </>
                )}
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                  {['pending', 'accepted', 'scheduled'].includes(request.status) && (
                    <IonButton color="danger" onClick={() => {
                      setRequestToCancel(request.id!);
                      setShowCancelAlert(true);
                    }}>Cancel</IonButton>
                  )}
                  {request.status === 'pending completion' && (
                    <IonButton color="success" onClick={() => confirmMarkAsComplete(request.id!)}>Mark as Complete</IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedRequest && (
              <>
                <p><strong>Status:</strong> {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}</p>
                {selectedRequest.status === 'scheduled' && (
                  <>
                    {selectedRequest.scheduleDate && (
                      <p><strong>Scheduled Date:</strong> {selectedRequest.scheduleDate.toLocaleDateString()}</p>
                    )}
                    {selectedRequest.scheduleTime && (
                      <p><strong>Scheduled Time:</strong> {selectedRequest.scheduleTime}</p>
                    )}
                    {selectedRequest.schedulePlace && (
                      <p><strong>Scheduled Place:</strong> {selectedRequest.schedulePlace}</p>
                    )}
                  </>
                )}
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                <p><strong>Has Prescription:</strong> {selectedRequest.hasPrescription ? 'Yes' : 'No'}</p>
                {selectedRequest.prescriptionUrl && (
                  <p><strong>Prescription:</strong> <a href={selectedRequest.prescriptionUrl} target="_blank" rel="noopener noreferrer">View Prescription</a></p>
                )}
                <p><strong>Created At:</strong> {selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</p>
                {selectedRequest.userData && (
                  <>
                    <p><strong>Name:</strong> {selectedRequest.userData.firstName} {selectedRequest.userData.middleName || ''} {selectedRequest.userData.lastName} {selectedRequest.userData.suffix || ''}</p>
                    <p><strong>Contact Number:</strong> {selectedRequest.userData.contactNumber || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedRequest.userData.email || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedRequest.userData.address || 'N/A'}</p>
                  </>
                )}
                {selectedRequest.notes && (
                  <p><strong>Notes:</strong> {selectedRequest.notes}</p>
                )}
                {(selectedRequest.status === 'pending completion' || selectedRequest.status === 'completed') && (
                  <>
                    <p><strong>Dispensed Medicines:</strong> {Object.entries(selectedRequest.dispensedMedicines || {}).map(([id, qty]) => `${id}: ${qty}`).join(', ')}</p>
                    <p><strong>Process Note:</strong> {selectedRequest.processNote}</p>
                  </>
                )}
              </>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header={'Confirm Cancellation'}
          message={'Are you sure you want to cancel this medicine request?'}
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
        <IonAlert
          isOpen={showMarkCompleteAlert}
          onDidDismiss={() => setShowMarkCompleteAlert(false)}
          header={'Confirm Mark as Complete'}
          message={'Are you sure you want to mark this medicine request as completed?'}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => {
                setRequestToMarkComplete(null);
              }
            },
            {
              text: 'Yes',
              handler: () => {
                if (requestToMarkComplete) {
                  handleMarkAsComplete(requestToMarkComplete);
                  setRequestToMarkComplete(null);
                }
              }
            }
          ]}
        />
      </IonContent>
    </>
  );
};

export default UserMedRequestList;
