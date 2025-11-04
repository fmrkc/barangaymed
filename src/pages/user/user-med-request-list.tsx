import React, { useEffect, useState, useCallback } from 'react';
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
  IonPage,
  IonToast,
  IonSkeletonText,
} from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';
import { Medicine } from '../../types/medicine';

const db = getFirestore();

const UserMedRequestList: React.FC = () => {
  const { currentUser, verificationStatus } = useAuth();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MedicineRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'completed' | 'unsuccessful' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showCancelToast, setShowCancelToast] = useState<boolean>(false);
  const userId = currentUser?.uid;

  const fetchData = useCallback(() => {
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
        setError('Loading timed out. Please try again.');
        setLoading(false);
    }, 10000);

    const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
            console.log("Data received from Firestore. Number of documents:", querySnapshot.size);
            clearTimeout(timeoutId);
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
                    rejectionReason: data.rejectionReason,
                    auditTrail: data.auditTrail ? data.auditTrail.map((entry: any) => ({
                      action: entry.action,
                      userId: entry.userId,
                      userEmail: entry.userEmail,
                      userName: entry.userName,
                      timestamp: entry.timestamp instanceof Timestamp ? entry.timestamp.toDate() : new Date(entry.timestamp),
                    })) : [],
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
        }
    );

    return unsubscribe;
  }, [userId, verificationStatus]);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchData]);

  useEffect(() => {
    const medicinesCol = collection(db, 'medicine');
    const unsubscribe = onSnapshot(
      medicinesCol,
      (querySnapshot) => {
        const medicinesList: Medicine[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          medicinesList.push({
            id: doc.id,
            medicine_name: data.medicine_name,
            dosage_form: data.dosage_form,
            strength: data.strength,
            category: data.category,
            requires_prescription: data.requires_prescription,
            description: data.description,
            created_at: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(data.created_at),
            expiration_date: data.expiration_date instanceof Timestamp ? data.expiration_date.toDate() : new Date(data.expiration_date),
            unit_name: data.unit_name,
            conversion_factor: data.conversion_factor,
            quantity: data.quantity,
            isDeleted: data.isDeleted || false,
          });
        });
        setMedicines(medicinesList);
      },
      (error) => {
        console.error('Error fetching medicines:', error);
      }
    );

    return () => unsubscribe();
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
        filtered = requests.filter((r) =>
          ['accepted', 'scheduled'].includes(r.status)
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
    if (!requestToCancel || !currentUser) return;
    try {
      const requestRef = doc(db, 'medicineRequests', requestToCancel);
      await updateDoc(requestRef, {
        status: 'cancelled',
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: 'Cancelled medicine request by user',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email || 'User',
          timestamp: new Date(),
        }),
      });
      setToastMessage('Medicine request cancelled.');
      setShowCancelToast(true);
      setShowModal(false);
    } catch (error) {
      console.error("Error cancelling request: ", error);
      setError("Failed to cancel the request.");
    }
    setRequestToCancel(null);
  };

  const handleRefresh = (event: CustomEvent) => {
    fetchData();
    event.detail.complete();
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

        {loading && (
          <IonList>
            {Array.from({ length: 5 }).map((_, index) => (
              <IonCard key={index}>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonSkeletonText animated style={{ width: '60%' }} />
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p><IonSkeletonText animated style={{ width: '80%' }} /></p>
                  <p><IonSkeletonText animated style={{ width: '50%' }} /></p>
                  <p><IonSkeletonText animated style={{ width: '70%' }} /></p>
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <IonSkeletonText animated style={{ width: '100px', height: '40px' }} />
                    <IonSkeletonText animated style={{ width: '100px', height: '40px' }} />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
        
        {error && (
          <IonText color="danger" className="ion-padding">
            {error}
          </IonText>
        )}

        {!error && filteredRequests.length === 0 && (
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
                    Medicine Request
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
                <p><strong>Has Prescription:</strong> {request.hasPrescription ? 'Yes' : 'No'}</p>
                <p><strong>Created At:</strong> {request.createdAt ? request.createdAt.toLocaleString() : 'N/A'}</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                  {['pending', 'accepted'].includes(request.status) && (
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
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
          {selectedRequest && (() => {
            const acceptanceEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Accepted request');
            const rejectionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Rejected request');
            const processingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Processed request');
            const schedulingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Scheduled request');
            const completionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as completed');
            const noShowEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as no show');

            return (
              <IonCard>
                {/* Request Information */}
                <IonItemDivider style={{ marginTop: '10px' }}>Your Request Details</IonItemDivider>
                <IonItem>
                  <IonLabel>Status:</IonLabel>
                  <IonChip
                    slot="end"
                    color={
                      selectedRequest.status === 'pending'
                        ? 'warning'
                        : ['accepted', 'processed', 'scheduled'].includes(selectedRequest.status)
                        ? 'primary'
                        : selectedRequest.status === 'completed'
                        ? 'success'
                        : 'danger'
                    }
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </IonChip>
                </IonItem>
                <IonItem>
                  <IonLabel>Reason:</IonLabel>
                  <IonText slot="end" className="ion-text-wrap">{selectedRequest.reason}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Has Prescription:</IonLabel>
                  <IonText slot="end">{selectedRequest.hasPrescription ? 'Yes' : 'No'}</IonText>
                </IonItem>
                {selectedRequest.prescriptionUrl && (
                  <IonItem>
                    <IonLabel>Prescription:</IonLabel>
                    <IonButton slot="end" fill="outline" size="small" onClick={() => window.open(selectedRequest.prescriptionUrl, '_blank')}>View</IonButton>
                  </IonItem>
                )}
                <IonItem>
                  <IonLabel>Requested At:</IonLabel>
                  <IonText slot="end">{selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</IonText>
                </IonItem>

                {/* Rejection Details */}
                {rejectionEntry && (
                  <>
                    <IonItemDivider>Rejection Details</IonItemDivider>
                    <IonItem>
                      <IonLabel>Reason for Rejection:</IonLabel>
                      <IonText slot="end" className="ion-text-wrap">{selectedRequest.rejectionReason}</IonText>
                    </IonItem>
                     <IonItem>
                                          <IonLabel>Reviewed By:</IonLabel>
                                          <IonText slot="end">{rejectionEntry.userName} ({rejectionEntry.userEmail})</IonText>
                                        </IonItem>
                                         <IonItem>
                                          <IonLabel>Reviewed At:</IonLabel>
                                          <IonText slot="end">{rejectionEntry.timestamp.toLocaleString()}</IonText>
                                        </IonItem>
                                      </>
                                    )}
                      
                                    {/* Acceptance Details */}
                                    {acceptanceEntry && (
                                      <>
                                        <IonItemDivider>Acceptance Details</IonItemDivider>
                                        <IonItem>
                                          <IonLabel>Accepted By:</IonLabel>
                                          <IonText slot="end">{acceptanceEntry.userName} ({acceptanceEntry.userEmail})</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Accepted At:</IonLabel>
                                          <IonText slot="end">{acceptanceEntry.timestamp.toLocaleString()}</IonText>
                                        </IonItem>
                                      </>
                                    )}
                      
                                    {/* Processing Details */}
                                    {processingEntry && (
                                      <>
                                        <IonItemDivider>Processing Details</IonItemDivider>
                                        <IonItem>
                                          <IonLabel>Processed By:</IonLabel>
                                          <IonText slot="end">{processingEntry.userName} ({processingEntry.userEmail})</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Processed At:</IonLabel>
                                          <IonText slot="end">{processingEntry.timestamp.toLocaleString()}</IonText>
                                        </IonItem>
                                      </>
                                    )}
                      
                                    {/* Dispensed Medicines */}
                                    {['processed', 'scheduled', 'completed', 'no show'].includes(selectedRequest.status) && (
                                      <>
                                        <IonItemDivider>Dispensed Medicines</IonItemDivider>
                                        <IonItem>
                                          <IonLabel>Medicines:</IonLabel>
                                          <IonText slot="end" className="ion-text-wrap">{Object.entries(selectedRequest.dispensedMedicines || {}).map(([id, qty]) => {
                                            const med = medicines.find(m => m.id === id);
                                            return `${med?.medicine_name || id} (x${qty})`;
                                          }).join(', ') || 'N/A'}</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Notes from Health Worker:</IonLabel>
                                          <IonText slot="end" className="ion-text-wrap">{selectedRequest.processNote || 'N/A'}</IonText>
                                        </IonItem>
                                      </>
                                    )}
                      
                                    {/* Scheduling Details */}
                                    {schedulingEntry && (
                                      <>
                                        <IonItemDivider>Scheduling Details</IonItemDivider>
                                        <IonItem>
                                          <IonLabel>Scheduled By:</IonLabel>
                                          <IonText slot="end">{schedulingEntry.userName} ({schedulingEntry.userEmail})</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Scheduled At:</IonLabel>
                                          <IonText slot="end">{schedulingEntry.timestamp.toLocaleString()}</IonText>
                                        </IonItem>
                                      </>
                                    )}
                      
                                    {/* Pickup Details */}
                                    {['scheduled', 'completed'].includes(selectedRequest.status) && (
                                      <>
                                        <IonItemDivider>Pickup Details</IonItemDivider>
                                        <IonItem>
                                          <IonLabel>Date:</IonLabel>
                                          <IonText slot="end">{selectedRequest.scheduleDate ? selectedRequest.scheduleDate.toLocaleDateString() : 'N/A'}</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Time:</IonLabel>
                                          <IonText slot="end">{selectedRequest.scheduleTime || 'N/A'}</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Location:</IonLabel>
                                          <IonText slot="end" className="ion-text-wrap">{selectedRequest.schedulePlace || 'N/A'}</IonText>
                                        </IonItem>
                                      </>
                                    )}
                      
                                    {/* Completion Details */}
                                    {completionEntry && (
                                      <>
                                        <IonItemDivider>Completion Details</IonItemDivider>
                                        <IonItem>
                                          <IonLabel>Completed By:</IonLabel>
                                          <IonText slot="end">{completionEntry.userName} ({completionEntry.userEmail})</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Completed At:</IonLabel>
                                          <IonText slot="end">{completionEntry.timestamp.toLocaleString()}</IonText>
                                        </IonItem>
                                      </>
                                    )}
                      
                                    {/* No Show Details */}
                                    {noShowEntry && (
                                      <>
                                        <IonItemDivider>No Show Details</IonItemDivider>
                                        <IonItem>
                                          <IonLabel>Marked By:</IonLabel>
                                          <IonText slot="end">{noShowEntry.userName} ({noShowEntry.userEmail})</IonText>
                                        </IonItem>
                                        <IonItem>
                                          <IonLabel>Marked At:</IonLabel>
                                          <IonText slot="end">{noShowEntry.timestamp.toLocaleString()}</IonText>
                                        </IonItem>                  </>
                )}
              </IonCard>
            );
          })()}
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

        <IonToast
          isOpen={showCancelToast}
          onDidDismiss={() => setShowCancelToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </>
  );
};

export default UserMedRequestList;
