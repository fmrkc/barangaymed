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
  IonChip,
} from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';

const db = getFirestore();

const UserTeleRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'completed' | 'unsuccessful' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
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
            console.log("Data received from Firestore. Number of documents:", querySnapshot.size);
            clearTimeout(timeoutId);
            setLoading(false); // Just stop loading, do nothing else.
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
                    startTime: data.startTime ? (data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime)) : undefined,
                    endTime: data.endTime ? (data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime)) : undefined,
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
      const requestRef = doc(db, 'teleconsultationRequests', requestId);
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
          <IonTitle>My Teleconsultation Requests</IonTitle>
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
            <IonCard 
            key={request.id} 
            style={{
                borderLeft: `8px solid ${
                  request.status === 'pending'
                    ? '#ffc409' // warning (yellow)
                    : request.status === 'accepted' || request.status === 'scheduled'
                    ? '#017457' // primary (blue)
                    : request.status === 'completed'
                    ? '#2dd36f' // success (green)
                    : '#eb445a' // danger (red)
                }`
              }}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Consultation Request
                    <IonChip
                      color={
                        request.status === 'pending'
                          ? 'warning'
                          : request.status === 'accepted' || request.status === 'scheduled'
                            ? 'primary'
                            : request.status === 'completed'
                              ? 'success'
                              : 'danger'
                      }
                      style={{ margin: '0' }}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </IonChip>
                  </div>
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
              <IonCard>
                <IonItemDivider style={{ marginTop: '10px' }}>Request Information ({selectedRequest.id})</IonItemDivider>
                <IonItem>
                  <IonLabel>
                    Status: &nbsp;
                    <IonText color={
                      selectedRequest.status === 'pending'
                        ? 'warning'
                        : selectedRequest.status === 'accepted' || selectedRequest.status === 'scheduled'
                          ? 'primary'
                          : selectedRequest.status === 'completed'
                            ? 'success'
                            : 'danger'
                    } style={{ fontWeight: 'bold' }}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </IonText>
                  </IonLabel>
                </IonItem>
                 {selectedRequest.meetingLink && (
                  <>
                 
                  <IonButton className='ion-padding' expand='full' href={selectedRequest.meetingLink} target="_blank" rel="noopener noreferrer">
                      Join Consultation (opens Google Meet)
                    </IonButton>
                  </>
                )}
                <IonItem>
                  <IonLabel>
                    Reason: &nbsp;
                    <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.reason}</IonText>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    Created At: &nbsp;
                    <IonText style={{ fontWeight: 'bold' }}>
                      {selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}
                    </IonText>
                  </IonLabel>
                </IonItem>
                {selectedRequest.startTime && (
                  <>
                    <IonItem>
                      <IonLabel>
                        Scheduled Date: &nbsp;
                        <IonText style={{ fontWeight: 'bold' }}>
                          {selectedRequest.startTime.toLocaleDateString()}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Start Time: &nbsp;
                        <IonText style={{ fontWeight: 'bold' }}>
                          {selectedRequest.startTime.toLocaleTimeString()}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                  </>
                )}
                {selectedRequest.endTime && (
                  <IonItem>
                    <IonLabel>
                      End Time: &nbsp;
                      <IonText style={{ fontWeight: 'bold' }}>
                        {selectedRequest.endTime.toLocaleTimeString()}
                      </IonText>
                    </IonLabel>
                  </IonItem>
                )}
                {selectedRequest.notes && (
                  <p><strong>Notes:</strong> {selectedRequest.notes}</p>
                )}
               

                <IonItemDivider style={{ marginTop: '20px' }}>Resident Information</IonItemDivider>    
                {selectedRequest.userData && (
                  <>
                    <IonItem>
                      <IonLabel>
                        Name: &nbsp;
                        <IonText style={{ fontWeight: 'bold' }}>
                          {selectedRequest.userData.firstName} {selectedRequest.userData.middleName || ''} {selectedRequest.userData.lastName} {selectedRequest.userData.suffix || ''}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Contact Number: &nbsp;
                        <IonText style={{ fontWeight: 'bold' }}>
                          {selectedRequest.userData.contactNumber || 'N/A'}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Email: &nbsp;
                        <IonText style={{ fontWeight: 'bold' }}>
                          {selectedRequest.userData.email || 'N/A'}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Address: &nbsp;
                        <IonText style={{ fontWeight: 'bold' }}>
                          {selectedRequest.userData.address || 'N/A'}
                        </IonText>
                      </IonLabel>
                    </IonItem>
                  </>
                )}
                
              </IonCard>
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
        <IonAlert
          isOpen={showMarkCompleteAlert}
          onDidDismiss={() => setShowMarkCompleteAlert(false)}
          header={'Confirm Mark as Complete'}
          message={'Are you sure you want to mark this teleconsultation request as completed?'}
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

export default UserTeleRequestList;
