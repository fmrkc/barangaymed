import React, { useEffect, useState, useMemo } from 'react';
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
  IonSelectOption,
  IonSelect,
  IonSearchbar,
  IonToggle,
  IonSkeletonText,
  IonTextarea,
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, arrayUnion, getDoc, UpdateData } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { Region, Province, CityMunicipality, Barangay, getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality } from '../../services/addressService';
import { close, checkmark, checkmarkCircle, open, personRemove, calendar, arrowBack, arrowForward, paperPlane, openOutline, checkbox, filter, filterOutline, cloudUpload, checkmarkDone, archiveOutline, chevronUp, chevronDown, closeCircleOutline } from 'ionicons/icons';
import './sa-tele-request-list.css';

import { useIonRouter } from '@ionic/react';
import { FirestoreAuditTrailEntry } from '../../types/medicine';

const db = getFirestore();
const functions = getFunctions();
const sendSmsCloudFunction = httpsCallable(functions, 'sendSmsNotification');

const sendSms = async (userId: string, message: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const recipientContactNumber = userData?.contactNumber;
      if (recipientContactNumber) {
        await sendSmsCloudFunction({ recipientContactNumber, message });
        console.log('SMS sent successfully!');
      } else {
        console.warn('User has no contact number for SMS notification.');
      }
    } else {
      console.warn('User document not found for SMS notification.');
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
};

