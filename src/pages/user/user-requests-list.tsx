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
  IonIcon,
} from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { Medicine } from '../../types/medicine';
import { close, open } from 'ionicons/icons';

const db = getFirestore();

type CombinedRequest = (MedicineRequest & { type: 'medicine' }) | (TeleconsultationRequest & { type: 'teleconsultation' });

const UserRequestsList: React.FC = () => {
  const { currentUser, verificationStatus } = useAuth();
  const [medicineRequests, setMedicineRequests] = useState<MedicineRequest[]>([]);
  const [teleconsultationRequests, setTeleconsultationRequests] = useState<TeleconsultationRequest[]>([]);
  const [combinedRequests, setCombinedRequests] = useState<CombinedRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CombinedRequest[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState<CombinedRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<{ id: string, type: 'medicine' | 'teleconsultation' } | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showCancelToast, setShowCancelToast] = useState<boolean>(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [detailSegment, setDetailSegment] = useState<'request' | 'resident'>('request');
  const userId = currentUser?.uid;

  const fetchData = useCallback(() => {
    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    if (verificationStatus !== 'verified') {
      setError('You must be a verified resident to view requests.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const medQuery = query(
      collection(db, 'medicineRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const teleQuery = query(
      collection(db, 'teleconsultationRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubMedicine = onSnapshot(medQuery, (querySnapshot) => {
      const reqs: MedicineRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reqs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt ? (data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)) : undefined,
          scheduleDate: data.scheduleDate ? (data.scheduleDate instanceof Timestamp ? data.scheduleDate.toDate() : new Date(data.scheduleDate)) : undefined,
          auditTrail: data.auditTrail ? data.auditTrail.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp instanceof Timestamp ? entry.timestamp.toDate() : new Date(entry.timestamp),
          })) : [],
        } as MedicineRequest);
      });
      setMedicineRequests(reqs);
    }, (err) => {
      console.error("Firestore error fetching medicine requests:", err);
      setError('Failed to fetch medicine requests');
      setLoading(false);
    });

    const unsubTeleconsultation = onSnapshot(teleQuery, (querySnapshot) => {
      const reqs: TeleconsultationRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reqs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt ? (data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)) : undefined,
          startTime: data.startTime ? (data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime)) : undefined,
          endTime: data.endTime ? (data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime)) : undefined,
          auditTrail: data.auditTrail ? data.auditTrail.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp instanceof Timestamp ? entry.timestamp.toDate() : new Date(entry.timestamp),
          })) : [],
        } as TeleconsultationRequest);
      });
      setTeleconsultationRequests(reqs);
    }, (err) => {
      console.error("Firestore error fetching teleconsultation requests:", err);
      setError('Failed to fetch teleconsultation requests');
      setLoading(false);
    });

    const medicinesCol = collection(db, 'medicine');
    const unsubMedicines = onSnapshot(medicinesCol, (querySnapshot) => {
      const medicinesList: Medicine[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        medicinesList.push({
          id: doc.id,
          ...data
        } as Medicine);
      });
      setMedicines(medicinesList);
    },
      (error) => {
        console.error('Error fetching medicines:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubMedicine();
      unsubTeleconsultation();
      unsubMedicines();
    };
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
    const medTyped = medicineRequests.map(r => ({ ...r, type: 'medicine' as const }));
    const teleTyped = teleconsultationRequests.map(r => ({ ...r, type: 'teleconsultation' as const }));
    const allRequests = [...medTyped, ...teleTyped];
    allRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setCombinedRequests(allRequests);
    setLoading(false);
  }, [medicineRequests, teleconsultationRequests]);

  useEffect(() => {
    let filtered: CombinedRequest[] = [];
    if (filter === 'active') {
      filtered = combinedRequests.filter((r) =>
        ['pending', 'accepted', 'scheduled'].includes(r.status)
      );
    } else { // completed
      filtered = combinedRequests.filter((r) =>
        ['completed', 'rejected', 'cancelled', 'no show'].includes(r.status)
      );
    }
    setFilteredRequests(filtered);
  }, [filter, combinedRequests]);

  const handleViewDetails = (request: CombinedRequest) => {
    setSelectedRequest(request);
    if (request.type === 'teleconsultation') {
      setDetailSegment('request');
    }
    setShowModal(true);
  };

  const handleCancelRequest = async (reason: string) => {
    if (!requestToCancel || !currentUser) return;

    if (!reason || reason.trim() === '') {
      setToastMessage('Please provide a reason for cancellation.');
      setShowCancelToast(true);
      return;
    }

    const { id, type } = requestToCancel;
    const collectionName = type === 'medicine' ? 'medicineRequests' : 'teleconsultationRequests';
    const auditAction = type === 'medicine' ? 'Cancelled medicine request by user' : 'Cancelled teleconsultation request by user';

    try {
      const requestRef = doc(db, collectionName, id);
      await updateDoc(requestRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: auditAction,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email || 'User',
          timestamp: new Date(),
        }),
      });
      setToastMessage('Request cancelled.');
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

  const renderCard = (request: CombinedRequest) => {
    const isMedicine = request.type === 'medicine';
    const title = isMedicine ? 'Medicine Request' : 'Consultation Request';
    const reason = request.reason;
    const createdAt = request.createdAt;
    const status = request.status;

    return (
      <IonCard
        key={request.id}
        style={{
          borderLeft: `8px solid ${status === 'pending'
              ? '#ffc409' // warning
              : ['accepted', 'scheduled'].includes(status)
                ? '#017457' // primary
                : status === 'completed'
                  ? '#2dd36f' // success
                  : '#eb445a' // danger
            }`
        }}>
        <IonCardHeader>
          <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {title}
              <IonChip
                color={
                  status === 'pending' ? 'warning' :
                    ['accepted', 'scheduled'].includes(status) ? 'primary' :
                      status === 'completed' ? 'success' : 'danger'
                }
                style={{ margin: '0' }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </IonChip>
            </div>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p><strong>Reasons:</strong> {reason}</p>
          <p><strong>Created At:</strong> {createdAt ? createdAt.toLocaleString() : 'N/A'}</p>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
            {status === 'pending' && (
              <IonButton color="danger" onClick={() => {
                setRequestToCancel({ id: request.id!, type: request.type });
                setShowCancelAlert(true);
              }}>Cancel</IonButton>
            )}
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  const renderMedicineModalDetails = (selectedRequest: MedicineRequest) => {
    const acceptanceEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Accepted request');
    const rejectionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Rejected request');
    const processingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Processed request');
    const schedulingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Scheduled request');
    const completionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as completed');
    const noShowEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as no show');

    return (
      <>
        {/* Request Information */}
       <IonCard>
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
       </IonCard>
      

        {/* Cancellation Details */}
        {selectedRequest.status === 'cancelled' && (
          <IonCard>
            <IonItemDivider>Cancellation Details</IonItemDivider>
            <IonItem>
              <IonLabel>Reason for Cancellation:</IonLabel>
              <IonText slot="end" className="ion-text-wrap">{(selectedRequest as any).cancellationReason}</IonText>
            </IonItem>
          </IonCard>
        )}

        {/* Rejection Details */}
        {rejectionEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Rejection Details</IonItemDivider>
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
          </IonCard>
        )}

        {/* Acceptance Details */}
        {acceptanceEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Acceptance Details</IonItemDivider>
            <IonItem>
              <IonLabel>Accepted By: {acceptanceEntry.userName} ({acceptanceEntry.userEmail})</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Accepted At: {acceptanceEntry.timestamp.toLocaleString()}</IonLabel>
            </IonItem>
          </IonCard>
        )}

        {/* Processing Details */}
        {processingEntry && (
          <IonCard>
            <IonItemDivider>Processing Details</IonItemDivider>
            <IonItem>
              <IonLabel>Processed By: {processingEntry.userName} ({processingEntry.userEmail})</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Processed At: {processingEntry.timestamp.toLocaleString()}</IonLabel>
            </IonItem>
          </IonCard>
        )}

        {/* Dispensed Medicines */}
        {['processed', 'scheduled', 'completed', 'no show'].includes(selectedRequest.status) && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Dispensed Medicines</IonItemDivider>
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
          </IonCard>
        )}

        {/* Scheduling Details */}
        {schedulingEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Scheduling Details</IonItemDivider>
            <IonItem>
              <IonLabel>Scheduled By: {schedulingEntry.userName} ({schedulingEntry.userEmail})</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Scheduled At: {schedulingEntry.timestamp.toLocaleString()}</IonLabel>
            </IonItem>
          </IonCard>
        )}

        {/* Pickup Details */}
        {['scheduled', 'completed'].includes(selectedRequest.status) && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Pickup Details</IonItemDivider>
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
          </IonCard>
        )}

        {/* Completion Details */}
        {completionEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Completion Details</IonItemDivider>
            <IonItem>
              <IonLabel>Completed By: {completionEntry.userName} ({completionEntry.userEmail})</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Completed At: {completionEntry.timestamp.toLocaleString()}</IonLabel>
            </IonItem>
          </IonCard>
        )}

        {/* No Show Details */}
        {noShowEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>No Show Details</IonItemDivider>
            <IonItem>
              <IonLabel>Marked By: {noShowEntry.userName} ({noShowEntry.userEmail})</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Marked At: {noShowEntry.timestamp.toLocaleString()}</IonLabel>
            </IonItem>
          </IonCard>
        )}
      </>
    );
  }

  const renderTeleconsultationModalDetails = (selectedRequest: TeleconsultationRequest) => {
    const acceptanceEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Accepted teleconsultation request');
    const rejectionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Rejected teleconsultation request');
    const schedulingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Scheduled teleconsultation request');
    const completionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as completed');
    const noShowEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as no show');
    const cancellationEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Cancelled teleconsultation request by user');

    return (
      <>
        <>
          {detailSegment === 'request' && (
            <>
              {/* Request Information */}
              <IonItemDivider>Your Request Details</IonItemDivider>
              <IonItem>
                <IonLabel>Status:</IonLabel>
                <IonChip
                  slot="end"
                  color={
                    selectedRequest.status === 'pending'
                      ? 'warning'
                      : selectedRequest.status === 'rejected' || selectedRequest.status === 'cancelled' || selectedRequest.status === 'no show'
                        ? 'danger'
                        : ['accepted', 'scheduled'].includes(selectedRequest.status)
                          ? 'primary'
                          : selectedRequest.status === 'completed'
                            ? 'success'
                            : 'medium'
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
                <IonLabel>Requested At:</IonLabel>
                <IonText slot="end">{selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</IonText>
              </IonItem>

              {/* Cancellation Details */}
              {cancellationEntry && (
                <>
                  <IonItemDivider>Cancellation Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Cancelled By: {cancellationEntry.userName}</IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Cancelled At: {cancellationEntry.timestamp.toLocaleString()}</IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Reason for Cancellation:</IonLabel>
                    <IonText slot="end" className="ion-text-wrap">{(selectedRequest as any).cancellationReason || 'N/A'}</IonText>
                  </IonItem>
                </>
              )}

              {/* Rejection Details */}
              {rejectionEntry && (
                <>
                  <IonItemDivider>Rejection Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Reason for Rejection:</IonLabel>
                    <IonText slot="end" className="ion-text-wrap">{selectedRequest.rejectionReason || 'N/A'}</IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Rejected By: {rejectionEntry.userName}</IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Rejected At: {rejectionEntry.timestamp.toLocaleString()}</IonLabel>
                  </IonItem>
                </>
              )}

              {/* No Show Details */}
              {noShowEntry && (
                <>
                  <IonItemDivider>No Show Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Marked By: {noShowEntry.userName}</IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Marked At: {noShowEntry.timestamp.toLocaleString()}</IonLabel>
                  </IonItem>
                </>
              )}

              {/* Acceptance Details */}
              {acceptanceEntry && (
                <>
                  <IonItemDivider>Acceptance Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Accepted By:</IonLabel>
                    <IonText slot="end">{acceptanceEntry.userName}</IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Accepted At:</IonLabel>
                    <IonText slot="end">{acceptanceEntry.timestamp.toLocaleString()}</IonText>
                  </IonItem>
                </>
              )}

              {/* Scheduling Details */}
              {schedulingEntry && (
                <>
                  <IonItemDivider>Scheduling Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Scheduled By:</IonLabel>
                    <IonText slot="end">{schedulingEntry.userName}</IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Scheduled At:</IonLabel>
                    <IonText slot="end">{schedulingEntry.timestamp.toLocaleString()}</IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Doctor:</IonLabel>
                    <IonText slot="end">{selectedRequest.doctorName || 'N/A'}</IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Specialty:</IonLabel>
                    <IonText slot="end">{selectedRequest.doctorSpecialty || 'N/A'}</IonText>
                  </IonItem>
                  {selectedRequest.status !== 'completed' && selectedRequest.meetingLink && (
                    <IonItem>
                      <IonLabel>Meeting Link:</IonLabel>
                      <IonButton slot="end" fill="outline" size="small" href={selectedRequest.meetingLink} target="_blank" rel="noopener noreferrer">Join</IonButton>
                    </IonItem>
                  )}
                  <IonItem>
                    <IonLabel>Start Time:</IonLabel>
                    <IonText slot="end">{selectedRequest.startTime ? selectedRequest.startTime.toLocaleString() : 'N/A'}</IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel>End Time:</IonLabel>
                    <IonText slot="end">{selectedRequest.endTime ? selectedRequest.endTime.toLocaleString() : 'N/A'}</IonText>
                  </IonItem>
                </>
              )}

              {/* Completion Details */}
              {completionEntry && (
                <>
                  <IonItemDivider>Completion Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Completed By:</IonLabel>
                    <IonText slot="end">{completionEntry.userName}</IonText>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Completed At:</IonLabel>
                    <IonText slot="end">{completionEntry.timestamp.toLocaleString()}</IonText>
                  </IonItem>
                  {selectedRequest.prescriptionUrl && (
                    <IonItem>
                      <IonLabel>Prescription:</IonLabel>
                      <IonButton slot="end" fill="outline" size="small" href={selectedRequest.prescriptionUrl} target="_blank" rel="noopener noreferrer">
                        View Prescription
                      </IonButton>
                    </IonItem>
                  )}
                </>
              )}
            </>
          )}
          {detailSegment === 'resident' && (
            <>
              <IonItemDivider style={{ marginTop: '10px' }}>Resident Information</IonItemDivider>
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
              {selectedRequest.medicalRecord && (
                <>
                  <IonItemDivider>Medical Record</IonItemDivider>
                  {selectedRequest.medicalRecord.symptoms.length > 0 && (
                    <IonItem>
                      <IonLabel>Symptoms:</IonLabel>
                      <IonText slot="end" className="ion-text-wrap">{selectedRequest.medicalRecord.symptoms.join(', ')}</IonText>
                    </IonItem>
                  )}
                  {selectedRequest.medicalRecord.conditions.length > 0 && (
                    <IonItem>
                      <IonLabel>Conditions:</IonLabel>
                      <IonText slot="end" className="ion-text-wrap">{selectedRequest.medicalRecord.conditions.join(', ')}</IonText>
                    </IonItem>
                  )}
                  {selectedRequest.medicalRecord.allergies.length > 0 && (
                    <IonItem>
                      <IonLabel>Allergies:</IonLabel>
                      <IonText slot="end" className="ion-text-wrap">{selectedRequest.medicalRecord.allergies.join(', ')}</IonText>
                    </IonItem>
                  )}
                  {selectedRequest.medicalRecord.historyFiles.length > 0 && (
                    <>
                      <IonItemDivider>Medical History Files</IonItemDivider>
                      {selectedRequest.medicalRecord.historyFiles.map((file, index) => (
                        <IonItem key={index}>
                          <IonLabel>
                            <IonText>{file.fileName}</IonText>
                            <br />
                            <small>Uploaded: {file.uploadedAt.toLocaleString()}</small>
                          </IonLabel>
                          <IonButton slot="end" fill="outline" onClick={() => window.open(file.fileURL, '_blank')}>View</IonButton>
                        </IonItem>
                      ))}
                    </>
                  )}
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
            </>
          )}
        </>
      </>
    );
  }

  return (
    <>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>My Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>

        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonSegment scrollable value={filter} onIonChange={e => setFilter(e.detail.value as any)}>
          <IonSegmentButton value="active">
            <IonLabel>Active</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading && (
          <IonList>
            {Array.from({ length: 5 }).map((_, index) => (
              <IonCard key={index}>
                <IonCardHeader><IonCardTitle><IonSkeletonText animated style={{ width: '60%' }} /></IonCardTitle></IonCardHeader>
                <IonCardContent>
                  <p><IonSkeletonText animated style={{ width: '80%' }} /></p>
                  <p><IonSkeletonText animated style={{ width: '50%' }} /></p>
                  <p><IonSkeletonText animated style={{ width: '70%' }} /></p>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        {error && <IonText color="danger" className="ion-padding">{error}</IonText>}

        {!loading && !error && filteredRequests.length === 0 && (
          <IonCard className="ion-padding">
            <IonText className="ion-padding">No requests found for this category.</IonText>
          </IonCard>
        )}

        <IonList style={{ backgroundColor: 'transparent' }}>
          {filteredRequests.map(renderCard)}
        </IonList>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={close} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedRequest && (
              selectedRequest.type === 'medicine'
                ? renderMedicineModalDetails(selectedRequest)
                : renderTeleconsultationModalDetails(selectedRequest)
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header={'Confirm Cancellation'}
          message={'Please provide a reason for cancelling this request.'}
          inputs={[
            {
              name: 'cancellationReason',
              type: 'textarea',
              placeholder: 'Reason for cancellation...'
            }
          ]}
          buttons={[
            { text: 'Back', role: 'cancel', handler: () => setRequestToCancel(null) },
            { text: 'Yes, Cancel', handler: (data) => handleCancelRequest(data.cancellationReason) }
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

export default UserRequestsList;
