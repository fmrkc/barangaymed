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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCardSubtitle,
} from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { Medicine } from '../../types/medicine';
import { close, open, archiveOutline, chevronUp, chevronDown } from 'ionicons/icons';
import { formatTimeAgo } from '../../utils/timeUtils';
import '../superadmin/sa-med-request-list.css';

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showCancelToast, setShowCancelToast] = useState<boolean>(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedRequests, setArchivedRequests] = useState<{[key: string]: CombinedRequest[]}>({});
  const [openArchiveGroup, setOpenArchiveGroup] = useState<string | null>(null);
  const [archiveFilter, setArchiveFilter] = useState('all');
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
        ['pending', 'accepted', 'scheduled', 'processed'].includes(r.status)
      );
    } else { // completed
      filtered = combinedRequests.filter((r) =>
        ['completed', 'rejected', 'cancelled', 'no show'].includes(r.status) && r.isShown !== false
      );
    }
    setFilteredRequests(filtered);
  }, [filter, combinedRequests]);

  useEffect(() => {
    let archived = combinedRequests.filter(r =>
        r.isShown === false &&
        ['completed', 'rejected', 'cancelled', 'no show'].includes(r.status)
    );

    if (archiveFilter !== 'all') {
      archived = archived.filter(r => r.status === archiveFilter);
    }

    const grouped = archived.reduce((acc, request) => {
        const date = request.createdAt;
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(request);
        return acc;
    }, {} as {[key: string]: CombinedRequest[]});

    setArchivedRequests(grouped);
}, [combinedRequests, archiveFilter]);

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

    setIsCancelling(true);

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
    } finally {
      setIsCancelling(false);
    }
    setRequestToCancel(null);
  };

  const handleRefresh = (event: CustomEvent) => {
    fetchData();
    event.detail.complete();
  };

  const renderRequestSummary = (request: CombinedRequest) => {
    const isMedicine = request.type === 'medicine';
    const auditTrail = request.auditTrail || [];

    const acceptanceEntry = auditTrail.slice().reverse().find(e =>
      isMedicine ? e.action === 'Accepted request' : e.action === 'Accepted teleconsultation request'
    );
    const rejectionEntry = auditTrail.slice().reverse().find(e =>
      isMedicine ? e.action === 'Rejected request' : e.action === 'Rejected teleconsultation request'
    );
    const cancellationEntry = auditTrail.slice().reverse().find(e =>
      isMedicine ? e.action.startsWith('Cancelled medicine request') : e.action.startsWith('Cancelled teleconsultation request')
    );
    const schedulingEntry = auditTrail.slice().reverse().find(e =>
      isMedicine ? e.action === 'Scheduled request' : e.action === 'Scheduled teleconsultation request'
    );
    const completionEntry = auditTrail.slice().reverse().find(e =>
      isMedicine ? e.action === 'Marked as completed' : e.action === 'Marked teleconsultation as completed'
    );
    const noShowEntry = auditTrail.slice().reverse().find(e =>
      isMedicine ? e.action === 'Marked as no show' : e.action === 'Marked teleconsultation as no show'
    );

    switch (request.status) {
      case 'processed':
        if (isMedicine) {
          const processingEntry = auditTrail.slice().reverse().find(e => e.action === 'Processed request');
          if (processingEntry) {
            return (
              <p>
                Processed and ready for collection.
              </p>
            );
          }
        }
        break;
      case 'accepted':
        if (acceptanceEntry) {
          return (
            <p>
              Accepted by {acceptanceEntry.userName} {formatTimeAgo(acceptanceEntry.timestamp)}.
            </p>
          );
        }
        break;
      case 'scheduled':
        if (schedulingEntry) {
          if (isMedicine) {
            const medRequest = request as MedicineRequest;
            return (
              <p>
                Scheduled for consultation on {medRequest.scheduleDate?.toLocaleDateString()} at {medRequest.scheduleTime} in {medRequest.schedulePlace}.
              </p>
            );
          } else {
            const teleRequest = request as TeleconsultationRequest;
            return (
              <p>
                Scheduled with Dr. {teleRequest.doctorName} on {teleRequest.startTime?.toLocaleDateString()} at {teleRequest.startTime?.toLocaleTimeString()}.
              </p>
            );
          }
        }
        break;
      case 'completed':
        if (completionEntry) {
          return (
            <p>
              Completed by {completionEntry.userName} {formatTimeAgo(completionEntry.timestamp)}.
            </p>
          );
        }
        break;
      case 'rejected':
        if (rejectionEntry) {
          return (
            <p>
              Rejected by {rejectionEntry.userName} {formatTimeAgo(rejectionEntry.timestamp)}. Reason: {request.rejectionReason}.
            </p>
          );
        }
        break;
      case 'cancelled':
        if (cancellationEntry) {
          return (
            <p>
              Cancelled by {cancellationEntry.userName} {formatTimeAgo(cancellationEntry.timestamp)}. Reason: {request.cancellationReason}.
            </p>
          );
        }
        break;
      case 'no show':
        if (noShowEntry) {
          return (
            <p>
              Marked as No Show by {noShowEntry.userName} {formatTimeAgo(noShowEntry.timestamp)}.
            </p>
          );
        }
        break;
      default:
        return null;
    }
    return null;
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
          borderLeft: `8px solid ${
            status === 'pending'
              ? '#ffc409' // warning
              : ['accepted', 'scheduled', 'processed'].includes(status)
                ? '#017457' // primary
                : status === 'completed'
                ? '#2dd36f' // success
                : ['rejected', 'cancelled', 'no show'].includes(status)
                  ? '#eb445a' // danger
                  : '#017457' // primary
            }`
        }}>
        <IonItemDivider>Request ID: &nbsp;<strong>{request.id}</strong></IonItemDivider>
        <IonCardHeader>
          <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {title}
              <IonChip
                color={
                    request.status === 'pending'
                      ? 'warning'
                      : request.status === 'rejected' || request.status === 'cancelled' || request.status === 'no show'
                        ? 'danger'
                        : ['accepted', 'scheduled', 'processed'].includes(request.status)
                          ? 'primary'
                          : request.status === 'completed'
                            ? 'success'
                            : 'primary'
                  }
                style={{ margin: '0' }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </IonChip>
            </div>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>
            <strong>
               {request.updatedAt && request.updatedAt.getTime() !== request.createdAt.getTime()
                    ? `Last updated ${formatTimeAgo(request.updatedAt)}`
                    : `Created ${formatTimeAgo(request.createdAt)}`}
            </strong>
          </p>
          {renderRequestSummary(request)}
          
      
          <div style={{ marginTop: '10px' }}>
            {status === 'pending' ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <IonButton className="btn-25-w ion-padding-vertical" fill="outline" onClick={() => handleViewDetails(request)}>
                  View Details
                </IonButton>
                <IonButton className="btn-75-w ion-padding-vertical" color="danger" onClick={() => {
                  setRequestToCancel({ id: request.id!, type: request.type });
                  setShowCancelAlert(true);
                }}>
                  Cancel Request
                  <IonIcon slot="end" icon={close} />
                </IonButton>
              </div>
            ) : status === 'scheduled' && request.type === 'teleconsultation' && request.meetingLink ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <IonButton className="btn-25-w ion-padding-vertical" fill="outline" onClick={() => handleViewDetails(request)}>
                  View Details
                </IonButton>
                <IonButton className="btn-75-w ion-padding-vertical" color="primary" href={request.meetingLink} target="_blank" rel="noopener noreferrer">
                  Join Meeting
                  <IonIcon slot='end' icon={open} />
                </IonButton>
              </div>
            ) : (
              <IonButton expand="block" className="ion-padding-vertical" fill="outline" onClick={() => handleViewDetails(request)}>
                View Details
                <IonIcon slot="end" icon={open} />
              </IonButton>
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
            <IonLabel>Request ID:</IonLabel>
            <IonText slot="end">{selectedRequest.id}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel>Requested At:</IonLabel>
            <IonText slot="end">{selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel>Status:</IonLabel>
            <IonChip
              slot="end"
              color={
                    selectedRequest.status === 'pending'
                      ? 'warning'
                      : selectedRequest.status === 'rejected' || selectedRequest.status === 'cancelled' || selectedRequest.status === 'no show'
                        ? 'danger'
                        : ['accepted', 'scheduled', 'processed'].includes(selectedRequest.status)
                          ? 'primary'
                          : selectedRequest.status === 'completed'
                            ? 'success'
                            : 'primary'
                  }
            >
              {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
            </IonChip>
          </IonItem>
          <IonItem lines='none'>
            <IonLabel>Reason:</IonLabel>
          </IonItem>
          <IonItem lines='none' className='ion-margin-bottom'>
            <IonTextarea fill='outline' readonly value={selectedRequest.reason}></IonTextarea>
          </IonItem>
          <IonItem lines='none'>
            <IonLabel>Has Prescription:</IonLabel>
            <IonText slot="end">{selectedRequest.hasPrescription ? 'Yes' : 'No'}</IonText>
          </IonItem>
          {selectedRequest.prescriptionUrl && (
            <IonButton expand='block' className='ion-padding-vertical' onClick={() => window.open(selectedRequest.prescriptionUrl, '_blank')}>
              View Prescription
              <IonIcon slot='end' icon={open} />
            </IonButton>
          )}
        </IonCard>
      

        {/* Cancellation Details */}
        {selectedRequest.status === 'cancelled' && (
          <IonCard>
            <IonItemDivider>Cancellation Details</IonItemDivider>
           
            <IonItem lines='none'>
              <IonLabel>Reason:</IonLabel>
            </IonItem>
            <IonItem lines='none' className='ion-margin-bottom'>
              <IonTextarea fill='outline' readonly value={selectedRequest.cancellationReason}></IonTextarea>
            </IonItem>
          </IonCard>
        )}

        {/* Rejection Details */}
        {rejectionEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Rejection Details</IonItemDivider>
            <IonItem>
              <IonLabel>Rejected By: {rejectionEntry.userName}
                <p>{rejectionEntry.userEmail} at {rejectionEntry.timestamp.toLocaleString()}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines='none'>
              <IonLabel>Reason:</IonLabel>
            </IonItem>
            <IonItem lines='none' className='ion-margin-bottom'>
              <IonTextarea fill='outline' readonly value={selectedRequest.rejectionReason}></IonTextarea>
            </IonItem>
          </IonCard>
        )}

        {/* Acceptance Details */}
        {acceptanceEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Acceptance Details</IonItemDivider>
            <IonItem>
              <IonLabel>Accepted By: {acceptanceEntry.userName}
                <p>{acceptanceEntry.userEmail} at {acceptanceEntry.timestamp.toLocaleString()}</p>
              </IonLabel>
            </IonItem>
          </IonCard>
        )}

        {/* Processing Details */}
        {processingEntry && (
          <IonCard>
            <IonItemDivider>Processing Details</IonItemDivider>
            <IonItem>
              <IonLabel>Processed By: {processingEntry.userName}
                <p>{processingEntry.userEmail} at {processingEntry.timestamp.toLocaleString()}</p>
              </IonLabel>
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

        {/* Consultation Details */}
        {schedulingEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Consultation Details</IonItemDivider>
            <IonItem>
              <IonLabel>Scheduled By: {schedulingEntry.userName}
                <p>{schedulingEntry.userEmail} at {schedulingEntry.timestamp.toLocaleString()}</p>
              </IonLabel>
            </IonItem>
             <IonItem lines='none' className='ion-margin-bottom'>
              <IonTextarea fill='outline' readonly value={`Date: ${selectedRequest.scheduleDate ? selectedRequest.scheduleDate.toLocaleDateString() : 'N/A'}\nTime: ${selectedRequest.scheduleTime || 'N/A'}\nLocation: ${selectedRequest.schedulePlace || 'N/A'}`}></IonTextarea>
            </IonItem>
          </IonCard>
        )}



        {/* Completion Details */}
        {completionEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>Completion Details</IonItemDivider>
            <IonItem>
              <IonLabel>Completed By: {completionEntry.userName}
                <p>{completionEntry.userEmail} at {completionEntry.timestamp.toLocaleString()}</p>
              </IonLabel>
            </IonItem>
          </IonCard>
        )}

        {/* No Show Details */}
        {noShowEntry && (
          <IonCard>
            <IonItemDivider className='ion-margin-top'>No Show Details</IonItemDivider>
            <IonItem>
              <IonLabel>Marked By: {noShowEntry.userName}
                <p>{noShowEntry.userEmail} at {noShowEntry.timestamp.toLocaleString()}</p>
              </IonLabel>
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
              <IonCard>
                <IonItemDivider>Your Request Details</IonItemDivider>
                <IonItem>
                  <IonLabel>Request ID:</IonLabel>
                  <IonText slot="end">{selectedRequest.id}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Requested At:</IonLabel>
                  <IonText slot="end">{selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Status:</IonLabel>
                  <IonChip
                    slot="end"
                    color={
                      selectedRequest.status === 'pending'
                        ? 'warning'
                        : selectedRequest.status === 'rejected' || selectedRequest.status === 'cancelled' || selectedRequest.status === 'no show'
                          ? 'danger'
                          : ['accepted', 'scheduled', 'processed'].includes(selectedRequest.status)
                            ? 'primary'
                            : selectedRequest.status === 'completed'
                              ? 'success'
                              : 'primary'
                    }
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </IonChip>
                </IonItem>

                 <IonItem>
                <IonLabel>Reason for Consultation:</IonLabel>
              </IonItem>
              <IonItem lines='none' className='ion-margin-bottom'>
                <IonTextarea fill='outline' readonly value={selectedRequest.reason}></IonTextarea>
              </IonItem>
              {selectedRequest.uploadedFile && (
                <>
                  <IonItem lines='none'>
                    <IonLabel>Uploaded File:</IonLabel>
                  </IonItem>
                  <IonButton expand='block' className='ion-padding-vertical' onClick={() => window.open(selectedRequest.uploadedFile!.url, '_blank')}>
                    View Uploaded File
                    <IonIcon slot='end' icon={open} />
                  </IonButton>
                </>
              )}
              </IonCard>
             

             

              {cancellationEntry && (
                <IonCard>
                  <IonItemDivider>Cancellation Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Cancelled By: {cancellationEntry.userName}
                      <p>{cancellationEntry.userEmail} at {cancellationEntry.timestamp.toLocaleString()}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines='none'>
                    <IonLabel>Reason for Cancellation:</IonLabel>
                  </IonItem>
                  <IonItem lines='none' className='ion-margin-bottom'>
                    <IonTextarea fill='outline' readonly value={(selectedRequest as any).cancellationReason || 'N/A'}></IonTextarea>
                  </IonItem>
                </IonCard>
              )}

              {rejectionEntry && (
                <IonCard>
                  <IonItemDivider>Rejection Details</IonItemDivider>
                  <IonItem lines='none'>
                    <IonLabel>Reason for Rejection:</IonLabel>
                  </IonItem>
                  <IonItem lines='none' className='ion-margin-bottom'>
                    <IonTextarea fill='outline' readonly value={selectedRequest.rejectionReason || 'N/A'}></IonTextarea>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Rejected By: {rejectionEntry.userName}
                      <p>{rejectionEntry.userEmail} at {rejectionEntry.timestamp.toLocaleString()}</p>
                    </IonLabel>
                  </IonItem>
                </IonCard>
              )}

              {noShowEntry && (
                <IonCard>
                  <IonItemDivider>No Show Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Marked By: {noShowEntry.userName}
                      <p>{noShowEntry.userEmail} at {noShowEntry.timestamp.toLocaleString()}</p>
                    </IonLabel>
                  </IonItem>
                </IonCard>
              )}

              {acceptanceEntry && (
                <IonCard>
                  <IonItemDivider>Acceptance Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Accepted By: {acceptanceEntry.userName}
                      <p>{acceptanceEntry.userEmail} at {acceptanceEntry.timestamp.toLocaleString()}</p>
                    </IonLabel>
                  </IonItem>
                </IonCard>
              )}

              {schedulingEntry && (
                <IonCard>
                  <IonItemDivider>Scheduling Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Scheduled By {schedulingEntry.userName}
                      <p>{schedulingEntry.userEmail} at {schedulingEntry.timestamp.toLocaleString()}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Doctor:</IonLabel>
                    <IonText slot="end">{selectedRequest.doctorName || 'N/A'}</IonText>
                  </IonItem>
                  {selectedRequest.status !== 'completed' && selectedRequest.meetingLink && (
                    <IonButton fill="outline" className='ion-padding-vertical' expand='block' href={selectedRequest.meetingLink} target="_blank" rel="noopener noreferrer">
                      Join Meeting
                      <IonIcon icon={open} slot="end" />
                    </IonButton>
                  )}
                  <IonItem lines='none'>
                    <IonLabel>Scheduled Time:</IonLabel>
                  </IonItem>
                  <IonItem className='ion-margin-bottom'>
                    <IonTextarea
                      fill="outline"
                      readonly
                      value={
                        (selectedRequest.startTime || selectedRequest.endTime)
                          ? `${selectedRequest.startTime ? selectedRequest.startTime.toLocaleString() : 'N/A'} - ${selectedRequest.endTime ? selectedRequest.endTime.toLocaleString() : 'N/A'}`
                          : 'N/A'
                      }
                    />
                  </IonItem>
                </IonCard>
              )}

              {completionEntry && (
                <IonCard>
                  <IonItemDivider>Completion Details</IonItemDivider>
                  <IonItem>
                    <IonLabel>Completed By: {completionEntry.userName}
                      <p>{completionEntry.userEmail} at {completionEntry.timestamp.toLocaleString()}</p>
                    </IonLabel>
                    <IonText slot="end"></IonText>
                  </IonItem>
                  {selectedRequest.prescriptionUrl && (
                    <IonItem>
                      <IonLabel>Prescription:</IonLabel>
                      <IonButton slot="end" fill="outline" expand='block' href={selectedRequest.prescriptionUrl} target="_blank" rel="noopener noreferrer">
                        View Prescription
                      </IonButton>
                    </IonItem>
                  )}
                </IonCard>
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
                <IonCard>
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
                </IonCard>
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
          <IonButtons slot="end">
            <IonButton onClick={() => setShowArchiveModal(true)}>
              <IonIcon icon={archiveOutline} slot='icon-only' />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>

        <IonLoading isOpen={isCancelling} message={"Cancelling request..."} />
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

        <IonModal isOpen={showArchiveModal} onDidDismiss={() => setShowArchiveModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Archived Requests</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowArchiveModal(false)}>
                  <IonIcon icon={close} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonCard className="ion-padding-horizontal">
                <IonItem lines="none">
                    <IonText>
                        <p>Requests that are over 31 days old are automatically archived to maintain an organized and clutter-free list. Archived requests are grouped by month and year for easier tracking and reference. You can view them anytime in this Archive section.</p>
                    </IonText>
                </IonItem>
            </IonCard>

            <IonToolbar>
                <IonSelect value={archiveFilter} placeholder="Filter by Status" onIonChange={(e: CustomEvent) => setArchiveFilter(e.detail.value)}>
                    <IonSelectOption value="all">All Statuses</IonSelectOption>
                    <IonSelectOption value="completed">Completed</IonSelectOption>
                    <IonSelectOption value="rejected">Rejected</IonSelectOption>
                    <IonSelectOption value="cancelled">Cancelled</IonSelectOption>
                    <IonSelectOption value="no show">No Show</IonSelectOption>
                </IonSelect>
            </IonToolbar>

            {Object.keys(archivedRequests).length === 0 ? (
                <IonCard className="ion-padding"><IonText>No archived requests found.</IonText></IonCard>
            ) : (
                <IonList>
                    {Object.keys(archivedRequests).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(groupKey => (
                        <div key={groupKey}>
                                  <IonItem button onClick={() => setOpenArchiveGroup(openArchiveGroup === groupKey ? null : groupKey)}>
                                    <IonLabel>{groupKey}</IonLabel>
                                    <IonIcon icon={openArchiveGroup === groupKey ? chevronUp : chevronDown} slot="end" />
                                  </IonItem>  {openArchiveGroup === groupKey && (
                                <IonList>
                                    {archivedRequests[groupKey].map(request => renderCard(request))}
                                </IonList>
                            )}
                        </div>
                    ))}
                </IonList>
            )}
          </IonContent>
        </IonModal>

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
