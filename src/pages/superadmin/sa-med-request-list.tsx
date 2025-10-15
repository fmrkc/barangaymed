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
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, getDocs, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';
import { Medicine } from '../../types/medicine';
import { calendar, arrowBack, arrowForward, paperPlane } from 'ionicons/icons';

const db = getFirestore();

const SuperAdminMedRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MedicineRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'processed' | 'scheduled' | 'pending completion' | 'completed' | 'all'>('pending');
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
  const [processStep, setProcessStep] = useState<1 | 2 | 3>(1);
  const [medicineSearch, setMedicineSearch] = useState<string>('');
  const [medicineFilter, setMedicineFilter] = useState<string>('all');

  const [showQuantityActionSheet, setShowQuantityActionSheet] = useState(false);
  const [currentMedId, setCurrentMedId] = useState<string>('');
  const [showQuantityAlert, setShowQuantityAlert] = useState(false);
  const [quantityInput, setQuantityInput] = useState<string>('1');

  const [processError, setProcessError] = useState<string | null>(null);

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
            scheduleDate: data.scheduleDate ? (data.scheduleDate instanceof Timestamp ? data.scheduleDate.toDate() : new Date(data.scheduleDate)) : undefined,
            scheduleTime: data.scheduleTime,
            schedulePlace: data.schedulePlace,
            dispensedMedicines: data.dispensedMedicines,
            processNote: data.processNote,
            auditTrail: data.auditTrail ? data.auditTrail.map((entry: any) => ({
              action: entry.action,
              userId: entry.userId,
              userEmail: entry.userEmail,
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
    let filtered: MedicineRequest[] = [];
    switch (filter) {
      case 'all':
        filtered = requests;
        break;
      case 'pending':
        filtered = requests.filter((r) => r.status === 'pending');
        break;
      case 'approved':
        filtered = requests.filter((r) => r.status === 'accepted');
        break;
      case 'processed':
        filtered = requests.filter((r) => r.status === 'processed');
        break;
      case 'scheduled':
        filtered = requests.filter((r) => r.status === 'scheduled');
        break;
      case 'pending completion':
        filtered = requests.filter((r) => r.status === 'pending completion');
        break;
      case 'completed':
        filtered = requests.filter((r) => r.status === 'completed');
        break;
    }
    setFilteredRequests(filtered);
  }, [filter, requests]);

  const handleViewDetails = (request: MedicineRequest) => {
    setSelectedRequest(request);
    setDetailSegment('request');
    setShowModal(true);
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'completed' | 'scheduled' | 'processed', action: string) => {
    if (!currentUser || !currentUser.email) {
      setError('User authentication or email is required.');
      return;
    }
    try {
      const requestRef = doc(db, 'medicineRequests', requestId);
      await updateDoc(requestRef, {
        status: status,
        updatedAt: new Date(),
        auditTrail: arrayUnion({
          action: action,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          timestamp: new Date(),
        }),
      });
    } catch (error) {
      console.error(`Error updating request to ${status}: `, error);
      setError(`Failed to update the request.`);
    }
  };

  const handleAcceptRequest = () => {
    if (!requestToAccept) return;
    handleUpdateRequestStatus(requestToAccept, 'accepted', 'Accepted request');
    setRequestToAccept(null);
  };

  const handleRejectRequest = () => {
    if (!requestToReject) return;
    handleUpdateRequestStatus(requestToReject, 'rejected', 'Rejected request');
    setRequestToReject(null);
  };

  const handleMarkAsComplete = () => {
    if (!requestToMarkComplete) return;
    handleUpdateRequestStatus(requestToMarkComplete, 'completed', 'Marked as completed');
    setRequestToMarkComplete(null);
  };

  const handleScheduleRequest = async () => {
    if (!requestToSchedule || !scheduleDate || !scheduleTime || !schedulePlace || !currentUser) return;
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
          timestamp: new Date(),
        }),
      });
      // Update local state
      setRequests(prev => prev.map(r => r.id === requestToSchedule ? { ...r, status: 'scheduled', scheduleDate: new Date(scheduleDate), scheduleTime, schedulePlace, auditTrail: [...(r.auditTrail || []), { action: 'Scheduled request', userId: currentUser.uid, userEmail: currentUser.email!, timestamp: new Date() }] } : r));
      setShowScheduleModal(false);
      setRequestToSchedule(null);
      setScheduleDate('');
      setScheduleTime('');
      setSchedulePlace('');
    } catch (error) {
      console.error('Error scheduling request:', error);
      setError('Failed to schedule the request.');
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
    setCurrentMedId(medId);
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
  const handleCustomQuantity = () => {
    const qty = parseInt(quantityInput) || 1;
    changeMedicineQuantity(currentMedId, qty);
    setShowQuantityAlert(false);
  };

  // Save process data
  const handleSaveProcess = async () => {
    if (!selectedRequest) return;
    const dispensedMedicines: { [key: string]: number } = {};
    Object.entries(selectedMedicines).forEach(([medId, { quantity }]) => {
      dispensedMedicines[medId] = quantity;
    });
    const hasSelected = Object.keys(dispensedMedicines).length > 0;
    if (!hasSelected) {
      setProcessError('Please select at least one medicine.');
      return;
    }
    try {
      const requestRef = doc(db, 'medicineRequests', selectedRequest.id!);
      await updateDoc(requestRef, {
        status: 'processed',
        dispensedMedicines,
        processNote,
        updatedAt: new Date(),
      });
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
    } catch (error) {
      console.error('Error saving process data:', error);
      setProcessError('Failed to save process data.');
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
          <IonSegmentButton value="processed">
            <IonLabel>Processed</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="scheduled">
            <IonLabel>Scheduled</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="pending completion">
            <IonLabel>Pending Completion</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
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
                    : request.status === 'processed'
                    ? '#017457' // primary (green-ish)
                    : request.status === 'scheduled'
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
                          : request.status === 'scheduled'
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
                    <IonButton color="primary" onClick={() => handleProcessClick(request)}>Process</IonButton>
                  )}
                  {request.status === 'processed' && (
                    <IonButton color="primary" onClick={() => {
                      setRequestToSchedule(request.id!);
                      setShowScheduleModal(true);
                    }}>Schedule</IonButton>
                  )}
                </div>
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
                  {detailSegment === 'request' && (
                    <>
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
                      {selectedRequest.status === 'scheduled' && (
                        <>
                          {selectedRequest.scheduleDate && (
                            <IonItem>
                              <IonLabel>
                                Scheduled Date: &nbsp;
                                <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.scheduleDate.toLocaleDateString()}</IonText>
                              </IonLabel>
                            </IonItem>
                          )}
                          {selectedRequest.scheduleTime && (
                            <IonItem>
                              <IonLabel>
                                Scheduled Time: &nbsp;
                                <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.scheduleTime}</IonText>
                              </IonLabel>
                            </IonItem>
                          )}
                          {selectedRequest.schedulePlace && (
                            <IonItem>
                              <IonLabel>
                                Scheduled Place: &nbsp;
                                <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.schedulePlace}</IonText>
                              </IonLabel>
                            </IonItem>
                          )}
                        </>
                      )}
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
                            <IonButton className='ion-padding-vertical' expand='block' fill="outline" size="small" onClick={() => window.open(selectedRequest.prescriptionUrl, '_blank')}>View Prescription</IonButton>
                            </IonLabel>
                        </IonItem>
                      )}
                      <IonItem>
                        <IonLabel>
                          Created At: &nbsp;
                          <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.createdAt ? selectedRequest.createdAt.toLocaleString() : 'N/A'}</IonText>
                        </IonLabel>
                      </IonItem>
                      {(selectedRequest.status === 'pending completion' || selectedRequest.status === 'completed') && (
                        <>
                          <IonItem>
                            <IonLabel>
                              Dispensed Medicines: &nbsp;
                              <IonText style={{ fontWeight: 'bold' }}>{Object.entries(selectedRequest.dispensedMedicines || {}).map(([id, qty]) => {
                                const med = medicines.find(m => m.id === id);
                                return `${med?.medicine_name || id}: ${qty}`;
                              }).join(', ')}</IonText>
                            </IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonLabel>
                              Process Note: &nbsp;
                              <IonText style={{ fontWeight: 'bold' }}>{selectedRequest.processNote}</IonText>
                            </IonLabel>
                          </IonItem>
                        </>
                      )}
                      {selectedRequest.auditTrail && selectedRequest.auditTrail.length > 0 && (
                        <>
                          <IonItemDivider>Audit Trail</IonItemDivider>
                          {selectedRequest.auditTrail.map((entry, index) => (
                            <IonItem key={index}>
                              <IonLabel>
                                <IonText style={{ fontWeight: 'bold' }}>{entry.action}</IonText>
                                <br />
                                <small>By: {entry.userEmail} ({entry.userId}) at {entry.timestamp.toLocaleString()}</small>
                              </IonLabel>
                            </IonItem>
                          ))}
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
                            </div>
                          </IonLabel>
                          <IonCheckbox slot='end'
                            checked={!!selectedMedicines[med.id || '']}
                            onIonChange={() => toggleMedicineSelection(med.id || '')}
                          />
                        </IonItem>
                        {selectedMedicines[med.id || ''] && (
                          <IonItem key={`${med.id}-quantity`}>
                            <IonLabel slot='start'>{med.medicine_name} Quantity: {selectedMedicines[med.id || '']?.quantity || 1}</IonLabel>
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
                          disabled={loading}
                        >
                          <IonText className='ion-padding-vertical'>Save</IonText>
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
              <IonButton shape='round' className='ion-padding-vertical' expand="full" onClick={handleScheduleRequest}>
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
          buttons={[
            {
              text: '1',
              handler: () => handleActionSheetClick(1),
            },
            {
              text: '2',
              handler: () => handleActionSheetClick(2),
            },
            {
              text: '3',
              handler: () => handleActionSheetClick(3),
            },
            {
              text: '5',
              handler: () => handleActionSheetClick(5),
            },
            {
              text: '10',
              handler: () => handleActionSheetClick(10),
            },
            {
              text: 'Remove',
              handler: () => handleActionSheetClick(0),
            },
            {
              text: 'Custom',
              handler: () => handleActionSheetClick('custom'),
            },
            {
              text: 'Cancel',
              role: 'cancel',
            },
          ]}
        />

        {/* Custom Quantity Alert */}
        <IonAlert
          isOpen={showQuantityAlert}
          onDidDismiss={() => setShowQuantityAlert(false)}
          header="Enter Custom Quantity"
          inputs={[
            {
              name: 'quantity',
              type: 'number',
              placeholder: 'Quantity',
              value: quantityInput,
              min: 1,
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
                setQuantityInput(data.quantity);
                handleCustomQuantity();
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminMedRequestList;
