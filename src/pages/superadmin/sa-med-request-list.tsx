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
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineRequest } from '../../types/medicineRequests';
import { Medicine } from '../../types/medicine';

const db = getFirestore();

const SuperAdminMedRequestList: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MedicineRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'active' | 'completed' | 'not_completed' | 'all'>('pending');
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

  // New state for process modal
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<{ [key: string]: { checked: boolean; quantity: number } }>({});
  const [processNote, setProcessNote] = useState<string>('');

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
      case 'active':
        filtered = requests.filter((r) => r.status === 'accepted' || r.status === 'scheduled');
        break;
      case 'completed':
        filtered = requests.filter((r) => r.status === 'pending completion' || r.status === 'completed');
        break;
      case 'not_completed':
        filtered = requests.filter((r) => r.status === 'cancelled' || r.status === 'rejected' || r.status === 'no show');
        break;
    }
    setFilteredRequests(filtered);
  }, [filter, requests]);

  const handleViewDetails = (request: MedicineRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'completed') => {
    try {
      const requestRef = doc(db, 'medicineRequests', requestId);
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

  const handleMarkAsComplete = () => {
    if (!requestToMarkComplete) return;
    handleUpdateRequestStatus(requestToMarkComplete, 'completed');
    setRequestToMarkComplete(null);
  };

  const handleScheduleRequest = async () => {
    if (!requestToSchedule || !scheduleDate || !scheduleTime || !schedulePlace) return;
    try {
      const requestRef = doc(db, 'medicineRequests', requestToSchedule);
      await updateDoc(requestRef, {
        status: 'scheduled',
        scheduleDate: new Date(scheduleDate),
        scheduleTime,
        schedulePlace,
        updatedAt: new Date(),
      });
      // Update local state
      setRequests(prev => prev.map(r => r.id === requestToSchedule ? { ...r, status: 'scheduled', scheduleDate: new Date(scheduleDate), scheduleTime, schedulePlace } : r));
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
    const fetchMedicines = async () => {
      try {
        const medicinesCol = collection(db, 'medicine');
        const medicinesSnapshot = await getDocs(medicinesCol);
        const medicinesList: Medicine[] = [];
        medicinesSnapshot.forEach(doc => {
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
      } catch (error) {
        console.error('Error fetching medicines:', error);
      }
    };
    fetchMedicines();
  }, []);

  // Open process modal and initialize selected medicines and note
  const handleProcessClick = (request: MedicineRequest) => {
    setSelectedRequest(request);
    // Initialize selectedMedicines state with dispensedMedicines or empty
    const initialSelected: { [key: string]: { checked: boolean; quantity: number } } = {};
    medicines.forEach(med => {
      const qty = request.dispensedMedicines && request.dispensedMedicines[med.id || ''] ? request.dispensedMedicines[med.id || ''] : 0;
      initialSelected[med.id || ''] = { checked: qty > 0, quantity: qty > 0 ? qty : 1 };
    });
    setSelectedMedicines(initialSelected);
    setProcessNote(request.processNote || '');
    setShowProcessModal(true);
  };

  // Handle checkbox toggle
  const toggleMedicineSelection = (medId: string) => {
    setSelectedMedicines(prev => {
      const current = prev[medId];
      return {
        ...prev,
        [medId]: { checked: !current?.checked, quantity: current?.quantity || 1 },
      };
    });
  };

  // Handle quantity change
  const changeMedicineQuantity = (medId: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    setSelectedMedicines(prev => ({
      ...prev,
      [medId]: { checked: true, quantity },
    }));
  };

  // Save process data
  const handleSaveProcess = async () => {
    if (!selectedRequest) return;
    const dispensedMedicines: { [key: string]: number } = {};
    Object.entries(selectedMedicines).forEach(([medId, { checked, quantity }]) => {
      if (checked) {
        dispensedMedicines[medId] = quantity;
      }
    });
    const hasSelected = Object.keys(dispensedMedicines).length > 0;
    if (!hasSelected) {
      setError('Please select at least one medicine.');
      return;
    }
    try {
      const requestRef = doc(db, 'medicineRequests', selectedRequest.id!);
      await updateDoc(requestRef, {
        status: 'pending completion',
        dispensedMedicines,
        processNote,
        updatedAt: new Date(),
      });
      // Update local state
      setRequests(prev =>
        prev.map(r =>
          r.id === selectedRequest.id ? { ...r, status: 'pending completion', dispensedMedicines, processNote } : r
        )
      );
      setShowProcessModal(false);
      setSelectedRequest(null);
      setSelectedMedicines({});
      setProcessNote('');
    } catch (error) {
      console.error('Error saving process data:', error);
      setError('Failed to save process data.');
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
          <IonSegmentButton value="active">
            <IonLabel>Active</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="completed">
            <IonLabel>Completed</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="not_completed">
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
                    : request.status === 'accepted'
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
                    <IonButton color="primary" onClick={() => {
                      setRequestToSchedule(request.id!);
                      setShowScheduleModal(true);
                    }}>Schedule</IonButton>
                  )}
                  {request.status === 'scheduled' && (
                    <IonButton color="tertiary" onClick={() => handleProcessClick(request)}>Process</IonButton>
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
                      <a href={selectedRequest.prescriptionUrl} target="_blank" rel="noopener noreferrer">View Prescription</a>
                    </IonLabel>
                  </IonItem>
                )}
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
                {selectedRequest.notes && (
                  <IonItem>
                    <IonLabel>
                      Notes: &nbsp;
                      <IonText>{selectedRequest.notes}</IonText>
                    </IonLabel>
                  </IonItem>
                )}
                {(selectedRequest.status === 'pending completion' || selectedRequest.status === 'completed') && (
                  <>
                    <IonItem>
                      <IonLabel>
                        Dispensed Medicines: &nbsp;
                        <IonText style={{ fontWeight: 'bold' }}>{Object.entries(selectedRequest.dispensedMedicines || {}).map(([id, qty]) => `${id}: ${qty}`).join(', ')}</IonText>
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
              </IonCard>
            )}

          </IonContent>
        </IonModal>

        {/* Process Modal */}
        <IonModal isOpen={showProcessModal} onDidDismiss={() => setShowProcessModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Process Request</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowProcessModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedRequest && (
              <>
                <IonItem>
                  <IonLabel>Name</IonLabel>
                  <IonInput value={`${selectedRequest.userData?.firstName} ${selectedRequest.userData?.lastName}`} readonly />
                </IonItem>
                <IonItem>
                  <IonLabel>Gender</IonLabel>
                  <IonInput value={selectedRequest.userData?.gender || 'N/A'} readonly />
                </IonItem>
                <IonItem>
                  <IonLabel>Reason</IonLabel>
                  <IonInput value={selectedRequest.reason} readonly />
                </IonItem>
                {selectedRequest.hasPrescription && selectedRequest.prescriptionUrl && (
                  <IonButton fill="outline" onClick={() => window.open(selectedRequest.prescriptionUrl, '_blank')}>View Prescription</IonButton>
                )}
                <IonItemDivider>Medicines</IonItemDivider>
                {medicines.map(med => (
                  <IonItem key={med.id}>
                    <IonLabel>{med.medicine_name} - {med.strength} - {med.dosage_form}</IonLabel>
                    <IonCheckbox
                      checked={selectedMedicines[med.id || '']?.checked || false}
                      onIonChange={() => toggleMedicineSelection(med.id || '')}
                    />
                    {selectedMedicines[med.id || '']?.checked && (
                      <IonInput
                        type="number"
                        value={selectedMedicines[med.id || '']?.quantity || 1}
                        onIonChange={e => changeMedicineQuantity(med.id || '', parseInt(e.detail.value!) || 1)}
                        placeholder="Quantity"
                        min="1"
                      />
                    )}
                  </IonItem>
                ))}
                <IonItem>
                  <IonLabel>Note</IonLabel>
                  <IonTextarea value={processNote} onIonChange={e => setProcessNote(e.detail.value!)} />
                </IonItem>
                <IonButton expand="full" onClick={handleSaveProcess}>Save</IonButton>
              </>
            )}
          </IonContent>
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
          <IonHeader>
            <IonToolbar>
              <IonTitle>Schedule Request</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowScheduleModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonItem>
              <IonLabel>Schedule Date</IonLabel>
              <IonDatetime
                value={scheduleDate}
                onIonChange={e => setScheduleDate(e.detail.value as string)}
                min={new Date().toISOString()}
                max="3000-12-31"
                presentation="date"
              />
            </IonItem>
            <IonItem>
              <IonLabel>Starting Time</IonLabel>
              <IonInput
                type="time"
                value={scheduleTime}
                onIonChange={e => setScheduleTime(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Place</IonLabel>
              <IonInput
                value={schedulePlace}
                onIonChange={e => setSchedulePlace(e.detail.value!)}
                placeholder="Enter place"
              />
            </IonItem>
            <IonButton expand="full" onClick={handleScheduleRequest}>Schedule</IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminMedRequestList;
