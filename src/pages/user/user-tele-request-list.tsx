import React, { useEffect, useState } from 'react';
import { IonLabel, IonList, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText, IonLoading, IonButtons, IonBackButton, IonModal, IonButton, IonAlert, IonItem, IonItemDivider, IonRefresher, IonRefresherContent, IonChip, IonFooter, IonGrid, IonRow, IonCol, IonToast, IonIcon, IonPage, IonHeader, IonToolbar, IonSegment, IonSegmentButton, IonTitle, IonContent } from '@ionic/react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { open } from 'ionicons/icons';

const db = getFirestore();

const UserTeleRequestList: React.FC = () => {
  const { currentUser, verificationStatus } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'completed' | 'unsuccessful' | 'all'>('pending');
  
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const userId = currentUser?.uid;

  const [toastMessage, setToastMessage] = useState<string>('');
  const [showCancelToast, setShowCancelToast] = useState(false);

  // State for detail modal segment
  const [detailSegment, setDetailSegment] = useState<'request' | 'resident'>('request');

  useEffect(() => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (verificationStatus !== 'verified') {
      setError('You must be a verified resident to view teleconsultation requests.');
      return;
    }

    setError(null);

    const q = query(
        collection(db, 'teleconsultationRequests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const timeoutId = setTimeout(() => {
        setError('Loading timed out. Please try again.');
    }, 10000);

    const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
            console.log("Data received from Firestore. Number of documents:", querySnapshot.size);
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
                    startTime: data.startTime ? (data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime)) : undefined,
                    endTime: data.endTime ? (data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime)) : undefined,
                    notes: data.notes,
                    doctorId: data.doctorId,
                    doctorName: data.doctorName,
                    doctorSpecialty: data.doctorSpecialty,
                    meetingLink: data.meetingLink,
                    superadminMarkedComplete: data.superadminMarkedComplete,
                    rejectionReason: data.rejectionReason,
                    prescriptionUrl: data.prescriptionUrl,
                    medicalRecord: data.medicalRecord,
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
        },
        (err) => {
            clearTimeout(timeoutId);
            setError('Failed to fetch teleconsultation requests');
        }
    );

    return () => {
        clearTimeout(timeoutId);
        unsubscribe();
    };
  }, [userId, verificationStatus]);

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

  const handleViewDetails = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleCancelRequest = async () => {
    if (!requestToCancel || !currentUser) return;
    try {
      const requestRef = doc(db, 'teleconsultationRequests', requestToCancel);
      await updateDoc(requestRef, {
        status: 'cancelled',
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: 'Cancelled teleconsultation request by user',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email || 'User',
          timestamp: new Date(),
        }),
      });
      setToastMessage('Teleconsultation request cancelled.');
      setShowCancelToast(true);
      setShowModal(false);
    } catch (error) {
      console.error("Error cancelling request: ", error);
      setError("Failed to cancel the request.");
    }
    setRequestToCancel(null);
  };

    const handleRefresh = async (event: CustomEvent) => {
      // Simulate refresh delay to show loading
      setTimeout(() => {
        event.detail.complete();
      }, 1500);
    };
  
    return (    <>
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
                    Consultation Request
                    <IonChip
                      color={
                        request.status === 'pending'
                          ? 'warning'
                          : request.status === 'accepted' || request.status === 'scheduled'
                            ? 'primary'
                            : request.status === 'completed'
                              ? 'success'
                              : request.status === 'rejected' || request.status === 'cancelled' || request.status === 'no show'
                                ? 'danger'
                                : 'primary'
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
                {request.status === 'scheduled' && request.startTime && (
                  <p><strong>Scheduled Time:</strong> {request.startTime.toLocaleString()}</p>
                )}
                {request.status === 'completed' && request.startTime && (
                  <p><strong>Completed Time:</strong> {request.startTime.toLocaleString()}</p>
                )}
                {request.status === 'rejected' && (
                  <p><strong>Rejection Reason:</strong> {request.rejectionReason || 'N/A'}</p>
                )}
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                  {['pending', 'accepted'].includes(request.status) && (
                    <IonButton color="danger" onClick={() => {
                      setRequestToCancel(request.id!);
                      setShowCancelAlert(true);
                    }}>Cancel</IonButton>
                  )}
                  {request.status === 'scheduled' && request.meetingLink && (
                    <IonButton color="primary" href={request.meetingLink} target="_blank" rel="noopener noreferrer">
                      Join Consultation
                    </IonButton>
                  )}
                  {request.status === 'completed' && request.prescriptionUrl && (
                    <IonButton color="primary" href={request.prescriptionUrl} target="_blank" rel="noopener noreferrer">
                      View Prescription
                    </IonButton>
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
                <IonButton onClick={() => setShowModal(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
                    <IonContent>
                      {selectedRequest && (
                        <>
                          <IonSegment value={detailSegment} onIonChange={e => setDetailSegment(e.detail.value as 'request' | 'resident')}>
                            <IonSegmentButton value="request">
                              <IonLabel>Request Info</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="resident">
                              <IonLabel>Resident Info</IonLabel>
                            </IonSegmentButton>
                          </IonSegment>
                          <IonCard>
                            {detailSegment === 'request' && (() => {
                              const acceptanceEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Accepted teleconsultation request');
                              const rejectionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Rejected teleconsultation request');
                              const schedulingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Scheduled teleconsultation request');
                              const completionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as completed');
                              const noShowEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as no show');
                              const cancellationEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Cancelled teleconsultation request by user');
          
                              return (
                                <>
                                  {/* Request Information */}
                                  <IonItemDivider style={{ marginTop: '10px' }}>Your Request Details</IonItemDivider>
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
                                        <IonLabel>Cancelled By:</IonLabel>
                                        <IonText slot="end">{cancellationEntry.userName}</IonText>
                                      </IonItem>
                                      <IonItem>
                                        <IonLabel>Cancelled At:</IonLabel>
                                        <IonText slot="end">{cancellationEntry.timestamp.toLocaleString()}</IonText>
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
                                        <IonLabel>Rejected By:</IonLabel>
                                        <IonText slot="end">{rejectionEntry.userName}</IonText>
                                      </IonItem>
                                      <IonItem>
                                        <IonLabel>Rejected At:</IonLabel>
                                        <IonText slot="end">{rejectionEntry.timestamp.toLocaleString()}</IonText>
                                      </IonItem>
                                    </>
                                  )}
          
                                  {/* No Show Details */}
                                  {noShowEntry && (
                                    <>
                                      <IonItemDivider>No Show Details</IonItemDivider>
                                      <IonItem>
                                        <IonLabel>Marked By:</IonLabel>
                                        <IonText slot="end">{noShowEntry.userName}</IonText>
                                      </IonItem>
                                      <IonItem>
                                        <IonLabel>Marked At:</IonLabel>
                                        <IonText slot="end">{noShowEntry.timestamp.toLocaleString()}</IonText>
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
                              );
                            })()}
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
                          </IonCard>
                        </>
                      )}
          
          
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
          
                  <IonToast
                    isOpen={showCancelToast}
                    onDidDismiss={() => setShowCancelToast(false)}
                    message={toastMessage}
                    duration={2000}
                    color="danger"
                  />
          
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

                  <IonToast
                    isOpen={showCancelToast}
                    onDidDismiss={() => setShowCancelToast(false)}
                    message={toastMessage}
                    duration={2000}
                    color="danger"
                  />

                    </IonContent>
    </>
  );
};
export default UserTeleRequestList;
