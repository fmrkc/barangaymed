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
  IonGrid,
  IonRow,
  IonCol,
  IonCardSubtitle,
  IonFooter,
  IonToast,
  IonNote,
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { close, checkmark, open, personRemove, calendar, arrowBack, arrowForward, paperPlane, openOutline, checkbox } from 'ionicons/icons';
import './sa-tele-request-list.css';

const db = getFirestore();

const SuperAdminTeleRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'scheduled' | 'completed' | 'not completed' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});

  const [showAcceptAlert, setShowAcceptAlert] = useState(false);
  const [requestToAccept, setRequestToAccept] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false);
  const [requestToMarkComplete, setRequestToMarkComplete] = useState<string | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [showNoShowAlert, setShowNoShowAlert] = useState(false);
  const [requestToNoShow, setRequestToNoShow] = useState<string | null>(null);
  const [isNoShowing, setIsNoShowing] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [doctorName, setDoctorName] = useState('');

  const [meetingLink, setMeetingLink] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [showAcceptToast, setShowAcceptToast] = useState(false);
  const [showRejectToast, setShowRejectToast] = useState(false);
  const [showScheduleToast, setShowScheduleToast] = useState(false);
  const [showCompleteToast, setShowCompleteToast] = useState(false);
  const [showNoShowToast, setShowNoShowToast] = useState(false);

  // State for detail modal segment
  const [detailSegment, setDetailSegment] = useState<'request' | 'resident'>('request');


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
      case 'accepted':
        filtered = requests.filter((r) => r.status === 'accepted');
        break;
      case 'scheduled':
        filtered = requests.filter((r) => r.status === 'scheduled');
        break;
      case 'completed':
        filtered = requests.filter((r) => r.status === 'completed');
        break;
      case 'not completed':
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

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'no show', action: string, reason?: string) => {
    if (!currentUser || !currentUser.email) {
      setError('User authentication or email is required.');
      return;
    }
    try {
      const updateData: any = {
        status: status,
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: action,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email || 'Super Admin',
          timestamp: new Date(),
        }),
      };
      if (reason) {
        updateData.rejectionReason = reason;
      }
      const requestRef = doc(db, 'teleconsultationRequests', requestId);
      await updateDoc(requestRef, updateData);
    } catch (error) {
      console.error(`Error updating request to ${status}: `, error);
      setError(`Failed to update the request.`);
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestToAccept) return;
    setIsAccepting(true);
    try {
      await handleUpdateRequestStatus(requestToAccept, 'accepted', 'Accepted teleconsultation request');
      const request = requests.find(r => r.id === requestToAccept);
      setToastMessage(`You have successfully accepted ${request?.userData?.firstName} ${request?.userData?.lastName}'s teleconsultation request.`);
      setShowAcceptToast(true);
      setRequestToAccept(null);
      setShowAcceptAlert(false);
      setShowModal(false);
    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept the request.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectRequest = async (reason: string) => {
    if (!requestToReject) return;
    setIsRejecting(true);
    try {
      await handleUpdateRequestStatus(requestToReject, 'rejected', 'Rejected teleconsultation request', reason);
      setRequestToReject(null);
      setToastMessage(`Teleconsultation request rejected.`);
      setShowRejectToast(true);
      setShowRejectAlert(false);
      setShowModal(false);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject the request.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!requestToMarkComplete) return;
    setIsMarkingComplete(true);
    try {
      await handleUpdateRequestStatus(requestToMarkComplete, 'completed', 'Marked teleconsultation as completed');
      const request = requests.find(r => r.id === requestToMarkComplete);
      setToastMessage(`You have successfully marked ${request?.userData?.firstName} ${request?.userData?.lastName}'s teleconsultation request as completed.`);
      setShowCompleteToast(true);
      setRequestToMarkComplete(null);
      setShowMarkCompleteAlert(false);
      setShowModal(false);
    } catch (error) {
      console.error('Error marking request as completed:', error);
      setError('Failed to mark the request as completed.');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleNoShow = async () => {
    if (!requestToNoShow) return;
    setIsNoShowing(true);
    try {
      await handleUpdateRequestStatus(requestToNoShow, 'no show', 'Marked teleconsultation as no show');
      const request = requests.find(r => r.id === requestToNoShow);
      setToastMessage(`You have successfully marked ${request?.userData?.firstName} ${request?.userData?.lastName}'s teleconsultation request as no show.`);
      setShowNoShowToast(true);
      setRequestToNoShow(null);
      setShowNoShowAlert(false);
      setShowModal(false);
    } catch (error) {
      console.error('Error marking request as no show:', error);
      setError('Failed to mark the request as no show.');
    } finally {
      setIsNoShowing(false);
    }
  };



  const handleScheduleSubmit = async () => {
    if (!selectedRequest || !currentUser) return;
    setIsScheduling(true);
    try {
      const requestRef = doc(db, 'teleconsultationRequests', selectedRequest.id!);
      const startDateTime = new Date(`${scheduleDate}T${startTime}`);
      const endDateTime = new Date(`${scheduleDate}T${endTime}`);

      await updateDoc(requestRef, {
        status: 'scheduled',
        startTime: startDateTime,
        endTime: endDateTime,
        doctorName: doctorName,
        meetingLink: meetingLink,
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: 'Scheduled teleconsultation request',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email || 'Super Admin',
          timestamp: new Date(),
        }),
      });
      // Update local state
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: 'scheduled', startTime: startDateTime, endTime: endDateTime, doctorName, meetingLink, auditTrail: [...(r.auditTrail || []), { action: 'Scheduled teleconsultation request', userId: currentUser.uid, userEmail: currentUser.email!, userName: currentUser.displayName || currentUser.email || 'Super Admin', timestamp: new Date() }] } : r));

      setToastMessage(`Teleconsultation scheduled successfully for ${selectedRequest?.userData?.firstName} ${selectedRequest?.userData?.lastName}.`);
      setShowScheduleToast(true);
      setShowScheduleModal(false);
      // Clear form fields
      setScheduleDate('');
      setStartTime('');
      setEndTime('');
      setDoctorName('');
      setMeetingLink('');
    } catch (error) {
      console.error('Error updating request to scheduled:', error);
      setError('Failed to schedule the request.');
    } finally {
      setIsScheduling(false);
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
        <IonLoading isOpen={isAccepting} message={"Accepting request..."} />
        <IonLoading isOpen={isRejecting} message={"Rejecting request..."} />
        <IonLoading isOpen={isMarkingComplete} message={"Marking request as complete..."} />
        <IonLoading isOpen={isNoShowing} message={"Marking request as no show..."} />
        <IonLoading isOpen={isScheduling} message={"Scheduling teleconsultation..."} />
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonSegment scrollable value={filter} onIonChange={e => setFilter(e.detail.value as 'pending' | 'accepted' | 'scheduled' | 'completed' | 'not completed' | 'all')}>
          <IonSegmentButton value="pending">
            <IonLabel>Pending</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="accepted">
            <IonLabel>Accepted</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="scheduled">
            <IonLabel>Scheduled</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="not completed">
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
                    : request.status === 'rejected' || request.status === 'no show'
                    ? '#eb445a' // danger (red)
                    : request.status === 'accepted'
                    ? '#017457' // primary (green-ish)
                    : request.status === 'scheduled'
                    ? '#017457' // primary (green-ish)
                    : request.status === 'completed'
                    ? '#2dd36f' // success (green)
                    : '#017457' // default
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
                          : request.status === 'rejected' || request.status === 'no show'
                          ? 'danger'
                          : request.status === 'accepted'
                          ? 'primary'
                          : request.status === 'scheduled'
                          ? 'primary'
                          : request.status === 'completed'
                          ? 'success'
                          : 'primary'
                      }
                      style={{ margin: '0' }}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </IonChip>
                  </div>
                </IonCardTitle>
                <IonCardSubtitle>
                  Barangay: <strong>{request.barangayId}</strong>
                </IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                {request.status === 'pending' && (
                  <>
                    <p>Reason: <strong>{request.reason}</strong> </p>
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                  </>
                )}
                {request.status === 'rejected' && (
                  <>
                    <p>Rejected by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Rejected teleconsultation request')?.userName || 'N/A'}</strong> ({request.auditTrail?.slice().reverse().find(e => e.action === 'Rejected teleconsultation request')?.userEmail || 'N/A'}) </p>
                    <p>Reason: <strong>{request.rejectionReason || 'N/A'}</strong></p>
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                  </>
                )}
                {request.status === 'accepted' && (
                  <>
                    <p>Approved by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Accepted teleconsultation request')?.userName || 'N/A'} ({request.auditTrail?.slice().reverse().find(e => e.action === 'Accepted teleconsultation request')?.userEmail || 'N/A'}) </strong> </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton className='btn-25-w ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                      <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" onClick={() => handleScheduleClick(request)}>Schedule<IonIcon slot='end' icon={open} /></IonButton>
                    </div>
                  </>
                )}
                {request.status === 'scheduled' && (
                  <>
                    <p>Scheduled Date: <strong>{request.startTime ? request.startTime.toLocaleDateString() : 'N/A'}</strong></p>
                    <p>Scheduled Time: <strong>{request.startTime ? request.startTime.toLocaleTimeString() : 'N/A'}</strong></p>
                    <p>Doctor: <strong>{request.doctorName || 'N/A'}</strong></p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>
                        <IonIcon slot='icon-only' icon={open} />
                      </IonButton>
                      <IonButton className='btn-25-w ion-padding-vertical' expand='block' color="danger" onClick={() => {
                        setRequestToNoShow(request.id!);
                        setShowNoShowAlert(true);
                      }}>
                        No Show
                        <IonIcon slot='end' icon={personRemove} />
                      </IonButton>
                      <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="success" onClick={() => {
                        setRequestToMarkComplete(request.id!);
                        setShowMarkCompleteAlert(true);
                      }}>
                        Mark as Completed
                        <IonIcon slot='end' icon={checkmark} />
                      </IonButton>
                    </div>
                  </>
                )}
                {request.status === 'no show' && (
                  <>
                    <p>Marked as no-show by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as no show')?.userName || 'N/A'}</strong> ({request.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as no show')?.userEmail || 'N/A'}) </p>
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                  </>
                )}
                {request.status === 'completed' && (
                  <>
                    <p>Completed by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action.includes('completed'))?.userName || 'N/A'}</strong></p>
                    <p>Completed at: <strong>{request.updatedAt ? request.updatedAt.toLocaleString() : 'N/A'}</strong></p>
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        <IonModal isOpen={showScheduleModal} onDidDismiss={() => setShowScheduleModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Schedule Teleconsultation</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowScheduleModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonLoading isOpen={isScheduling} message="Scheduling teleconsultation..." />
            <IonCard className="ion-padding">
              <IonNote>
                Please provide the schedule and details for the teleconsultation.
              </IonNote>
            </IonCard>
            <IonCard>
              <IonCardHeader>
                <IonItem lines='none'>
                  You are scheduling for: {selectedRequest?.userData?.firstName} {selectedRequest?.userData?.lastName}
                </IonItem>
              </IonCardHeader>
              <IonCardContent>
                <IonItemDivider>Schedule Date</IonItemDivider>
                <IonItem lines='none' className='ion-margin-vertical'>
                  <IonInput
                    fill="outline"
                    type="date"
                    value={scheduleDate}
                    min={new Date().toISOString().split('T')[0]}
                    onIonChange={(e) => setScheduleDate(e.detail.value!)}
                    required
                  />
                </IonItem>
                <IonItemDivider>Start Time</IonItemDivider>
                <IonItem lines='none' className='ion-margin-vertical'>
                  <IonInput
                    fill='outline'
                    type="time"
                    value={startTime}
                    onIonChange={e => setStartTime(e.detail.value!)}
                  />
                </IonItem>
                <IonItemDivider>End Time</IonItemDivider>
                <IonItem lines='none' className='ion-margin-vertical'>
                  <IonInput
                    fill='outline'
                    type="time"
                    value={endTime}
                    onIonChange={e => setEndTime(e.detail.value!)}
                  />
                </IonItem>
                <IonItemDivider>Assigned Doctor's Name</IonItemDivider>
                <IonItem lines='none' className='ion-margin-vertical'>
                  <IonInput
                    fill='outline'
                    value={doctorName}
                    onIonChange={e => setDoctorName(e.detail.value!)}
                    placeholder="Enter doctor's name"
                  />
                </IonItem>

                <IonItemDivider>Meeting Link</IonItemDivider>
                <IonItem lines='none' className='ion-margin-vertical'>
                  <IonInput
                    fill='outline'
                    value={meetingLink}
                    onIonChange={e => setMeetingLink(e.detail.value!)}
                    placeholder="Enter meeting link"
                  />
                </IonItem>
                <IonItem>
                  <IonNote>
                    Make sure that the meeting link looks like this: <strong>https://meet.google.com/xxx-xxxx-xxx</strong> to make sure that the resident can join the meeting.
                  </IonNote>
                </IonItem>
              </IonCardContent>
            </IonCard>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonItem lines='none'>
                <small>If all fields are filled out correctly, click "Schedule" to finalize the scheduling.</small>
              </IonItem>
              <IonButton shape='round' className='ion-padding-vertical' expand="full" onClick={handleScheduleSubmit} disabled={isScheduling}>
                Schedule
                <IonIcon slot="end" icon={calendar}></IonIcon>
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

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

                    const isAccepted = !!acceptanceEntry || ['scheduled', 'completed'].includes(selectedRequest.status);
                    const isScheduled = !!schedulingEntry || ['completed'].includes(selectedRequest.status);
                    const isCompleted = !!completionEntry;
                    const isRejected = !!rejectionEntry;
                    const isNoShow = !!noShowEntry;

                    return (
                      <>
                        {/* Request Information */}
                        <IonItemDivider style={{ marginTop: '10px' }}>Request Information</IonItemDivider>
                        <IonItem>
                          <IonLabel>Request ID:</IonLabel>
                          <IonText slot="end" className="ion-text-wrap">{selectedRequest.id}</IonText>
                        </IonItem>
                        <IonItem>
                          <IonLabel>Status:</IonLabel>
                          <IonChip
                            slot="end"
                            color={
                              selectedRequest.status === 'pending'
                                ? 'warning'
                                : selectedRequest.status === 'rejected' || selectedRequest.status === 'no show'
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

                        {/* Rejection Information */}
                        {isRejected && rejectionEntry && (
                          <>
                            <IonItemDivider>Rejection Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Rejected By:</IonLabel>
                              <IonText slot="end">{rejectionEntry.userName} ({rejectionEntry.userEmail})</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Rejected At:</IonLabel>
                              <IonText slot="end">{rejectionEntry.timestamp.toLocaleString()}</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Reason:</IonLabel>
                              <IonText slot="end" className="ion-text-wrap">{selectedRequest.rejectionReason || 'N/A'}</IonText>
                            </IonItem>
                          </>
                        )}

                        {/* No Show Information */}
                        {isNoShow && noShowEntry && (
                          <>
                            <IonItemDivider>No Show Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Marked By:</IonLabel>
                              <IonText slot="end">{noShowEntry.userName} ({noShowEntry.userEmail})</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Marked At:</IonLabel>
                              <IonText slot="end">{noShowEntry.timestamp.toLocaleString()}</IonText>
                            </IonItem>
                          </>
                        )}

                        {/* Acceptance Information */}
                        {isAccepted && acceptanceEntry && (
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

                        {/* Scheduling Information */}
                        {isScheduled && (
                          <>
                            <IonItemDivider>Scheduling Details</IonItemDivider>
                            {schedulingEntry && (
                              <>
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
                            <IonItem>
                              <IonLabel>Doctor:</IonLabel>
                              <IonText slot="end">{selectedRequest.doctorName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Meeting Link:</IonLabel>
                              <IonButton expand='block' href={selectedRequest.meetingLink} target="_blank" rel="noopener noreferrer">Join</IonButton>
                            </IonItem>
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

                        {/* Completion Information */}
                        {isCompleted && completionEntry && (
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
          </IonContent>
          {selectedRequest?.status === 'pending' && (
            <IonFooter>
              <IonToolbar>
                <IonGrid>
                  <IonRow>
                    <IonCol size="3">
                      <IonButton
                        className='ion-padding-vertical'
                        shape='round'
                        fill='outline'
                        expand="block"
                        color="danger"
                        onClick={() => { setRequestToReject(selectedRequest.id!); setShowRejectAlert(true); }}
                      >
                        Reject<IonIcon slot='end' icon={close} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="9">
                      <IonButton
                        className='ion-padding-vertical'
                        shape='round'
                        expand="block"
                        color="success"
                        onClick={() => { setRequestToAccept(selectedRequest.id!); setShowAcceptAlert(true); }}
                      >
                        Accept<IonIcon slot='end' icon={checkmark} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonToolbar>
            </IonFooter>
          )}
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
          message={'Are you sure you want to reject this teleconsultation request? Please provide a reason.'}
          inputs={[
            {
              name: 'rejectionReason',
              type: 'textarea',
              placeholder: 'Reason for rejection...'
            }
          ]}
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
              handler: (data) => {
                handleRejectRequest(data.rejectionReason);
              }
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
                  handleMarkAsComplete();
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
              handler: handleNoShow
            }
          ]}
        />

        <IonToast
          isOpen={showAcceptToast}
          onDidDismiss={() => setShowAcceptToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
        />
        <IonToast
          isOpen={showRejectToast}
          onDidDismiss={() => setShowRejectToast(false)}
          message={toastMessage}
          duration={2000}
          color="danger"
        />
        <IonToast
          isOpen={showScheduleToast}
          onDidDismiss={() => setShowScheduleToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
        />
        <IonToast
          isOpen={showCompleteToast}
          onDidDismiss={() => setShowCompleteToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
        />
        <IonToast
          isOpen={showNoShowToast}
          onDidDismiss={() => setShowNoShowToast(false)}
          message={toastMessage}
          duration={2000}
          color="danger"
        />

      </IonContent>
    </IonPage>
  );
};

export default SuperAdminTeleRequestList;