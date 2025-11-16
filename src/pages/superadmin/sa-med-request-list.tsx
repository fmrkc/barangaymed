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
  IonDatetime,
  IonInput,
  IonCheckbox,
  IonTextarea,
  IonNote,
  IonFooter,
  IonIcon,
  IonBadge,
  IonActionSheet,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonCardSubtitle,
  IonToast,
  IonSkeletonText,
  ActionSheetButton,
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, getDocs, arrayUnion, increment, FieldValue, UpdateData, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';
import { FirestoreAuditTrailEntry, Medicine } from '../../types/medicine';
import { Region, Province, CityMunicipality, Barangay, getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality } from '../../services/addressService';
import { calendar, arrowBack, arrowForward, paperPlane, open, openOutline, close, checkbox, checkmark, personRemove, filter, filterCircle, carSportOutline, filterOutline, archiveOutline, chevronUp, chevronDown, checkmarkDone, arrowBackSharp, closeCircleOutline } from 'ionicons/icons';
import { formatTimeAgo } from '../../utils/timeUtils';
import './sa-med-request-list.css';

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


const SuperAdminMedRequestList: React.FC = () => {
  const { currentUser, cityMunicipalityId } = useAuth();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MedicineRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'processed' | 'scheduled' | 'completed' | 'not completed'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangayFilter, setSelectedBarangayFilter] = useState('all');

  const [showAcceptAlert, setShowAcceptAlert] = useState(false);
  const [requestToAccept, setRequestToAccept] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showMarkCompleteAlert, setShowMarkCompleteAlert] = useState(false);
  const [requestToMarkComplete, setRequestToMarkComplete] = useState<string | null>(null);
  const [showNoShowAlert, setShowNoShowAlert] = useState(false);
  const [requestToMarkAsNoShow, setRequestToMarkAsNoShow] = useState<string | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [requestToSchedule, setRequestToSchedule] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [schedulePlace, setSchedulePlace] = useState<string>('');

  // State for detail modal segment
  const [detailSegment, setDetailSegment] = useState<'request' | 'resident'>('request');

  // New state for process modal
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<{ [key: string]: { quantity: number } }>({});
  const [processNote, setProcessNote] = useState<string>('');
  const [processStep, setProcessStep] = useState<number>(1);
  const [medicineSearch, setMedicineSearch] = useState<string>('');
  const [medicineFilter, setMedicineFilter] = useState<string>('all');

  const [showQuantityActionSheet, setShowQuantityActionSheet] = useState(false);
  const [currentMedId, setCurrentMedId] = useState<string>('');
  const [showQuantityAlert, setShowQuantityAlert] = useState(false);
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [actionSheetButtons, setActionSheetButtons] = useState<(string | ActionSheetButton)[]>([]);
  const [maxQty, setMaxQty] = useState(0);


  const [processError, setProcessError] = useState<string | null>(null);
  const [isSavingProcess, setIsSavingProcess] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleToast, setShowScheduleToast] = useState(false);
  const [showMarkCompleteToast, setShowMarkCompleteToast] = useState(false);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [showRejectToast, setShowRejectToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showAcceptToast, setShowAcceptToast] = useState(false);

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedRequests, setArchivedRequests] = useState<{ [key: string]: MedicineRequest[] }>({});
  const [openArchiveGroup, setOpenArchiveGroup] = useState<string | null>(null);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveSelectedBarangayFilter, setArchiveSelectedBarangayFilter] = useState('all');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState('all');

  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [cancelledRequests, setCancelledRequests] = useState<{ [key: string]: MedicineRequest[] }>({});
  const [openCancelledGroup, setOpenCancelledGroup] = useState<string | null>(null);
  const [cancelledSearchQuery, setCancelledSearchQuery] = useState('');
  const [cancelledSelectedBarangayFilter, setCancelledSelectedBarangayFilter] = useState('all');

  const barangayFilterOptions = useMemo(() => {
    const uniqueBarangays = new Map<string, string>();
    requests.forEach(req => {
      if (req.barangayId && req.barangayName) {
        uniqueBarangays.set(req.barangayId, req.barangayName);
      }
    });
    return Array.from(uniqueBarangays.entries()).map(([id, name]) => ({ id, name }));
  }, [requests]);

  const medicineCategoryOptions = useMemo(() => {
    const categories = new Set<string>();
    medicines.forEach(med => {
      if (med.category) {
        categories.add(med.category);
      }
    });
    return Array.from(categories);
  }, [medicines]);

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
        setLoading(false);
        const reqs: MedicineRequest[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const req: MedicineRequest = {
            id: doc.id,
            userId: data.userId,
            barangayId: data.barangayId,
            barangayName: data.barangayName,
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
            cancellationReason: data.cancellationReason,
            isShown: data.isShown,
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
    let filtered: MedicineRequest[] = requests.filter(r => r.status !== 'cancelled'); // Exclude cancelled from main filtered list

    // Filter by status
    switch (filter) {
      case 'pending':
        filtered = filtered.filter((r) => r.status === 'pending');
        break;
      case 'approved':
        filtered = filtered.filter((r) => r.status === 'accepted');
        break;
      case 'processed':
        filtered = filtered.filter((r) => r.status === 'processed');
        break;
      case 'scheduled':
        filtered = filtered.filter((r) => r.status === 'scheduled');
        break;
      case 'completed':
        filtered = filtered.filter((r) => r.status === 'completed' && (r as any).isShown !== false);
        break;
      case 'not completed':
        filtered = filtered.filter((r) =>
          ['rejected', 'no show'].includes(r.status) && (r as any).isShown !== false // 'cancelled' removed from here
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
        r.status !== 'cancelled' && // Exclude cancelled from archives
        (r as any).isShown === false &&
        ['completed', 'rejected', 'no show'].includes(r.status) // 'cancelled' removed from here
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

    // Apply status filter to archived requests
    if (archiveStatusFilter !== 'all') {
      archived = archived.filter(r => r.status === archiveStatusFilter);
    }

    const grouped = archived.reduce((acc, request) => {
        const date = request.createdAt;
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(request);
        return acc;
    }, {} as {[key: string]: MedicineRequest[]});

    setArchivedRequests(grouped);
}, [requests, archiveSearchQuery, archiveSelectedBarangayFilter, archiveStatusFilter]);

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
    }, {} as {[key: string]: MedicineRequest[]});

    setCancelledRequests(grouped);
  }, [requests, cancelledSearchQuery, cancelledSelectedBarangayFilter]);

  const handleViewDetails = (request: MedicineRequest) => {
    setSelectedRequest(request);
    setDetailSegment('request');
    setShowModal(true);
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'completed' | 'scheduled' | 'processed' | 'no show', action: string, reason?: string) => {
    if (!currentUser || !currentUser.email) {
      setError('User authentication or email is required.');
      return;
    }
    try {
      const requestRef = doc(db, 'medicineRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        setError('Medicine request not found.');
        return;
      }
      const requestData = requestDoc.data() as MedicineRequest;

      const updateData: UpdateData<MedicineRequest> = {
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
          smsMessage = `Your medicine request has been accepted.`;
          break;
        case 'rejected':
          smsMessage = `Your medicine request has been rejected.`;
          break;
        case 'completed':
          smsMessage = `Your medicine request has been completed.`;
          break;
        case 'no show':
          smsMessage = `Your medicine request has been marked as no-show.`;
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
      await handleUpdateRequestStatus(requestToAccept, 'accepted', 'Accepted request');
      const request = requests.find(r => r.id === requestToAccept);
      setToastMessage(`You have successfully accepted ${request?.userData?.firstName} ${request?.userData?.lastName}'s request.`);
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
      await handleUpdateRequestStatus(requestToReject, 'rejected', 'Rejected request', reason);
      setRequestToReject(null);
      setShowRejectToast(true);
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
    try {
      await handleUpdateRequestStatus(requestToMarkComplete, 'completed', 'Marked as completed');
      setShowMarkCompleteToast(true);
      setRequestToMarkComplete(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error marking request as complete:', error);
      setError('Failed to mark the request as complete.');
    }
  };

  const handleMarkAsNoShow = () => {
    if (!requestToMarkAsNoShow) return;
    handleUpdateRequestStatus(requestToMarkAsNoShow, 'no show', 'Marked as no show');
    setRequestToMarkAsNoShow(null);
  };

  const handleScheduleRequest = async () => {
    if (!requestToSchedule || !scheduleDate || !scheduleTime || !schedulePlace || !currentUser) return;
    setIsScheduling(true);
    try {
      const requestRef = doc(db, 'medicineRequests', requestToSchedule);
      await updateDoc(requestRef, {
        status: 'scheduled',
        scheduleDate: new Date(scheduleDate),
        scheduleTime,
        schedulePlace,
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: 'Scheduled request',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'unknown',
          userName: currentUser.displayName || currentUser.email || 'Super Admin',
          timestamp: new Date(),
        }),
      });

      // Send SMS notification
      const request = requests.find(r => r.id === requestToSchedule);
      if (request && request.userId) {
        const smsMessage = 'Your medicine request has been scheduled.';
        await sendSms(request.userId, smsMessage);
      }

      // Update local state
      setRequests(prev => prev.map(r => r.id === requestToSchedule ? { ...r, status: 'scheduled', scheduleDate: new Date(scheduleDate), scheduleTime, schedulePlace, auditTrail: [...(r.auditTrail || []), { action: 'Scheduled request', userId: currentUser.uid, userEmail: currentUser.email!, userName: currentUser.displayName || currentUser.email || 'Super Admin', timestamp: new Date() }] } : r));
      setShowScheduleModal(false);
      setRequestToSchedule(null);
      setScheduleDate('');
      setScheduleTime('');
      setSchedulePlace('');
      setShowScheduleToast(true);
    } catch (error) {
      console.error('Error scheduling request:', error);
      setError('Failed to schedule the request.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Fetch medicines for process modal
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

  // Filter medicines based on search and filter
  useEffect(() => {
    let filtered = medicines;
    if (medicineFilter !== 'all') {
      filtered = filtered.filter(med => med.category === medicineFilter);
    }
    if (medicineSearch) {
      filtered = filtered.filter(med =>
        med.medicine_name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
        med.dosage_form.toLowerCase().includes(medicineSearch.toLowerCase()) ||
        med.strength.toLowerCase().includes(medicineSearch.toLowerCase()) ||
        med.category.toLowerCase().includes(medicineSearch.toLowerCase())
      );
    }
    setFilteredMedicines(filtered);
  }, [medicines, medicineSearch, medicineFilter]);

  // Open process modal and initialize selected medicines and note
  const handleProcessClick = (request: MedicineRequest) => {
    setSelectedRequest(request);
    // Initialize selectedMedicines state with dispensedMedicines or empty
    const initialSelected: { [key: string]: { quantity: number } } = {};
    if (request.dispensedMedicines) {
      Object.entries(request.dispensedMedicines).forEach(([medId, quantity]) => {
        initialSelected[medId] = { quantity };
      });
    }
    setSelectedMedicines(initialSelected);
    setProcessNote(request.processNote || '');
    setProcessStep(1);
    setMedicineSearch('');
    setMedicineFilter('all');
    setProcessError(null);
    setShowProcessModal(true);
  };

  // Handle toggle selection
  const toggleMedicineSelection = (medId: string) => {
    setSelectedMedicines(prev => {
      const newSelected = { ...prev };
      if (newSelected[medId]) {
        delete newSelected[medId];
      } else {
        newSelected[medId] = { quantity: 1 };
      }
      return newSelected;
    });
  };

  // Handle quantity change
  const changeMedicineQuantity = (medId: string, quantity: number) => {
    setSelectedMedicines(prev => {
      if (quantity < 1) {
        const newSelected = { ...prev };
        delete newSelected[medId];
        return newSelected;
      }
      return {
        ...prev,
        [medId]: { quantity },
      };
    });
  };

  // Open action sheet for quantity selection
  const openQuantityActionSheet = (medId: string) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;
    setMaxQty(med.quantity);
    const buttons = [];
    for (let i = 1; i <= Math.min(10, med.quantity); i++) {
      buttons.push({
        text: i.toString(),
        handler: () => handleActionSheetClick(medId, i),
      });
    }
    if (med.quantity > 10) {
      buttons.push({
        text: 'Custom',
        handler: () => handleActionSheetClick(medId, 'custom'),
      });
    }
    buttons.push({
      text: 'Remove',
      handler: () => handleActionSheetClick(medId, 0),
    });
    buttons.push({
      text: 'Cancel',
      role: 'cancel',
    });
    setActionSheetButtons(buttons);
    setShowQuantityActionSheet(true);
  };

  // Handle action sheet button clicks
  const handleActionSheetClick = (medId: string, quantity: number | 'custom') => {
    if (quantity === 'custom') {
      setCurrentMedId(medId);
      setQuantityInput(selectedMedicines[medId]?.quantity?.toString() || '1');
      setShowQuantityAlert(true);
    } else {
      changeMedicineQuantity(medId, quantity);
    }
    setShowQuantityActionSheet(false);
  };

  // Handle custom quantity input
  const handleCustomQuantity = (qty: number) => {
    changeMedicineQuantity(currentMedId, qty);
    setQuantityInput(qty.toString());
    setShowQuantityAlert(false);
  };

  // Save process data
  const handleSaveProcess = async () => {
    if (!selectedRequest || !currentUser) {
      setProcessError('User or request data is missing.');
      return;
    }
    const dispensedMedicines: { [key: string]: number } = {};
    Object.entries(selectedMedicines).forEach(([medId, { quantity }]) => {
      dispensedMedicines[medId] = quantity;
    });
    const hasSelected = Object.keys(dispensedMedicines).length > 0;
    if (!hasSelected) {
      setProcessError('Please select at least one medicine.');
      return;
    }
    setIsSavingProcess(true);
    try {
      const requestRef = doc(db, 'medicineRequests', selectedRequest.id!);
      await updateDoc(requestRef, {
        status: 'processed',
        dispensedMedicines,
        processNote,
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: 'Processed request',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email || 'Super Admin',
          timestamp: new Date(),
        }),
      });

      // Update medicine quantities in inventory
      const updatePromises = Object.entries(dispensedMedicines).map(async ([medId, qty]) => {
        const medRef = doc(db, 'medicine', medId);
        await updateDoc(medRef, {
          quantity: increment(-qty),
        });
      });
      await Promise.all(updatePromises);

      // Send SMS notification
      if (selectedRequest.userId) {
        const dispensedMedNames = Object.entries(dispensedMedicines).map(([id, qty]) => {
          const med = medicines.find(m => m.id === id);
          return `${med?.medicine_name || id} (x${qty})`;
        }).join(', ');
        const smsMessage = 'Your medicine request has been processed.';
        await sendSms(selectedRequest.userId, smsMessage);
      }

      // Update local state
      setRequests(prev =>
        prev.map(r =>
          r.id === selectedRequest.id ? { ...r, status: 'processed', dispensedMedicines, processNote } : r
        )
      );
      setShowProcessModal(false);
      setSelectedRequest(null);
      setSelectedMedicines({});
      setProcessNote('');
      setProcessError(null);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error saving process data:', error);
      setProcessError('Failed to save process data.');
    } finally {
      setIsSavingProcess(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Medicine Requests</IonTitle>
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
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonSegment scrollable value={filter} onIonChange={e => setFilter(e.detail.value as 'pending' | 'approved' | 'processed' | 'scheduled' | 'completed' | 'not completed')}>
          <IonSegmentButton value="pending">
            <IonLabel>Pending</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="approved">
            <IonLabel>Approved</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="scheduled">
            <IonLabel>Scheduled</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="processed">
            <IonLabel>Processed</IonLabel>
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
        <IonToolbar className="ion-padding-horizontal">
            <IonSelect value={selectedBarangayFilter} placeholder="Filter by Barangay" onIonChange={e => setSelectedBarangayFilter(e.detail.value)}>
            <IonSelectOption value="all">All Barangays</IonSelectOption>
            {barangayFilterOptions.map(b => (
              <IonSelectOption key={b.id} value={b.id}>{b.name}</IonSelectOption>
            ))}
          </IonSelect>
        </IonToolbar>

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
                    : request.status === 'processed'
                    ? '#017457' // primary (green-ish)
                    : request.status === 'scheduled'
                    ? '#017457' // primary (green-ish)
                    : request.status === 'completed'
                    ? '#2dd36f' // success (green)
                    : '#017457' // danger (red)
                }`
              }}
            >
               <IonItemDivider>Barangay: &nbsp;<strong>{request.barangayName || request.barangayId}</strong></IonItemDivider>
              <IonCardHeader>
                <IonCardTitle>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.9em' }}>
                  <div>Request ID: {request.id}</div>
                  
                  <div>
                   <IonChip>
                     {request.updatedAt && request.updatedAt.getTime() !== request.createdAt.getTime()
                      ? `Last updated ${formatTimeAgo(request.updatedAt)}`
                      : `Created ${formatTimeAgo(request.createdAt)}`}
                   </IonChip>
                  </div>
                
                  </div>
                </IonCardTitle>
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
                    <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" onClick={() => { setRequestToSchedule(request.id!); setShowScheduleModal(true); }}>Schedule<IonIcon slot='end' icon={open} /></IonButton>
                  </div>
                )}
                {request.status === 'scheduled' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <IonButton className='ion-padding-vertical' expand='block' fill="outline" onClick={() => handleViewDetails(request)}>
                      View Details
                    </IonButton>
                    <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" onClick={() => handleProcessClick(request)}>
                      Process
                      <IonIcon slot='end' icon={open} />
                    </IonButton>
                  </div>
                )}
                {request.status === 'processed' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <IonButton className='btn-25-w ion-padding-vertical' expand='block' fill="outline" onClick={() => handleViewDetails(request)}>
                      View Details
                    </IonButton>
                     <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" onClick={() => { setRequestToMarkComplete(request.id!); setShowMarkCompleteAlert(true);}}>
                      Mark as Complete
                      <IonIcon slot='end' icon={checkmarkDone} />
                    </IonButton>
                  </div>
                )}
                {request.status === 'completed' && (
                  <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                )}
                {request.status === 'no show' && (
                  <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                )}
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        {/* Cancelled Requests Modal */}
        <IonModal isOpen={showCancelledModal} onDidDismiss={() => setShowCancelledModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Cancelled Requests</IonTitle>
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
                        <p>This section shows all requests that have been cancelled by users. They are grouped by month and year for easier tracking.</p>
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

            {Object.keys(cancelledRequests).length === 0 ? (
                <IonCard className="ion-padding"><IonText>No cancelled requests found.</IonText></IonCard>
            ) : (
                <IonList>
                    {Object.keys(cancelledRequests).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(groupKey => (
                        <div key={groupKey}>
                                  <IonItem button onClick={() => setOpenCancelledGroup(openCancelledGroup === groupKey ? null : groupKey)}>
                                    <IonLabel>{groupKey}</IonLabel>
                                    <IonIcon icon={openCancelledGroup === groupKey ? chevronUp : chevronDown} slot="end" />
                                  </IonItem>  {openCancelledGroup === groupKey && (
                                <IonList>
                                    {cancelledRequests[groupKey].map(request => renderCancelledCard(request, handleViewDetails))}
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
              <IonTitle>Archived Requests</IonTitle>
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
                <IonGrid>
                    <IonRow>
                        <IonCol size="6">
                            <IonSelect value={archiveSelectedBarangayFilter} placeholder="Filter by Barangay" onIonChange={e => setArchiveSelectedBarangayFilter(e.detail.value)}>
                                <IonSelectOption value="all">All Barangays</IonSelectOption>
                                {barangayFilterOptions.map(b => (
                                    <IonSelectOption key={b.id} value={b.id}>{b.name}</IonSelectOption>
                                ))}
                            </IonSelect>
                        </IonCol>
                        <IonCol size="6">
                            <IonSelect value={archiveStatusFilter} placeholder="Filter by Status" onIonChange={e => setArchiveStatusFilter(e.detail.value)}>
                                <IonSelectOption value="all">All Statuses</IonSelectOption>
                                <IonSelectOption value="completed">Completed</IonSelectOption>
                                <IonSelectOption value="rejected">Rejected</IonSelectOption>
                                <IonSelectOption value="no show">No Show</IonSelectOption>
                            </IonSelect>
                        </IonCol>
                    </IonRow>
                </IonGrid>
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
                                    {archivedRequests[groupKey].map(request => renderArchivedCard(request, handleViewDetails))}
                                </IonList>
                            )}
                        </div>
                    ))}
                </IonList>
            )}
          </IonContent>
        </IonModal>

        {/* Request Details Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader className='ion-no-border'>
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
                <>
                  {detailSegment === 'request' && (() => {
                    const creationEntry = selectedRequest.auditTrail?.find(e => e.action === 'Created request from teleconsultation');
                    const acceptanceEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Accepted request');
                    const rejectionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Rejected request');
                    const processingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Processed request');
                    const schedulingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Scheduled request');
                    const completionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as completed');
                    const noShowEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as no show');
                    const cancellationEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Cancelled medicine request by user');

                    const isAccepted = !!acceptanceEntry || ['processed', 'scheduled', 'completed'].includes(selectedRequest.status);
                    const isProcessed = !!processingEntry || ['scheduled', 'completed'].includes(selectedRequest.status);
                    const isScheduled = !!schedulingEntry || ['completed'].includes(selectedRequest.status);
                    const isCompleted = !!completionEntry;
                    const isRejected = !!rejectionEntry;
                    const isNoShow = !!noShowEntry;
                    const isCancelled = !!cancellationEntry;

                    return (
                      <>
                        {/* Request Information */}
                       <IonCard>
                         <IonItemDivider className='ion-margin-top'>Request Information ({selectedRequest.id})</IonItemDivider>
                        <IonItem>
                          <IonLabel>Status:</IonLabel>
                          <IonChip
                            slot="end"
                            color={
                              selectedRequest.status === 'pending'
                                ? 'warning'
                                : selectedRequest.status === 'rejected' || selectedRequest.status === 'no show' || selectedRequest.status === 'cancelled'
                                  ? 'danger'
                                  : ['accepted', 'processed', 'scheduled'].includes(selectedRequest.status)
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
                          <IonLabel>Request Reason:</IonLabel>
                        </IonItem>
                        <IonItem lines='none'>
                          <IonTextarea fill='outline' readonly value={selectedRequest.reason}></IonTextarea>
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
                        {creationEntry && (
                          <IonItem>
                            <IonLabel>Created By:</IonLabel>
                            <IonText slot="end">{creationEntry.userName} ({creationEntry.userEmail})</IonText>
                          </IonItem>
                        )}
                       </IonCard>

                        {/* Cancellation Information */}
                        {isCancelled && cancellationEntry && (
                          <IonCard>
                            <IonItemDivider className='ion-margin-top'>Cancellation Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Cancelled By: {cancellationEntry.userName}
                              <p>{cancellationEntry.userEmail} at {cancellationEntry.timestamp.toLocaleString()}</p> 
                              </IonLabel>
                            </IonItem>
                            <IonItem lines='none'>
                              <IonLabel>Cancellation Reason:</IonLabel>
                            </IonItem>
                            <IonItem lines='none' className='ion-margin-bottom'>
                              <IonTextarea fill='outline' readonly value={selectedRequest.cancellationReason || 'N/A'}></IonTextarea>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* Rejection Information */}
                        {isRejected && rejectionEntry && (
                          <IonCard>
                            <IonItemDivider className='ion-margin-top'>Rejection Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Rejected By: {rejectionEntry.userName}
                                <p>({rejectionEntry.userEmail} at {rejectionEntry.timestamp.toLocaleString()}</p>
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
                            <IonItemDivider className='ion-margin-top'>No Show Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Marked By: {noShowEntry.userName} ({noShowEntry.userEmail})</IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Marked At: {noShowEntry.timestamp.toLocaleString()}</IonLabel>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* Acceptance Information */}
                        {isAccepted && acceptanceEntry && (
                          <IonCard>
                            <IonItemDivider className='ion-margin-top'>Acceptance Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Accepted By: {acceptanceEntry.userName}
                                <p>{acceptanceEntry.userEmail} at {acceptanceEntry.timestamp.toLocaleString()}</p>
                              </IonLabel>
                            </IonItem>
                          
                          </IonCard>
                        )}

                        {/* Processing Information */}
                        {isProcessed && (
                          <IonCard>
                            <IonItemDivider className='ion-margin-top'>Processing Details</IonItemDivider>
                            {processingEntry && (
                                <IonItem>
                                  <IonLabel>Processed By: {processingEntry.userName}
                                    <p>{processingEntry.userEmail} at {processingEntry.timestamp.toLocaleString()}</p>
                                  </IonLabel>
                                </IonItem>
                            )}
                            <IonItem>
                              <IonLabel>Dispensed Medicines:</IonLabel>
                            </IonItem>
                            <IonItem lines='none'>
                                <IonTextarea fill='outline' readonly value={Object.entries(selectedRequest.dispensedMedicines || {}).map(([id, qty]) => {
                                const med = medicines.find(m => m.id === id);
                                return `${med?.medicine_name || id} (x${qty})`;
                              }).join(', ') || 'N/A'}></IonTextarea>
                            </IonItem>
                            <IonItem lines='none'>
                              <IonLabel>Process Note:</IonLabel>
                            </IonItem>
                            <IonItem lines='none' className='ion-margin-bottom'>
                              <IonTextarea fill='outline' readonly value={selectedRequest.processNote || 'N/A'}></IonTextarea>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* Scheduling Information */}
                        {isScheduled && (
                          <IonCard>
                            <IonItemDivider className='ion-margin-top'>Scheduling Details</IonItemDivider>
                            {schedulingEntry && (
                              <>
                                <IonItem>
                                  <IonLabel>Scheduled By: {schedulingEntry.userName}
                                    <p>{schedulingEntry.userEmail} at {schedulingEntry.timestamp.toLocaleString()}</p>
                                  </IonLabel>
                                </IonItem>
                              </>
                            )}
                            <IonItem lines='none'>
                              <IonLabel>Scheduled Pickup:</IonLabel>
                            </IonItem>
                            <IonItem lines='none' className='ion-margin-bottom'>
                              <IonTextarea fill='outline' readonly value={selectedRequest.scheduleDate?.toLocaleDateString() + ' ' + (selectedRequest.scheduleTime) + ' at ' + (selectedRequest.schedulePlace || 'N/A')}></IonTextarea>
                            </IonItem>
                          </IonCard>
                        )}

                        {/* Completion Information */}
                        {isCompleted && completionEntry && (
                          <IonCard>
                            <IonItemDivider className='ion-margin-top'>Completion Details</IonItemDivider>
                            <IonItem>
                              <IonLabel>Completed By: {completionEntry.userName}
                                <p>{completionEntry.userEmail} at {completionEntry.timestamp.toLocaleString()}</p>
                              </IonLabel>
                            </IonItem>
                          </IonCard>
                        )}
                      </>
                    );
                  })()}
                  {detailSegment === 'resident' && (
                    <IonCard>   
                      {selectedRequest.userData && (
                        <>
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
                </>
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
                <IonButton
                  className='ion-padding-vertical'
                  shape='round'
                  expand="block"
                  color="primary"
                  onClick={() => handleProcessClick(selectedRequest)}
                >
                  Process Request
                  <IonIcon slot='end' icon={paperPlane} />
                </IonButton>
              </IonToolbar>
            </IonFooter>
          )}
          {selectedRequest?.status === 'processed' && (
            <IonFooter>
              <IonToolbar>
                <IonButton
                  className='ion-padding-vertical'
                  shape='round'
                  expand="block"
                  color="success"
                  onClick={() => {
                    setRequestToMarkComplete(selectedRequest.id!);
                    setShowMarkCompleteAlert(true);
                  }}
                >
                  Mark as Completed
                  <IonIcon slot='end' icon={checkmark} />
                </IonButton>
              </IonToolbar>
            </IonFooter>
          )}
        </IonModal>

        {/* Process Modal */}
        <IonModal isOpen={showProcessModal} onDidDismiss={() => setShowProcessModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Process Request</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowProcessModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonLoading isOpen={isSavingProcess} message="Updating request..." />
            {processError && (
              <IonText color="danger" className="ion-padding">
                {processError}
              </IonText>
            )}
            {processStep === 1 && (
              <>
                <IonCard className="ion-padding">
                  <IonNote>
                    Confirm the request details before proceeding.
                  </IonNote>
                </IonCard>
                <IonCard>
                  <IonCardHeader>
                    <IonItem lines='none'>
                      Resident: {selectedRequest?.userData?.firstName} {selectedRequest?.userData?.lastName}
                    </IonItem>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel>
                        Reason: <strong>{selectedRequest?.reason}</strong>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        Has Prescription: <strong>{selectedRequest?.hasPrescription ? 'Yes' : 'No'}</strong>
                      </IonLabel>
                    </IonItem>
                    {selectedRequest?.hasPrescription && selectedRequest?.prescriptionUrl && (
                      <IonButton fill="outline" onClick={() => window.open(selectedRequest.prescriptionUrl, '_blank')}>View Prescription</IonButton>
                    )}
                  </IonCardContent>
                </IonCard>
              </>
            )}
            {processStep === 2 && (
              <>
                <IonCard className="ion-padding">
                    Select medicines from inventory. Use search and filter to find medicines quickly.
                    <IonSearchbar
                    className='ion-margin-vertical'
                        value={medicineSearch}
                        onIonInput={e => setMedicineSearch(e.detail.value!)}
                        placeholder="Search medicines..."
                      />
                      <IonSelect
                      className='ion-margin-horizontal'
                        value={medicineFilter}
                        placeholder="Filter by category"
                        onIonChange={e => setMedicineFilter(e.detail.value)}
                      >
                        <IonSelectOption value="all">All Categories</IonSelectOption>
                        {medicineCategoryOptions.map(cat => (
                          <IonSelectOption key={cat} value={cat}>{cat}</IonSelectOption>
                        ))}
                      </IonSelect>
                </IonCard>
              
                    {filteredMedicines.map(med => (
                        
                      <React.Fragment key={med.id}>
                        <IonCard>
                          <IonCardContent>
                            <IonItem lines='none'>
                              <IonCheckbox
                                checked={!!selectedMedicines[med.id]}
                                onIonChange={() => toggleMedicineSelection(med.id)}
                                disabled={med.quantity <= 0}
                                justify='space-between'
                              >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div>
                                    {med.medicine_name} ({med.category})
                                  </div>
                                  <div>
                                    <small>Quantity: {med.quantity}</small>
                                  </div>
                                </div>
                                <div>
                                  <small>{med.dosage_form} - {med.strength} ({med.unit_name}) | Expires: {med.expiration_date.toLocaleDateString()}</small>
                                </div>
                              </IonCheckbox>
                            </IonItem>
                            {selectedMedicines[med.id] && (
                              <IonItem key={`${med.id}-quantity`} lines='none'>
                                <IonLabel slot='start'>Quantity: {selectedMedicines[med.id]?.quantity || 1} / {med.quantity} available</IonLabel>
                                <IonButton slot='end' fill="outline" onClick={() => openQuantityActionSheet(med.id)}>
                                  Change
                                </IonButton>
                              </IonItem>
                            )}
                          </IonCardContent>
                        </IonCard>
                      </React.Fragment>
                     
                    ))}
                 
              </>
            )}
            {processStep === 3 && (
              <>
                <IonCard className="ion-padding">
                  <IonNote>
                    Review the selected medicines and add an optional process note.
                  </IonNote>
                </IonCard>
                <IonCard>
                  <IonCardHeader>
                    <IonItem lines='none'>
                      Resident: {selectedRequest?.userData?.firstName} {selectedRequest?.userData?.lastName}
                    </IonItem>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItemDivider>Selected Medicines</IonItemDivider>
                    {Object.entries(selectedMedicines).length === 0 ? (
                      <IonItem>
                        <IonText>No medicines selected.</IonText>
                      </IonItem>
                    ) : (
                      Object.entries(selectedMedicines).map(([medId, { quantity }]) => {
                        const med = medicines.find(m => m.id === medId);
                        return (
                          <IonItem key={medId}>
                            <IonLabel>
                              {med?.medicine_name} - Quantity: {quantity}
                            </IonLabel>
                          </IonItem>
                        );
                      })
                    )}
                    <IonItemDivider className='ion-margin-top'>Process Note (Optional)</IonItemDivider>
                    <IonItem lines='none' className='ion-margin-vertical'>
                      <IonTextarea
                        fill="outline"
                        value={processNote}
                        onIonChange={e => setProcessNote(e.detail.value!)}
                        placeholder="Add a note about the processing..."
                        rows={3}
                      />
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              </>
            )}
          </IonContent>
          <IonFooter>
            <IonToolbar>
              {processStep === 1 && (
                <IonButton
                  expand="block"
                  shape="round"
                  onClick={() => setProcessStep(prev => prev + 1 as 1 | 2 | 3)}
                  className="ion-margin"
                >
                  <IonIcon slot="end" icon={arrowForward} />
                  <IonText className='ion-padding-vertical'>Next</IonText>
                </IonButton>
              )}

              {(processStep === 2 || processStep === 3) && (
                <IonGrid>
                  <IonRow>
                    <IonCol size="3">
                      <IonButton
                        expand="block"
                        shape="round"
                        fill="outline"
                        onClick={() => setProcessStep(prev => prev - 1 as 1 | 2 | 3)}
                      >
                        <IonIcon slot="start" icon={arrowBack} />
                        <IonText className='ion-padding-vertical'>Back</IonText>
                      </IonButton>
                    </IonCol>
                    <IonCol size="9">
                      {processStep === 2 ? (
                        <IonButton
                          expand="block"
                          shape="round"
                          onClick={() => setProcessStep(prev => prev + 1 as 1 | 2 | 3)}
                          disabled={Object.keys(selectedMedicines).length === 0}
                        >
                          <IonIcon slot="end" icon={arrowForward} />
                          <IonText className='ion-padding-vertical'>Next</IonText>
                        </IonButton>
                      ) : (
                        <IonButton
                          color={'success'}
                          expand="block"
                          shape="round"
                          onClick={handleSaveProcess}
                          disabled={isSavingProcess || Object.keys(selectedMedicines).length === 0}
                        >
                          <IonText className='ion-padding-vertical'>Update</IonText>
                          <IonIcon slot="end" icon={paperPlane} />
                        </IonButton>
                      )}
                    </IonCol>
                  </IonRow>
                </IonGrid>
              )}
            </IonToolbar>
          </IonFooter>
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
          header={'Reject Request'}
          message={'Please provide a reason for rejecting this request.'}
          inputs={[
            {
              name: 'rejectionReason',
              type: 'textarea',
              placeholder: 'Reason for rejection...'
            }
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                setRequestToReject(null);
              }
            },
            {
              text: 'Reject',
              handler: (data) => {
                handleRejectRequest(data.rejectionReason);
              }
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

        <IonAlert
          isOpen={showNoShowAlert}
          onDidDismiss={() => setShowNoShowAlert(false)}
          header={'Confirm No Show'}
          message={'Are you sure you want to mark this request as a no-show? This action cannot be undone.'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                setRequestToMarkAsNoShow(null);
              }
            },
            {
              text: 'Confirm',
              handler: handleMarkAsNoShow
            }
          ]}
        />

        <IonModal isOpen={showScheduleModal} onDidDismiss={() => setShowScheduleModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Schedule Request</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowScheduleModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonLoading isOpen={isScheduling} message="Scheduling request..." />
            <IonCard className="ion-padding">
              <IonNote>
                Please select where and when the resident can pick up their request.
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
                    placeholder="Select schedule date"
                    value={scheduleDate}
                    min={new Date().toISOString().split('T')[0]}
                    onIonChange={(e) => setScheduleDate(e.detail.value!)}
                    className="ion-margin-bottom"
                    required
                  />
                </IonItem>
                <IonItemDivider>Schedule Time</IonItemDivider>
                <IonItem lines='none' className='ion-margin-vertical'>
                  <IonInput
                    fill='outline'
                    type="time"
                    value={scheduleTime}
                    onIonChange={e => setScheduleTime(e.detail.value!)}
                  />
                </IonItem>
                <IonItemDivider>Schedule Place</IonItemDivider>
                <IonItem lines='none' className='ion-margin-vertical'>
                  <IonInput
                    fill='outline'
                    value={schedulePlace}
                    onIonChange={e => setSchedulePlace(e.detail.value!)}
                    placeholder="Enter place"
                  />
              </IonItem>
             
            </IonCardContent>
          </IonCard>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonItem lines='none'>
                <small>  If all fields are filled out correctly, click "Schedule" to finalize the scheduling.
              </small>
              </IonItem>
              <IonButton shape='round' className='ion-padding-vertical' expand="full" onClick={handleScheduleRequest} disabled={isScheduling}>
                Schedule
                <IonIcon slot="end" icon={calendar}></IonIcon>
                </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

        {/* Quantity Action Sheet */}
        <IonActionSheet
          isOpen={showQuantityActionSheet}
          onDidDismiss={() => setShowQuantityActionSheet(false)}
          header="Select Quantity"
          buttons={actionSheetButtons}
        />

        {/* Custom Quantity Alert */}
        <IonAlert
          isOpen={showQuantityAlert}
          onDidDismiss={() => setShowQuantityAlert(false)}
          header="Enter Custom Quantity"
          message={`Maximum available quantity: ${maxQty}`}
          inputs={[
            {
              name: 'quantity',
              type: 'number',
              placeholder: 'Quantity',
              value: quantityInput,
              min: 1,
              max: maxQty,
            },
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'OK',
              handler: (data) => {
                const qty = Math.min(parseInt(data.quantity) || 1, maxQty);
                handleCustomQuantity(qty);
              },
            },
          ]}
        />

        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message="Request processed successfully!"
          duration={2000}
          color="success"
        />

        <IonToast
          isOpen={showRejectToast}
          onDidDismiss={() => setShowRejectToast(false)}
          message="Request rejected successfully!"
          duration={2000}
          color="primary"
        />

        <IonToast
          isOpen={showAcceptToast}
          onDidDismiss={() => setShowAcceptToast(false)}
          message={toastMessage}
          duration={2000}
          color="success"
        />

        <IonToast
          isOpen={showScheduleToast}
          onDidDismiss={() => setShowScheduleToast(false)}
          message="Request scheduled successfully!"
          duration={2000}
          color="success"
        />

        <IonToast
          isOpen={showMarkCompleteToast}
          onDidDismiss={() => setShowMarkCompleteToast(false)}
          message="Request marked as completed successfully!"
          duration={2000}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

const renderArchivedCard = (request: MedicineRequest, handleViewDetails: (request: MedicineRequest) => void) => {
    const title = 'Medicine Request';
    const reason = request.reason;
    const createdAt = request.createdAt;
    const status = request.status;

    return (
      <IonCard
        key={request.id}
        style={{
          borderLeft: `8px solid ${status === 'pending'
              ? '#ffc409' // warning
              : ['accepted', 'scheduled', 'processed'].includes(status)
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
                    ['accepted', 'scheduled', 'processed'].includes(status) ? 'primary' :
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
    
    const renderCancelledCard = (request: MedicineRequest, handleViewDetails: (request: MedicineRequest) => void) => {
        const title = 'Medicine Request';
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
    
    export default SuperAdminMedRequestList;
