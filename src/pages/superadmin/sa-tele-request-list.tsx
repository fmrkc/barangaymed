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
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonIcon,
  IonItem,
  IonInput,
  IonItemDivider,
  IonMenuButton,
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { close } from 'ionicons/icons';
import './sa-tele-request-list.css';

const db = getFirestore();

const SuperAdminTeleRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'completed' | 'unsuccessful' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});

  const [showAcceptAlert, setShowAcceptAlert] = useState(false);
  const [requestToAccept, setRequestToAccept] = useState<string | null>(null);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);
  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false);
  const [requestToMarkComplete, setRequestToMarkComplete] = useState<string | null>(null);
  const [showNoShowAlert, setShowNoShowAlert] = useState(false);
  const [requestToNoShow, setRequestToNoShow] = useState<string | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [meetingLink, setMeetingLink] = useState('');


  // Add refresher handler
  const handleRefresh = (event: CustomEvent) => {
    setLoading(true);
    // Simulate refresh delay, e.g. 1 second
    setTimeout(() => {
      setLoading(false);
      event.detail.complete();
    }, 1000);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
        collection(db, 'teleconsultationRequests'),
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
                    doctorName: data.doctorName,
                    doctorSpecialty: data.doctorSpecialty,
                    meetingLink: data.meetingLink,
                    superadminMarkedComplete: data.superadminMarkedComplete,
                    medicalRecord: data.medicalRecord,
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
  }, []);

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
        filtered = requests.filter((r) =>
          ['completed', 'pending completion'].includes(r.status)
        );
        break;
      case 'unsuccessful':
        filtered = requests.filter((r) =>
          ['rejected', 'no show'].includes(r.status)
        );
        break;
    }
    setFilteredRequests(filtered);
  }, [filter, requests]);

  const handleViewDetails = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleScheduleClick = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setShowScheduleModal(true);
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const requestRef = doc(db, 'teleconsultationRequests', requestId);
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

  const handleMarkAsComplete = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'teleconsultationRequests', requestId);
      await updateDoc(requestRef, {
        superadminMarkedComplete: true,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error marking request as complete: ', error);
      setError('Failed to mark the request as complete.');
    }
  };

  const handleNoShow = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'teleconsultationRequests', requestId);
      await updateDoc(requestRef, {
        status: 'no show',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error marking request as no show: ', error);
      setError('Failed to mark the request as no show.');
    }
  };

  const handleMarkAsCompleteForScheduled = async (requestId: string) => {
    try {
      const requestRef = doc(db, 'teleconsultationRequests', requestId);
      await updateDoc(requestRef, {
        status: 'pending completion',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error marking request as pending completion: ', error);
      setError('Failed to mark the request as pending completion.');
    }
  };

  const handleScheduleSubmit = async () => {
    if (!selectedRequest) return;

    try {
      const requestRef = doc(db, 'teleconsultationRequests', selectedRequest.id!);
      const startDateTime = new Date(`${scheduleDate}T${startTime}`);
      const endDateTime = new Date(`${scheduleDate}T${endTime}`);

      await updateDoc(requestRef, {
        status: 'scheduled',
        startTime: startDateTime,
        endTime: endDateTime,
        doctorName: doctorName,
        doctorSpecialty: doctorSpecialty,
        meetingLink: meetingLink,
        updatedAt: new Date(),
      });
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Error updating request to scheduled: ', error);
      setError('Failed to schedule the request.');
    }
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Teleconsultation Requests</IonTitle>
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
                    : request.status === 'accepted' || request.status === 'scheduled'
                    ? '#017457' // primary (blue)
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
                <p>Reason: <strong>{request.reason}</strong></p>
                <p>Approved by: <strong>Not yet implemented</strong> </p>
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
                    <IonButton color="primary" onClick={() => handleScheduleClick(request)}>Schedule</IonButton>
                  )}
                  {request.status === 'scheduled' && (
                    <>
                      <IonButton color="success" onClick={() => {
                        setRequestToMarkComplete(request.id!);
                        setShowMarkCompleteAlert(true);
                      }}>Mark as Complete</IonButton>
                      <IonButton color="danger" onClick={() => {
                        setRequestToNoShow(request.id!);
                        setShowNoShowAlert(true);
                      }}>No Show</IonButton>
                    </>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        <IonModal isOpen={showScheduleModal} onDidDismiss={() => setShowScheduleModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Schedule Teleconsultation</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowScheduleModal(false)}>Cancel</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonItem>
              <IonLabel position="stacked">Date</IonLabel>
              <IonInput type="date" value={scheduleDate} onIonChange={e => setScheduleDate(e.detail.value!)} min={new Date().toISOString().split('T')[0]} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Start Time</IonLabel>
              <IonInput type="time" value={startTime && endTime} onIonChange={e => setStartTime(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">End Time</IonLabel>
              <IonInput type="time" value={endTime} onIonChange={e => setEndTime(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Assigned Doctor's Name</IonLabel>
              <IonInput type="text" value={doctorName} onIonChange={e => setDoctorName(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Doctor's Specialty</IonLabel>
              <IonInput type="text" value={doctorSpecialty} onIonChange={e => setDoctorSpecialty(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Meeting Link</IonLabel>
              <IonInput type="text" value={meetingLink} onIonChange={e => setMeetingLink(e.detail.value!)} />
            </IonItem>
            <IonButton expand="full" onClick={() => handleScheduleSubmit()}>Save</IonButton>
          </IonContent>
        </IonModal>

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
                        : selectedRequest.status === 'accepted' || selectedRequest.status === 'scheduled'
                        ? 'primary'
                        : selectedRequest.status === 'completed'
                        ? 'success'
                        : 'danger'
                    } style={{ fontWeight: 'bold'}}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </IonText>
                  </IonLabel>
                </IonItem>
                {selectedRequest.meetingLink && (
                  <IonButton expand='block' className='ion-padding' href={selectedRequest.meetingLink} target="_blank" rel="noopener noreferrer">
                    Join Consultation (opens Google Meet)
                  </IonButton>
                )}

                {selectedRequest.startTime && (
                  <IonItem>
                    <IonLabel>
                      Scheduled Time: &nbsp;
                      <IonText>{selectedRequest.startTime.toLocaleString()}</IonText>
                    </IonLabel>
                  </IonItem>
                )}
                {selectedRequest.endTime && (
                  <IonItem>
                    <IonLabel>
                      End Time: &nbsp;
                      <IonText>{selectedRequest.endTime.toLocaleString()}</IonText>
                    </IonLabel>
                  </IonItem>
                )}

                {selectedRequest.notes && (
                  <IonItem>
                    <IonLabel>
                      Notes: &nbsp;
                      <IonText>{selectedRequest.notes}</IonText>
                    </IonLabel>
                  </IonItem>
                )}
               
                {selectedRequest.doctorName && (
                  <IonItem>
                    <IonLabel>
                      Doctor's Name: &nbsp;
                      <IonText>{selectedRequest.doctorName}</IonText>
                    </IonLabel>
                  </IonItem>
                )}
                {selectedRequest.doctorSpecialty && (
                  <IonItem>
                    <IonLabel>
                      Doctor's Specialty: &nbsp;
                      <IonText>{selectedRequest.doctorSpecialty}</IonText>
                    </IonLabel>
                  </IonItem>
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

                {selectedRequest.medicalRecord && (
                  <>
                    <IonItemDivider style={{ marginTop: '20px' }}>Medical Record</IonItemDivider>
                    {selectedRequest.medicalRecord.symptoms.length > 0 && (
                      <IonItem>
                        <IonLabel>
                          Symptoms: &nbsp;
                          <IonText>{selectedRequest.medicalRecord.symptoms.join(', ')}</IonText>
                        </IonLabel>
                      </IonItem>
                    )}
                    {selectedRequest.medicalRecord.conditions.length > 0 && (
                      <IonItem>
                        <IonLabel>
                          Conditions: &nbsp;
                          <IonText>{selectedRequest.medicalRecord.conditions.join(', ')}</IonText>
                        </IonLabel>
                      </IonItem>
                    )}
                    {selectedRequest.medicalRecord.allergies.length > 0 && (
                      <IonItem>
                        <IonLabel>
                          Allergies: &nbsp;
                          <IonText>{selectedRequest.medicalRecord.allergies.join(', ')}</IonText>
                        </IonLabel>
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
                            <IonButton slot="end" fill="outline" onClick={() => window.open(file.fileURL, '_blank')}>
                              View
                            </IonButton>
                          </IonItem>
                        ))}
                      </>
                    )}
                  </>
                )}
                
              </IonCard>
            )}

          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showAcceptAlert}
          onDidDismiss={() => setShowAcceptAlert(false)}
          header={'Confirm Accept'}
          message={'Are you sure you want to accept this teleconsultation request?'}
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
          message={'Are you sure you want to reject this teleconsultation request?'}
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
                  handleMarkAsCompleteForScheduled(requestToMarkComplete);
                  setRequestToMarkComplete(null);
                }
              }
            }
          ]}
        />
        <IonAlert
          isOpen={showNoShowAlert}
          onDidDismiss={() => setShowNoShowAlert(false)}
          header={'Confirm No Show'}
          message={'Are you sure you want to mark this teleconsultation request as no show?'}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => {
                setRequestToNoShow(null);
              }
            },
            {
              text: 'Yes',
              handler: () => {
                if (requestToNoShow) {
                  handleNoShow(requestToNoShow);
                  setRequestToNoShow(null);
                }
              }
            }
          ]}
        />

      </IonContent>
    </IonPage>
  );
};

export default SuperAdminTeleRequestList;