const SuperAdminTeleRequestList: React.FC = () => {
  const ionRouter = useIonRouter();
  const { currentUser, cityMunicipalityId } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'scheduled' | 'completed' | 'not completed'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangayFilter, setSelectedBarangayFilter] = useState('all');

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
  const [showConfirmCompleteAlert, setShowConfirmCompleteAlert] = useState(false);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [completionStep, setCompletionStep] = useState(1);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);

  const barangayFilterOptions = useMemo(() => {
    const uniqueBarangays = new Map<string, string>();
    requests.forEach(req => {
      if (req.barangayId && req.barangayName) {
        uniqueBarangays.set(req.barangayId, req.barangayName);
      }
    });
    return Array.from(uniqueBarangays.entries()).map(([id, name]) => ({ id, name }));
  }, [requests]);

  // State for detail modal segment
  const [detailSegment, setDetailSegment] = useState<'request' | 'resident'>('request');

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedTeleconsultationRequests, setArchivedTeleconsultationRequests] = useState<{[key: string]: TeleconsultationRequest[]}>({});
  const [openArchiveGroup, setOpenArchiveGroup] = useState<string | null>(null);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveSelectedBarangayFilter, setArchiveSelectedBarangayFilter] = useState('all');

  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [cancelledTeleconsultationRequests, setCancelledTeleconsultationRequests] = useState<{ [key: string]: TeleconsultationRequest[] }>({});
  const [openCancelledGroup, setOpenCancelledGroup] = useState<string | null>(null);
  const [cancelledSearchQuery, setCancelledSearchQuery] = useState('');
  const [cancelledSelectedBarangayFilter, setCancelledSelectedBarangayFilter] = useState('all');


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
        orderBy('createdAt', 'asc')
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
                    barangayName: data.barangayName,
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
                    cancellationReason: data.cancellationReason,
                    prescriptionUrl: data.prescriptionUrl,
                    medicalRecord: data.medicalRecord,
                    isShown: data.isShown, // Add isShown property
                    auditTrail: data.auditTrail ? data.auditTrail.map((entry: FirestoreAuditTrailEntry) => ({
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
    let filtered: TeleconsultationRequest[] = requests;

    // Filter by status
    switch (filter) {
      case 'pending':
        filtered = filtered.filter((r) => r.status === 'pending');
        break;
      case 'accepted':
        filtered = filtered.filter((r) => r.status === 'accepted');
        break;
      case 'scheduled':
        filtered = filtered.filter((r) => r.status === 'scheduled');
        break;
      case 'completed':
        filtered = filtered.filter((r) => r.status === 'completed' && (r as any).isShown !== false);
        break;
      case 'not completed':
        filtered = filtered.filter((r) =>
          ['rejected', 'no show', 'cancelled'].includes(r.status) && (r as any).isShown !== false
        );
        break;
      default:
        // No status filter needed
        break;
    }

    // Filter by barangay
    if (selectedBarangayFilter !== 'all') {
      filtered = filtered.filter(r => r.barangayId === selectedBarangayFilter);
    }

    setFilteredRequests(filtered.filter(request =>
      request.userData?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.userData?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id?.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [filter, requests, selectedBarangayFilter, searchQuery]);

  useEffect(() => {
    let archived = requests.filter(r =>
        (r as any).isShown === false &&
        ['completed', 'rejected', 'cancelled', 'no show'].includes(r.status)
    );

    // Apply search query to archived requests
    if (archiveSearchQuery) {
      archived = archived.filter(request =>
        request.userData?.firstName?.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
        request.userData?.lastName?.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
        request.id?.toLowerCase().includes(archiveSearchQuery.toLowerCase())
      );
    }

    // Apply barangay filter to archived requests
    if (archiveSelectedBarangayFilter !== 'all') {
      archived = archived.filter(r => r.barangayId === archiveSelectedBarangayFilter);
    }

    const grouped = archived.reduce((acc, request) => {
        const date = request.createdAt;
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(request);
        return acc;
    }, {} as {[key: string]: TeleconsultationRequest[]});

    setArchivedTeleconsultationRequests(grouped);
}, [requests, archiveSearchQuery, archiveSelectedBarangayFilter]);

  useEffect(() => {
    let cancelled = requests.filter(r => r.status === 'cancelled');

    // Apply search query to cancelled requests
    if (cancelledSearchQuery) {
      cancelled = cancelled.filter(request =>
        request.userData?.firstName?.toLowerCase().includes(cancelledSearchQuery.toLowerCase()) ||
        request.userData?.lastName?.toLowerCase().includes(cancelledSearchQuery.toLowerCase()) ||
        request.id?.toLowerCase().includes(cancelledSearchQuery.toLowerCase())
      );
    }

    // Apply barangay filter to cancelled requests
    if (cancelledSelectedBarangayFilter !== 'all') {
      cancelled = cancelled.filter(r => r.barangayId === cancelledSelectedBarangayFilter);
    }

    const grouped = cancelled.reduce((acc, request) => {
        const date = request.createdAt;
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(request);
        return acc;
    }, {} as {[key: string]: TeleconsultationRequest[]});

    setCancelledTeleconsultationRequests(grouped);
  }, [requests, cancelledSearchQuery, cancelledSelectedBarangayFilter]);

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
      const requestRef = doc(db, 'teleconsultationRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        setError('Teleconsultation request not found.');
        return;
      }
      const requestData = requestDoc.data() as TeleconsultationRequest;

      const updateData: UpdateData<TeleconsultationRequest> = {
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
      await updateDoc(requestRef, updateData);

      let smsMessage = '';
      switch (status) {
        case 'accepted':
          smsMessage = `Your teleconsultation request has been accepted.`;
          break;
        case 'rejected':
          smsMessage = `Your teleconsultation request has been rejected.`;
          break;
        case 'no show':
          smsMessage = `Your teleconsultation request has been marked as no-show.`;
          break;
      }
      if (smsMessage && requestData.userId) {
        await sendSms(requestData.userId, smsMessage);
      }

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setToastMessage('Invalid file type. Only PNG, JPG, and JPEG are allowed.');
        setShowRejectToast(true); // Using reject toast for error color
        setPrescriptionFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > maxSize) {
        setToastMessage('File size exceeds 5MB limit.');
        setShowRejectToast(true); // Using reject toast for error color
        setPrescriptionFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setPrescriptionFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPrescriptionPreview(previewUrl);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!requestToMarkComplete) return;
    setIsMarkingComplete(true);

    const request = requests.find(r => r.id === requestToMarkComplete);
    if (!request) {
      setError('Teleconsultation request not found.');
      setIsMarkingComplete(false);
      return;
    }

    try {
      let prescriptionUrl = '';
      if (hasPrescription && prescriptionFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `prescriptions/teleconsultation/${requestToMarkComplete}/${prescriptionFile.name}`);
        await uploadBytes(storageRef, prescriptionFile);
        prescriptionUrl = await getDownloadURL(storageRef);
      }

      const requestRef = doc(db, 'teleconsultationRequests', requestToMarkComplete);
      const updateData: any = {
        status: 'completed',
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: 'Marked teleconsultation as completed',
          userId: currentUser!.uid,
          userEmail: currentUser!.email!,
          userName: currentUser!.displayName || currentUser!.email || 'Super Admin',
          timestamp: new Date(),
        }),
      };

      if (prescriptionUrl) {
        updateData.prescriptionUrl = prescriptionUrl;
      }

      await updateDoc(requestRef, updateData);

      // Send SMS notification
      if (request && request.userId) {
        let smsMessage = `Your teleconsultation request has been marked as completed.`;
        if (prescriptionUrl) {
          smsMessage += ` A prescription has been uploaded.`;
        }
        await sendSms(request.userId, smsMessage);
      }

      // Use the request already retrieved above for the toast message
      setToastMessage(`You have successfully marked ${request?.userData?.firstName} ${request?.userData?.lastName}'s teleconsultation request as completed.`);
      setShowCompleteToast(true);
      setShowModal(false);

      setCompletionStep(2);

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



  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes, 0, 0);
      endDate.setHours(endDate.getHours() - 1);
      const startHours = endDate.getHours().toString().padStart(2, '0');
      const startMinutes = endDate.getMinutes().toString().padStart(2, '0');
      setStartTime(`${startHours}:${startMinutes}`);
    }
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      startDate.setHours(startDate.getHours() + 1);
      const endHours = startDate.getHours().toString().padStart(2, '0');
      const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
      setEndTime(`${endHours}:${endMinutes}`);
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

      // Send SMS notification
      if (selectedRequest.userId) {
        const smsMessage = 'Your teleconsultation request has been scheduled.';
        await sendSms(selectedRequest.userId, smsMessage);
      }

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

  const handleGoToCreateMedicineRequest = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setCompletionStep(2);
    setShowCompleteModal(true);
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Teleconsultation Requests</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowCancelledModal(true)}>
              <IonIcon icon={closeCircleOutline} slot='icon-only' />
            </IonButton>
            <IonButton onClick={() => setShowArchiveModal(true)}>
              <IonIcon icon={archiveOutline} slot='icon-only' />
            </IonButton>
          </IonButtons>
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
        <IonSegment scrollable value={filter} onIonChange={e => setFilter(e.detail.value as 'pending' | 'accepted' | 'scheduled' | 'completed' | 'not completed')}>
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
        </IonSegment>
         <IonToolbar>
          <IonSearchbar value={searchQuery} onIonInput={e => setSearchQuery(e.detail.value!)} placeholder="Search by resident name or request ID..." showClearButton="always" />
        </IonToolbar>
        <IonToolbar className='ion-padding-horizontal'>
           <IonSelect value={selectedBarangayFilter} placeholder="Filter by Barangay" onIonChange={e => setSelectedBarangayFilter(e.detail.value)}>
            <IonSelectOption value="all">All Barangays</IonSelectOption>
            {barangayFilterOptions.map(b => (
              <IonSelectOption key={b.id} value={b.id}>{b.name}</IonSelectOption>
            ))}
          </IonSelect>
        </IonToolbar>

        {/* Archive Modal */}
        <IonModal isOpen={showArchiveModal} onDidDismiss={() => setShowArchiveModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Archived Teleconsultation Requests</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowArchiveModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
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
                <IonSearchbar value={archiveSearchQuery} onIonInput={e => setArchiveSearchQuery(e.detail.value!)} placeholder="Search by resident name or request ID..." showClearButton="always" />
            </IonToolbar>
            <IonToolbar className="ion-padding-horizontal">
                <IonSelect value={archiveSelectedBarangayFilter} placeholder="Filter by Barangay" onIonChange={e => setArchiveSelectedBarangayFilter(e.detail.value)}>
                    <IonSelectOption value="all">All Barangays</IonSelectOption>
                    {barangayFilterOptions.map(b => (
                        <IonSelectOption key={b.id} value={b.id}>{b.name}</IonSelectOption>
                    ))}
                </IonSelect>
            </IonToolbar>

            {Object.keys(archivedTeleconsultationRequests).length === 0 ? (
                <IonCard className="ion-padding"><IonText>No archived teleconsultation requests found.</IonText></IonCard>
            ) : (
                <IonList>
                    {Object.keys(archivedTeleconsultationRequests).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(groupKey => (
                        <div key={groupKey}>
                                  <IonItem button onClick={() => setOpenArchiveGroup(openArchiveGroup === groupKey ? null : groupKey)}>
                                    <IonLabel>{groupKey}</IonLabel>
                                    <IonIcon icon={openArchiveGroup === groupKey ? chevronUp : chevronDown} slot="end" />
                                  </IonItem>  {openArchiveGroup === groupKey && (
                                <IonList>
                                    {archivedTeleconsultationRequests[groupKey].map(request => renderArchivedTeleconsultationCard(request, handleViewDetails))}
                                </IonList>
                            )}
                        </div>
                    ))}
                </IonList>
            )}
          </IonContent>
        </IonModal>

        {loading && (
          <IonList style={{ backgroundColor: 'transparent' }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <IonCard key={index}>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonSkeletonText animated style={{ width: '60%' }} />
                  </IonCardTitle>
                  <IonCardSubtitle>
                    <IonSkeletonText animated style={{ width: '40%' }} />
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSkeletonText animated style={{ width: '80%', marginBottom: '8px' }} />
                  <IonSkeletonText animated style={{ width: '90%', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <IonSkeletonText animated style={{ flex: 1, height: '40px' }} />
                    <IonSkeletonText animated style={{ flex: 1, height: '40px' }} />
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
                    : request.status === 'rejected' || request.status === 'no show' || request.status === 'cancelled'
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
                     Request ID: {request.id}

                    <IonChip
                      color={
                        request.status === 'pending'
                          ? 'warning'
                          : request.status === 'rejected' || request.status === 'no show' || request.status === 'cancelled'
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
                  Barangay: <strong>{request.barangayName || request.barangayId}</strong>
                </IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                {request.status === 'pending' && (
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                )}
                {request.status === 'rejected' && (
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                )}
                {request.status === 'accepted' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton className='btn-25-w ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                      <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" onClick={() => handleScheduleClick(request)}>Schedule<IonIcon slot='end' icon={open} /></IonButton>
                    </div>
                )}
                {request.status === 'scheduled' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton className='btn-25-w ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>
                        View Details
                        <IonIcon slot='end' icon={open} />
                      </IonButton>
                      {request.meetingLink && (
                        <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" href={request.meetingLink} target="_blank" rel="noopener noreferrer">
                          Join Meeting
                          <IonIcon slot='end' icon={open} />
                        </IonButton>
                      )}
                    </div>
                )}
                {request.status === 'no show' && (
                  <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                )}
                {request.status === 'cancelled' && (
                  <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                )}
                {request.status === 'completed' && (
                  <>
                    <div style={{ display: 'flex', gap: '10px' }}>
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)} style={{ flex: 1 }}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                    <IonButton expand='block' className='ion-padding-vertical' onClick={() => handleGoToCreateMedicineRequest(request)} style={{ flex: 1 }}>
                        Create Medicine Request
                        <IonIcon slot='end' icon={open} />
                    </IonButton>
                    </div>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        {/* Cancelled Requests Modal */}
        <IonModal isOpen={showCancelledModal} onDidDismiss={() => setShowCancelledModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Cancelled Teleconsultation Requests</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowCancelledModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonCard className="ion-padding-horizontal">
                <IonItem lines="none">
                    <IonText>
                        <p>This section shows all teleconsultation requests that have been cancelled by users. They are grouped by month and year for easier tracking.</p>
                    </IonText>
                </IonItem>
            </IonCard>

            <IonToolbar>
                <IonSearchbar value={cancelledSearchQuery} onIonInput={e => setCancelledSearchQuery(e.detail.value!)} placeholder="Search by resident name or request ID..." showClearButton="always" />
            </IonToolbar>
            <IonToolbar className="ion-padding-horizontal">
                <IonSelect value={cancelledSelectedBarangayFilter} placeholder="Filter by Barangay" onIonChange={e => setCancelledSelectedBarangayFilter(e.detail.value)}>
                    <IonSelectOption value="all">All Barangays</IonSelectOption>
                    {barangayFilterOptions.map(b => (
                        <IonSelectOption key={b.id} value={b.id}>{b.name}</IonSelectOption>
                    ))}
                </IonSelect>
            </IonToolbar>

            {Object.keys(cancelledTeleconsultationRequests).length === 0 ? (
                <IonCard className="ion-padding"><IonText>No cancelled requests found.</IonText></IonCard>
            ) : (
                <IonList>
                    {Object.keys(cancelledTeleconsultationRequests).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(groupKey => (
                        <div key={groupKey}>
                                  <IonItem button onClick={() => setOpenCancelledGroup(openCancelledGroup === groupKey ? null : groupKey)}>
                                    <IonLabel>{groupKey}</IonLabel>
                                    <IonIcon icon={openCancelledGroup === groupKey ? chevronUp : chevronDown} slot="end" />
                                  </IonItem>  {openCancelledGroup === groupKey && (
                                <IonList>
                                    {cancelledTeleconsultationRequests[groupKey].map(request => renderCancelledTeleconsultationCard(request, handleViewDetails))}
                                </IonList>
                            )}
                        </div>
                    ))}
                </IonList>
            )}
          </IonContent>
        </IonModal>

        {/* Archive Modal */}
        <IonModal isOpen={showArchiveModal} onDidDismiss={() => setShowArchiveModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Archived Teleconsultation Requests</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowArchiveModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
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
                <IonSearchbar value={archiveSearchQuery} onIonInput={e => setArchiveSearchQuery(e.detail.value!)} placeholder="Search by resident name or request ID..." showClearButton="always" />
            </IonToolbar>
            <IonToolbar className="ion-padding-horizontal">
                <IonSelect value={archiveSelectedBarangayFilter} placeholder="Filter by Barangay" onIonChange={e => setArchiveSelectedBarangayFilter(e.detail.value)}>
                    <IonSelectOption value="all">All Barangays</IonSelectOption>
                    {barangayFilterOptions.map(b => (
                        <IonSelectOption key={b.id} value={b.id}>{b.name}</IonSelectOption>
                    ))}
                </IonSelect>
            </IonToolbar>

            {Object.keys(archivedTeleconsultationRequests).length === 0 ? (
                <IonCard className="ion-padding"><IonText>No archived teleconsultation requests found.</IonText></IonCard>
            ) : (
                <IonList>
                    {Object.keys(archivedTeleconsultationRequests).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(groupKey => (
                        <div key={groupKey}>
                                  <IonItem button onClick={() => setOpenArchiveGroup(openArchiveGroup === groupKey ? null : groupKey)}>
                                    <IonLabel>{groupKey}</IonLabel>
                                    <IonIcon icon={openArchiveGroup === groupKey ? chevronUp : chevronDown} slot="end" />
                                  </IonItem>  {openArchiveGroup === groupKey && (
                                <IonList>
                                    {archivedTeleconsultationRequests[groupKey].map(request => renderArchivedTeleconsultationCard(request, handleViewDetails))}
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
              <IonButtons slot="start">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
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
                  {detailSegment === 'request' && (() => {
                    const acceptanceEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Accepted teleconsultation request');
                    const rejectionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Rejected teleconsultation request');
                    const schedulingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Scheduled teleconsultation request');
                    const completionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as completed');
                    const noShowEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked teleconsultation as no show');
                    const cancellationEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Cancelled teleconsultation request by user');

                    const isAccepted = !!acceptanceEntry || ['scheduled', 'completed'].includes(selectedRequest.status);
                    const isScheduled = !!schedulingEntry || ['completed'].includes(selectedRequest.status);
                    const isCompleted = !!completionEntry;
                    const isRejected = !!rejectionEntry;
                    const isNoShow = !!noShowEntry;
                    const isCancelled = !!cancellationEntry;

                    return (
                      <>
                        {/* Request Information */}
                        <IonCard>
                          <IonItemDivider style={{ marginTop: '10px' }}>Request Information</IonItemDivider>
                        <IonItem className='ion-margin-top'>
                          <IonLabel>Request ID:</IonLabel>
                          <IonText slot="end" className="ion-text-wrap">{selectedRequest.id}</IonText>
                        </IonItem>
                        <IonItem className='ion-margin-top'>
                          <IonLabel>Requested At:</IonLabel>
                          <IonText slot="end">{selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</IonText>
                        </IonItem>
                        <IonItem className='ion-margin-top'>
                          <IonLabel>Status:</IonLabel>
                          <IonChip
                            slot="end"
                            color={
                              selectedRequest.status === 'pending'
                                ? 'warning'
                                : selectedRequest.status === 'rejected' || selectedRequest.status === 'no show' || selectedRequest.status === 'cancelled'
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
                        <IonItem lines='none'>
                          <IonLabel>Reason:</IonLabel>
                        </IonItem>
                        <IonItem lines='none' className='ion-margin-bottom'>
                             <IonTextarea  fill='outline' readonly value={selectedRequest.reason}></IonTextarea>
                        </IonItem>
                        {selectedRequest.uploadedFile && (
                          <IonItem>
                            <IonLabel>Uploaded File:</IonLabel>
                            <IonButton slot="end" fill="outline" size="small" onClick={() => window.open(selectedRequest.uploadedFile!.url, '_blank')}>
                                View {selectedRequest.uploadedFile.name}
                            </IonButton>
                          </IonItem>
                        )}
                        </IonCard>
                        
                        {/* Cancellation Information */}
                        {isCancelled && cancellationEntry && (
                          <IonCard>
                            <IonItemDivider>Cancellation Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>
                                Cancelled By: {cancellationEntry.userName}
                                <p>({cancellationEntry.userEmail}) at {cancellationEntry.timestamp.toLocaleString()}</p>
                              </IonLabel>
                            </IonItem>
                            <IonItem lines='none'>
                              <IonLabel>Cancellation Reason:</IonLabel>
                            </IonItem>
                            <IonItem lines='none' className='ion-margin-bottom'>
                              <IonTextarea fill='outline' readonly value={selectedRequest.cancellationReason}></IonTextarea>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* Rejection Information */}
                        {isRejected && rejectionEntry && (
                          <IonCard>
                            <IonItemDivider>Rejection Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Rejected By: {rejectionEntry.userName}
                                <p>({rejectionEntry.userEmail}) at {rejectionEntry.timestamp.toLocaleString()}</p>
                              </IonLabel>
                            </IonItem>
                            <IonItem lines='none'>
                              <IonLabel>Rejection Reason:</IonLabel>
                            </IonItem>
                            <IonItem lines='none' className='ion-margin-bottom'>
                              <IonTextarea fill='outline' readonly value={selectedRequest.rejectionReason}></IonTextarea>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* No Show Information */}
                        {isNoShow && noShowEntry && (
                          <IonCard>
                            <IonItemDivider>No Show Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Marked By:</IonLabel>
                              <IonText slot="end">{noShowEntry.userName} ({noShowEntry.userEmail})</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Marked At:</IonLabel>
                              <IonText slot="end">{noShowEntry.timestamp.toLocaleString()}</IonText>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* Acceptance Information */}
                        {isAccepted && acceptanceEntry && (
                          <IonCard>
                            <IonItemDivider>Acceptance Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>
                                Accepted By: {acceptanceEntry.userName}
                                <p>({acceptanceEntry.userEmail}) at {acceptanceEntry.timestamp.toLocaleString()}</p>
                              </IonLabel>
                              <IonText slot="end"> </IonText>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* Scheduling Information */}
                        {isScheduled && (
                          <IonCard>
                            <IonItemDivider>Scheduling Details</IonItemDivider>
                            
                            <IonItem>
                              <IonLabel>Assigned Professional:</IonLabel>
                              <IonText slot="end">{selectedRequest.doctorName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Scheduled Time: </IonLabel>
                              <IonText slot="end">{selectedRequest.startTime ? selectedRequest.startTime.toLocaleString() : 'N/A'} - {selectedRequest.endTime ? selectedRequest.endTime.toLocaleString() : 'N/A'}</IonText>
                            </IonItem>
                            {schedulingEntry && (
                                <IonItem>
                                  <IonLabel>Scheduled By: {schedulingEntry.userName}
                                  <p>{schedulingEntry.userEmail} at {schedulingEntry.timestamp.toLocaleString()}</p>
                                  </IonLabel>
                                </IonItem>
                            )}
                          </IonCard>
                        )}

                        {/* Completion Information */}
                        {isCompleted && completionEntry && (
                          <IonCard>
                            <IonItemDivider>Completion Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Completed By: {completionEntry.userName}
                                <p>{completionEntry.userEmail} at {completionEntry.timestamp.toLocaleString()}</p>
                              </IonLabel>
                            </IonItem>
                            {selectedRequest.prescriptionUrl && (
                            <IonItem>
                                <IonLabel>Prescription:</IonLabel>
                                <IonButton slot="end" fill="outline" size="small" href={selectedRequest.prescriptionUrl} target="_blank" rel="noopener noreferrer">
                                    View Prescription
                                </IonButton>
                            </IonItem>
                            )}
                          </IonCard>
                        )}
                      </>
                    );
                  })()}
                  {detailSegment === 'resident' && (
                    <>
                     
                      {selectedRequest.userData && (
                        <IonCard>
                          <IonItemDivider style={{ marginTop: '10px' }}>Resident Information</IonItemDivider>
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
                        </IonCard>
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
          {selectedRequest?.status === 'scheduled' && (
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
                        onClick={() => { setRequestToNoShow(selectedRequest.id!); setShowNoShowAlert(true); }}
                      >
                        No Show<IonIcon slot='end' icon={personRemove} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="9">
                      <IonButton
                        className='ion-padding-vertical'
                        shape='round'
                        expand="block"
                        color="success"
                        onClick={() => {
                          setRequestToMarkComplete(selectedRequest.id!); 
                          setCompletionStep(1);
                          setShowCompleteModal(true);
                        }}
                      >
                        Mark as Completed<IonIcon slot='end' icon={checkmark} />
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
        <IonModal isOpen={showCompleteModal} onDidDismiss={() => {
          setShowCompleteModal(false);
          setHasPrescription(false);
          setPrescriptionFile(null);
          setCompletionStep(1);
        }}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Complete Teleconsultation</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowCompleteModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {completionStep === 1 && (
              <>
               <IonCard>
                <IonCardHeader>
                  <IonItem lines='none'>
                    <IonCardTitle>You are about to complete a teleconsultation request.</IonCardTitle>
                  </IonItem>
                  <IonItem lines='none'>
                    <IonCardSubtitle>
                      You can either choose to upload a prescription provided by the doctor or complete the teleconsultation without uploading any prescription. If you choose to upload a prescription, you will be redirected to the Create Medicine Request page after marking the teleconsultation as complete.
                    </IonCardSubtitle>
                  </IonItem>
                </IonCardHeader>
              </IonCard>
              <IonCard>
                <IonCardHeader>
                  <IonItem lines='none'>
                    <IonCardTitle>Upload Prescription (Optional)</IonCardTitle>
                  </IonItem>
                  <IonItem lines='none'>
                    <IonCardSubtitle>
                      If the doctor has provided a prescription for the resident, you may upload it here. Doing this step will require you to navigate to the <strong>Create Medicine Request</strong> page after marking the teleconsultation as complete.
                    </IonCardSubtitle>
                  </IonItem>
                </IonCardHeader>
                  <IonCardContent>
                  <IonItem lines='none'>
                    <IonLabel>Upload Doctor's Prescription</IonLabel>
                    <IonToggle slot='end' checked={hasPrescription} onIonChange={e => setHasPrescription(e.detail.checked)} />
                  </IonItem>
                  {hasPrescription && (
                    <>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <IonButton fill='outline' className='ion-padding-vertical ' expand="block" onClick={() => fileInputRef.current?.click()}>
                        Upload Image or File
                        <IonIcon slot="end" icon={cloudUpload} />
                      </IonButton>
                      <IonItem lines="none">
                        <small>Accepted file types: PNG, JPG, JPEG. Maximum file size: 5MB.</small>
                      </IonItem>
                      {prescriptionFile && (
                        <IonItem lines="none">
                          <IonLabel>Uploaded file: {prescriptionFile.name}</IonLabel>
                        </IonItem>
                      )}
                      {prescriptionPreview && (
                        <IonItem lines="none">
                          <img src={prescriptionPreview} alt="Prescription Preview" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                        </IonItem>
                      )}
                    </>
                  )}
                </IonCardContent>
              </IonCard>
              <IonCard>
                
              </IonCard>
              </>
            )}
            {completionStep === 2 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <IonCard style={{ maxWidth: '450px', textAlign: 'center' }}>
                    <IonCardHeader>
                      <IonText class='ion-text-center'>
                        <IonIcon icon={checkmarkCircle} style={{ fontSize: '48px', color: 'var(--ion-color-primary)' }} />
                      </IonText>
                      <IonCardTitle>Teleconsultation Completed</IonCardTitle>
                    </IonCardHeader>
                      <IonCardContent>
                  <p>This consultation request has been completed. You can now proceed to create a medicine request for the resident.</p>
                  <IonButton expand="block" className="ion-padding-vertical" onClick={() => {
                    ionRouter.push('/superadmin/dashboard/create-med-request');
                    setShowCompleteModal(false);
                  }}>
                    Go to Create Medicine Request
                    <IonIcon slot="end" icon={open} />
                  </IonButton>
                </IonCardContent>
                  </IonCard>
        </div>
              </>
            )}
          </IonContent>
          {completionStep === 1 && (
            <IonFooter>
              <IonToolbar>
                <IonButton className='ion-padding-vertical' shape='round' expand="full" color="success" onClick={() => setShowConfirmCompleteAlert(true)} disabled={isMarkingComplete || (hasPrescription && !prescriptionFile)}>
                  Confirm Completion
                  <IonIcon slot="end" icon={checkmarkDone} />
                </IonButton>
              </IonToolbar>
            </IonFooter>
          )}
        </IonModal>


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

        <IonAlert
          isOpen={showConfirmCompleteAlert}
          onDidDismiss={() => setShowConfirmCompleteAlert(false)}
          header={'Confirm Completion'}
          message={'Are you sure you want to mark this teleconsultation request as completed?'}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
            },
            {
              text: 'Yes',
              handler: handleMarkAsComplete
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

const renderCancelledTeleconsultationCard = (request: TeleconsultationRequest, handleViewDetails: (request: TeleconsultationRequest) => void) => {
    const title = 'Teleconsultation Request';
    const reason = request.reason;
    const createdAt = request.createdAt;
    const status = request.status;

    return (
      <IonCard
        key={request.id}
        style={{
          borderLeft: `8px solid #eb445a` // danger
        }}>
        <IonCardHeader>
          <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {title}
              <IonChip
                color='danger'
                style={{ margin: '0' }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </IonChip>
            </div>
          </IonCardTitle>
           <IonCardSubtitle>
            Barangay: <strong>{request.barangayName || request.barangayId}</strong>
          </IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <p><strong>Resident:</strong> {request.userData?.firstName} {request.userData?.lastName}</p>
          <p><strong>Reason:</strong> {reason}</p>
          <p><strong>Cancelled At:</strong> {request.updatedAt ? request.updatedAt.toLocaleString() : 'N/A'}</p>
          <p><strong>Cancellation Reason:</strong> {request.cancellationReason || 'N/A'}</p>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

const renderArchivedTeleconsultationCard = (request: TeleconsultationRequest, handleViewDetails: (request: TeleconsultationRequest) => void) => {
    const title = 'Teleconsultation Request';
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
           <IonCardSubtitle>
            Barangay: <strong>{request.barangayName || request.barangayId}</strong>
          </IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <p><strong>Resident:</strong> {request.userData?.firstName} {request.userData?.lastName}</p>
          <p><strong>Reasons:</strong> {reason}</p>
          <p><strong>Created At:</strong> {createdAt ? createdAt.toLocaleString() : 'N/A'}</p>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    );
  };