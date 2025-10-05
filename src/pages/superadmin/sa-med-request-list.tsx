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
  IonButton,
  IonAlert,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonModal,
  IonItem,
  IonItemDivider,
  IonMenuButton,
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';

const db = getFirestore();

const SuperAdminMedRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MedicineRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'completed' | 'not_completed' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAcceptAlert, setShowAcceptAlert] = useState(false);
  const [requestToAccept, setRequestToAccept] = useState<string | null>(null);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);
  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false);
  const [requestToMarkComplete, setRequestToMarkComplete] = useState<string | null>(null);

  const handleRefresh = (event: CustomEvent) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      event.detail.complete();
    }, 1000);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
        collection(db, 'medicineRequests'),
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
            setLoading(false);
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
                };
                reqs.push(req);
            });
            setRequests(reqs);
            setLoading(false);
        },
        (err) => {
            clearTimeout(timeoutId);
            setError('Failed to fetch medicine requests');
            setLoading(false);
        }
    );

    return () => {
        clearTimeout(timeoutId);
        unsubscribe();
    };
  }, []);

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
        filtered = requests.filter((r) => r.status === 'accepted' || r.status === 'scheduled');
        break;
      case 'completed':
        filtered = requests.filter((r) => r.status === 'pending completion' || r.status === 'completed');
        break;
      case 'not_completed':
        filtered = requests.filter((r) => r.status === 'cancelled' || r.status === 'rejected' || r.status === 'no show');
        break;
    }
    setFilteredRequests(filtered);
  }, [filter, requests]);

  const handleViewDetails = (request: MedicineRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'completed') => {
    try {
      const requestRef = doc(db, 'medicineRequests', requestId);
      await updateDoc(requestRef, {
        status: status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error updating request to ${status}: `, error);
      setError(`Failed to update the request.`);
    }
  };

  const handleAcceptRequest = () => {
    if (!requestToAccept) return;
    handleUpdateRequestStatus(requestToAccept, 'accepted');
    setRequestToAccept(null);
  };

  const handleRejectRequest = () => {
    if (!requestToReject) return;
    handleUpdateRequestStatus(requestToReject, 'rejected');
    setRequestToReject(null);
  };

  const handleMarkAsComplete = () => {
    if (!requestToMarkComplete) return;
    handleUpdateRequestStatus(requestToMarkComplete, 'completed');
    setRequestToMarkComplete(null);
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Medicine Requests</IonTitle>
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
          <IonSegmentButton value="not_completed">
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
          <IonCard>
            <IonCardContent>
              <IonText className="ion-padding">No requests found.</IonText>
            </IonCardContent>
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
                    : request.status === 'accepted'
                    ? '#017457' // primary (green-ish)
                    : request.status === 'completed'
                    ? '#2dd36f' // success (green)
                    : '#eb445a' // danger (red)
                }`
              }}
            >
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {request.userData?.firstName} {request.userData?.lastName}
                    <IonChip
                      color={
                        request.status === 'pending'
                          ? 'warning'
                          : request.status === 'accepted'
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
                <p>Reason: <strong>{request.reason}</strong></p>
                <p>Approved by: <strong>{request.adminId || 'N/A'}</strong> </p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                  {request.status === 'pending' && (
                    <>
                      <IonButton color="success" onClick={() => {
                        setRequestToAccept(request.id!);
                        setShowAcceptAlert(true);
                      }}>Accept</IonButton>
                      <IonButton color="danger" onClick={() => {
                        setRequestToReject(request.id!);
                        setShowRejectAlert(true);
                      }}>Reject</IonButton>
                    </>
                  )}
                  {request.status === 'accepted' && (
                    <IonButton color="success" onClick={() => {
                      setRequestToMarkComplete(request.id!);
                      setShowMarkCompleteAlert(true);
                    }}>Mark as Completed</IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent >
            {selectedRequest && (
              <IonCard>
                <IonItemDivider style={{ marginTop: '10px' }}>Request Information ({selectedRequest.id})</IonItemDivider>
                <IonItem>
                  <IonLabel>
                    Status: &nbsp;
                    <IonText color={
                      selectedRequest.status === 'pending'
                        ? 'warning'
                        : selectedRequest.status === 'accepted'
                        ? 'primary'
                        : selectedRequest.status === 'completed'
                        ? 'success'
                        : 'danger'
                    } style={{ fontWeight: 'bold'}}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </IonText>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    Reason: &nbsp;
                    <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.reason}</IonText>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    Has Prescription: &nbsp;
                    <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.hasPrescription ? 'Yes' : 'No'}</IonText>
                  </IonLabel>
                </IonItem>
                {selectedRequest.prescriptionUrl && (
                  <IonItem>
                    <IonLabel>
                      Prescription: &nbsp;
                      <a href={selectedRequest.prescriptionUrl} target="_blank" rel="noopener noreferrer">View Prescription</a>
                    </IonLabel>
                  </IonItem>
                )}
                <IonItem>
                  <IonLabel>
                    Created At: &nbsp;
                    <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</IonText>
                  </IonLabel>
                </IonItem>
                <IonItemDivider style={{ marginTop: '20px' }}>Resident Information</IonItemDivider>
                {selectedRequest.userData && (
                  <>
                    <IonItem>
                      <IonLabel>
                        Name: &nbsp;
                        <IonText>{selectedRequest.userData.firstName} {selectedRequest.userData.middleName || ''} {selectedRequest.userData.lastName} {selectedRequest.userData.suffix || ''}</IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Address: &nbsp;
                        <IonText>{selectedRequest.userData?.address || 'N/A'}</IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Contact Number: &nbsp;
                        <IonText>{selectedRequest.userData.contactNumber || 'N/A'}</IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Email: &nbsp;
                        <IonText>{selectedRequest.userData.email || 'N/A'}</IonText>
                      </IonLabel>
                    </IonItem>
                  </>
                )}
                {selectedRequest.notes && (
                  <IonItem>
                    <IonLabel>
                      Notes: &nbsp;
                      <IonText>{selectedRequest.notes}</IonText>
                    </IonLabel>
                  </IonItem>
                )}
              </IonCard>
            )}

          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showAcceptAlert}
          onDidDismiss={() => setShowAcceptAlert(false)}
          header={'Confirm Accept'}
          message={'Are you sure you want to accept this medicine request?'}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => {
                setRequestToAccept(null);
              }
            },
            {
              text: 'Yes',
              handler: handleAcceptRequest
            }
          ]}
        />
        <IonAlert
          isOpen={showRejectAlert}
          onDidDismiss={() => setShowRejectAlert(false)}
          header={'Confirm Reject'}
          message={'Are you sure you want to reject this medicine request?'}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => {
                setRequestToReject(null);
              }
            },
            {
              text: 'Yes',
              handler: handleRejectRequest
            }
          ]}
        />
        <IonAlert
          isOpen={showMarkCompleteAlert}
          onDidDismiss={() => setShowMarkCompleteAlert(false)}
          header={'Confirm Mark as Completed'}
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
              handler: handleMarkAsComplete
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminMedRequestList;
