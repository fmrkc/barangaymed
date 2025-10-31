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
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, getDocs, arrayUnion, increment } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';
import { Medicine } from '../../types/medicine';
import { Region, Province, CityMunicipality, Barangay, getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality } from '../../services/addressService';
import { calendar, arrowBack, arrowForward, paperPlane, open, openOutline, close, checkbox, checkmark, personRemove, filter, filterCircle, carSportOutline, filterOutline } from 'ionicons/icons';
import './sa-med-request-list.css';

const db = getFirestore();

const SuperAdminMedRequestList: React.FC = () => {
  const { currentUser, cityMunicipalityId } = useAuth();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MedicineRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'processed' | 'scheduled' | 'completed' | 'all'>('pending');
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
  const categoryOptions = ['antibiotic', 'analgesic', 'supplement', 'antihistamine', 'antacid', 'diuretic'];
  const [selectedMedicines, setSelectedMedicines] = useState<{ [key: string]: { quantity: number } }>({});
  const [processNote, setProcessNote] = useState<string>('');
  const [processStep, setProcessStep] = useState<number>(1);
  const [medicineSearch, setMedicineSearch] = useState<string>('');
  const [medicineFilter, setMedicineFilter] = useState<string>('all');

  const [showQuantityActionSheet, setShowQuantityActionSheet] = useState(false);
  const [currentMedId, setCurrentMedId] = useState<string>('');
  const [showQuantityAlert, setShowQuantityAlert] = useState(false);
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [actionSheetButtons, setActionSheetButtons] = useState<any[]>([]);
  const [maxQty, setMaxQty] = useState(0);


  const [processError, setProcessError] = useState<string | null>(null);
  const [isSavingProcess, setIsSavingProcess] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleToast, setShowScheduleToast] = useState(false);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [showRejectToast, setShowRejectToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showAcceptToast, setShowAcceptToast] = useState(false);

  const barangayFilterOptions = useMemo(() => {
    const uniqueBarangays = new Map<string, string>();
    requests.forEach(req => {
      if (req.barangayId && req.barangayName) {
        uniqueBarangays.set(req.barangayId, req.barangayName);
      }
    });
    return Array.from(uniqueBarangays.entries()).map(([id, name]) => ({ id, name }));
  }, [requests]);

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
    let filtered: MedicineRequest[] = requests;

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
        filtered = filtered.filter((r) => r.status === 'completed');
        break;
      case 'all':
      default:
        // No status filter needed
        break;
    }

    // Filter by barangay
    if (selectedBarangayFilter !== 'all') {
      filtered = filtered.filter(r => r.barangayId === selectedBarangayFilter);
    }

    setFilteredRequests(filtered);
  }, [filter, requests, selectedBarangayFilter]);

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
      const requestRef = doc(db, 'medicineRequests', requestId);
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

  const handleMarkAsComplete = () => {
    if (!requestToMarkComplete) return;
    handleUpdateRequestStatus(requestToMarkComplete, 'completed', 'Marked as completed');
    setRequestToMarkComplete(null);
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
        med.strength.toLowerCase().includes(medicineSearch.toLowerCase())
      );
    }
    setFilteredMedicines(filtered);
  }, [medicines, medicineSearch, medicineFilter]);

  // Open process modal and initialize selected medicines and note
  const handleProcessClick = (request: MedicineRequest) => {
    setSelectedRequest(request);
    // Initialize selectedMedicines state with dispensedMedicines or empty
    const initialSelected: { [key: string]: { quantity: number } } = {};
    medicines.forEach(med => {
      const qty = request.dispensedMedicines && request.dispensedMedicines[med.id || ''] ? request.dispensedMedicines[med.id || ''] : 0;
      if (qty > 0) {
        initialSelected[med.id || ''] = { quantity: qty };
      }
    });
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
    setCurrentMedId(medId);
    setMaxQty(med.quantity);
    const buttons = [];
    for (let i = 1; i <= Math.min(10, med.quantity); i++) {
      buttons.push({
        text: i.toString(),
        handler: () => handleActionSheetClick(i),
      });
    }
    if (med.quantity > 10) {
      buttons.push({
        text: 'Custom',
        handler: () => handleActionSheetClick('custom'),
      });
    }
    buttons.push({
      text: 'Remove',
      handler: () => handleActionSheetClick(0),
    });
    buttons.push({
      text: 'Cancel',
      role: 'cancel',
    });
    setActionSheetButtons(buttons);
    setShowQuantityActionSheet(true);
  };

  // Handle action sheet button clicks
  const handleActionSheetClick = (quantity: number | 'custom') => {
    if (quantity === 'custom') {
      setQuantityInput(selectedMedicines[currentMedId]?.quantity?.toString() || '1');
      setShowQuantityAlert(true);
    } else {
      changeMedicineQuantity(currentMedId, quantity);
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
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={isAccepting} message={"Accepting request..."} />
        <IonLoading isOpen={isRejecting} message={"Rejecting request..."} />
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonSegment scrollable value={filter} onIonChange={e => setFilter(e.detail.value as any)}>
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
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        <IonToolbar>
            <IonSearchbar value={searchQuery} onIonChange={e => setSearchQuery(e.detail.value!)} placeholder="Search by resident name..." />
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
          {filteredRequests.filter(request =>
            request.userData?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.userData?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((request) => (
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
                  Barangay: <strong>{request.barangayName || request.barangayId}</strong>
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
                    <p>Rejected by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Rejected request')?.userName || 'N/A'}</strong> </p>
                    <p>Reason: <strong>{request.rejectionReason || 'N/A'}</strong></p>
                    <IonButton fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                  </>
                )}
                {request.status === 'accepted' && (
                  <>
                    <p>Approved by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Accepted request')?.userName || 'N/A'}</strong> </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton className='btn-25-w ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                      <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" onClick={() => { setRequestToSchedule(request.id!); setShowScheduleModal(true); }}>Schedule<IonIcon slot='end' icon={open} /></IonButton>
                    </div>
                  </>
                )}
                {request.status === 'processed' && (
                  <>
                    <p>Medication/s: <strong>{Object.entries(request.dispensedMedicines || {}).map(([id, qty]) => {
                      const med = medicines.find(m => m.id === id);
                      return `${med?.medicine_name || id} (${qty})`;
                    }).join(', ')}</strong> </p>
                    <p>Processed by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Processed request')?.userName || 'N/A'}</strong> </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton className='btn-25-w ion-padding-vertical' expand='block' fill="outline" onClick={() => handleViewDetails(request)}>View Details</IonButton>
                      <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="success" onClick={() => {
                        setRequestToMarkComplete(request.id!);
                        setShowMarkCompleteAlert(true);
                      }}>Mark as Completed<IonIcon slot='end' icon={checkmark} /></IonButton>
                    </div>
                  </>
                )}
                {request.status === 'scheduled' && (
                  <>
                    <p>Scheduled Date: <strong>{request.scheduleDate ? request.scheduleDate.toLocaleDateString() : 'N/A'}</strong></p>
                    <p>Scheduled Time: <strong>{request.scheduleTime || 'N/A'}</strong></p>
                    <p>Scheduled Place: <strong>{request.schedulePlace || 'N/A'}</strong></p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                    <IonButton className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>
                      <IonIcon slot='icon-only' icon={open} />
                    </IonButton>
                    <IonButton className='btn-25-w ion-padding-vertical' expand='block' color="danger" onClick={() => {
                      setRequestToMarkAsNoShow(request.id!);
                      setShowNoShowAlert(true);
                    }}>
                      No Show
                      <IonIcon slot='end' icon={personRemove} />
                    </IonButton>
                    <IonButton className='btn-75-w ion-padding-vertical' expand='block' color="primary" onClick={() => handleProcessClick(request)}>
                      Process
                      <IonIcon slot='end' icon={paperPlane} />
                    </IonButton>
                    </div>
                  </>
                )}
                {request.status === 'no show' && (
                  <>
                    <p>Marked as no-show by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Marked as no show')?.userName || 'N/A'}</strong> </p>
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                  </>
                )}
                {request.status === 'completed' && (
                  <>
                    <p>Completed by: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Marked as completed')?.userName || 'N/A'}</strong> </p>
                    <p>Completed at: <strong>{request.auditTrail?.slice().reverse().find(e => e.action === 'Marked as completed')?.timestamp.toLocaleString() || 'N/A'}</strong></p>
                    <IonButton expand='block' className='ion-padding-vertical' fill="outline" onClick={() => handleViewDetails(request)}>View Details<IonIcon slot='end' icon={open} /></IonButton>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>



        {/* Request Details Modal */}
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
                    const creationEntry = selectedRequest.auditTrail?.find(e => e.action === 'Created request from teleconsultation');
                    const acceptanceEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Accepted request');
                    const rejectionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Rejected request');
                    const processingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Processed request');
                    const schedulingEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Scheduled request');
                    const completionEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as completed');
                    const noShowEntry = selectedRequest.auditTrail?.slice().reverse().find(e => e.action === 'Marked as no show');

                    const isAccepted = !!acceptanceEntry || ['processed', 'scheduled', 'completed'].includes(selectedRequest.status);
                    const isProcessed = !!processingEntry || ['scheduled', 'completed'].includes(selectedRequest.status);
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
                        {creationEntry && (
                          <IonItem>
                            <IonLabel>Created By:</IonLabel>
                            <IonText slot="end">{creationEntry.userName} ({creationEntry.userEmail})</IonText>
                          </IonItem>
                        )}

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

                        {/* Processing Information */}
                        {isProcessed && (
                          <>
                            <IonItemDivider>Processing Details</IonItemDivider>
                            {processingEntry && (
                              <>
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
                            <IonItem>
                              <IonLabel>Dispensed Medicines:</IonLabel>
                              <IonText slot="end" className="ion-text-wrap">{Object.entries(selectedRequest.dispensedMedicines || {}).map(([id, qty]) => {
                                const med = medicines.find(m => m.id === id);
                                return `${med?.medicine_name || id} (x${qty})`;
                              }).join(', ') || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Process Note:</IonLabel>
                              <IonText slot="end" className="ion-text-wrap">{selectedRequest.processNote || 'N/A'}</IonText>
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
                              <IonLabel>Pickup Date:</IonLabel>
                              <IonText slot="end">{selectedRequest.scheduleDate ? selectedRequest.scheduleDate.toLocaleDateString() : 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Pickup Time:</IonLabel>
                              <IonText slot="end">{selectedRequest.scheduleTime || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                              <IonLabel>Pickup Location:</IonLabel>
                              <IonText slot="end" className="ion-text-wrap">{selectedRequest.schedulePlace || 'N/A'}</IonText>
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

        {/* Process Modal */}
        <IonModal isOpen={showProcessModal} onDidDismiss={() => setShowProcessModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Process Request - Step {processStep} of 3</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowProcessModal(false)}>Close</IonButton>
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
                  <IonNote>
                    Select medicines from inventory. Use search and filter to find medicines quickly.
                  </IonNote>
                </IonCard>
                <IonCard>
                  <IonCardContent>
                      <IonSearchbar
                        value={medicineSearch}
                        onIonChange={e => setMedicineSearch(e.detail.value!)}
                        placeholder="Search medicines..."
                      />
                   
                    <IonItem lines='none' className='ion-margin-vertical'>
                      <IonSelect
                        value={medicineFilter}
                        placeholder="Filter by category"
                        onIonChange={e => setMedicineFilter(e.detail.value)}
                      >
                        <IonSelectOption value="all">All Categories</IonSelectOption>
                        {categoryOptions.map(cat => (
                          <IonSelectOption key={cat} value={cat}>{cat}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                    <IonItemDivider>Medicines</IonItemDivider>
                    {filteredMedicines.map(med => (
                      <React.Fragment key={med.id}>
                        <IonItem lines='none' className='ion-margin-vertical'>
                          <IonLabel>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div>
                                {med.medicine_name}
                              </div>
                              <div>
                                <small>{med.dosage_form} - {med.strength} ({med.unit_name})</small>
                              </div>
                              <div>
                                <small>Quantity: {med.quantity} | Expires: {med.expiration_date.toLocaleDateString()}</small>
                              </div>
                            </div>
                          </IonLabel>
                          <IonCheckbox slot='end'
                            checked={!!selectedMedicines[med.id || '']}
                            onIonChange={() => toggleMedicineSelection(med.id || '')}
                          />
                        </IonItem>
                        {selectedMedicines[med.id || ''] && (
                          <IonItem key={`${med.id}-quantity`}>
                            <IonLabel slot='start'>Quantity: {selectedMedicines[med.id || '']?.quantity || 1} / {med.quantity} available</IonLabel>
                            <IonButton slot='end' fill="outline" onClick={() => openQuantityActionSheet(med.id || '')}>
                              Change
                            </IonButton>
                          </IonItem>
                        )}
                      </React.Fragment>
                    ))}
                  </IonCardContent>
                </IonCard>
              </>
            )}
            {processStep === 3 && (
              <>
                <IonCard className="ion-padding">
                  <IonNote>
                    Review the selected medicines and add a process note.
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
                    <IonItemDivider>Process Note</IonItemDivider>
                    <IonItem lines='none' className='ion-margin-vertical'>
                      <IonTextarea
                        fill="outline"
                        value={processNote}
                        onIonChange={e => setProcessNote(e.detail.value!)}
                        placeholder="Add a note about the processing..."
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
                          disabled={isSavingProcess}
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
              <IonButtons slot="end">
                <IonButton onClick={() => setShowScheduleModal(false)}>Close</IonButton>
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
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminMedRequestList;
