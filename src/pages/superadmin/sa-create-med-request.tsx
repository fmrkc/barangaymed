import React, { useEffect, useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonText,
  IonLoading,
  IonButtons,
  IonButton,
  IonModal,
  IonItem,
  IonLabel,
  IonTextarea,
  IonCheckbox,
  IonToast,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonMenuButton,
  IonIcon,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
} from '@ionic/react';
import { getFirestore, collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, Timestamp, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { UserService } from '../../services/userService';
import { getBarangayNameByCode } from '../../services/addressService';
import { paperPlane, open, checkmark } from 'ionicons/icons';

const db = getFirestore();

const SuperAdminCreateMedRequest: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRequests, setFilteredRequests] = useState<TeleconsultationRequest[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUserRequests, setSelectedUserRequests] = useState<TeleconsultationRequest[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'teleconsultationRequests'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const reqs: TeleconsultationRequest[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'completed') {
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
          }
        });
        setRequests(reqs);
        setLoading(false);
      },
      (err) => {
        setError('Failed to fetch completed teleconsultation requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleRefresh = (event: CustomEvent) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      event.detail.complete();
    }, 1000);
  };

  const handleSearchChange = async (e: CustomEvent) => {
    const query = e.detail.value?.toLowerCase() || '';
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredRequests([]);
      setShowSearchResults(false);
      setSelectedUserRequests([]);
      return;
    }

    try {
      // Fetch users with role 'user' from Firestore
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'user'));
      const usersSnapshot = await getDocs(usersQuery);
      const users: { uid: string; firstName: string; lastName: string; barangayId: string }[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        users.push({
          uid: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          barangayId: data.barangayId || '',
        });
      });

      // Filter users based on search query
      const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(query);
      });

      // Get unique users (in case there are duplicates)
      const uniqueUsers = filteredUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.uid === user.uid)
      );

      // Create filtered requests based on unique users
      const filtered = uniqueUsers.map(user => {
        // Find the most recent completed request for this user
        const userRequests = requests.filter(req => req.userId === user.uid);
        return userRequests[0]; // Take the first (most recent) request
      }).filter(Boolean);

      setFilteredRequests(filtered);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setFilteredRequests([]);
      setShowSearchResults(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const userRequests = requests
      .filter(request => request.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));

    setSelectedUserRequests(userRequests);
    setShowSearchResults(false);
  };

  const handleCreateMedRequest = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setReason(request.reason);
    setHasPrescription(false);
    setPrescriptionFile(null);
    setShowModal(true);
  };

  const handleSubmitMedRequest = async () => {
    if (!selectedRequest || !currentUser || !reason.trim()) {
      setToastMessage('Please provide a reason for the medicine request.');
      setShowToast(true);
      return;
    }
    if (hasPrescription && !prescriptionFile) {
      setToastMessage('Please upload a prescription photo.');
      setShowToast(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const userService = UserService.getInstance();
      const userData = await userService.getUserData(selectedRequest.userId);

      const barangayName = await getBarangayNameByCode(selectedRequest.barangayId);

      let prescriptionUrl = '';
      if (hasPrescription && prescriptionFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `prescriptions/${selectedRequest.userId}/${Date.now()}_${prescriptionFile.name}`);
        await uploadBytes(storageRef, prescriptionFile);
        prescriptionUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'medicineRequests'), {
        userId: selectedRequest.userId,
        barangayId: selectedRequest.barangayId,
        barangayName: barangayName,
        userData: {
          firstName: userData.firstName,
          middleName: userData.middleName,
          lastName: userData.lastName,
          suffix: userData.suffix,
          address: userData.address,
          gender: userData.gender,
          contactNumber: userData.contactNumber,
          email: userData.email,
        },
        reason: reason.trim(),
        hasPrescription,
        prescriptionUrl,
        status: 'approved',
        createdAt: serverTimestamp(),
      });
      setToastMessage('Medicine request created successfully.');
      setShowToast(true);
      setShowModal(false);
      setSelectedRequest(null);
      setReason('');
      setHasPrescription(false);
      setPrescriptionFile(null);
    } catch (error) {
      console.error('Error creating medicine request:', error);
      setToastMessage('Failed to create medicine request. Please try again.');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Create Medicine Request</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={loading} message="Loading completed teleconsultations..." />
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        {error && (
          <IonText color="danger" className="ion-padding">
            {error}
          </IonText>
        )}

        {!loading && !error && (
          <>
            <IonItem>
              <IonLabel>THIS MEDICINE REQUEST IS FOR:</IonLabel>
            </IonItem>
            <IonItem>
              <IonSearchbar
                placeholder="Search by full name"
                value={searchQuery}
                onIonInput={handleSearchChange}
                debounce={300}
              />
            </IonItem>

            {showSearchResults && filteredRequests.length > 0 && (
              <IonList style={{ backgroundColor: 'transparent' }}>
                {filteredRequests.map((request) => (
                  <IonCard key={request.id}>
                    <IonCardHeader>
                      <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {request.userData?.firstName} {request.userData?.lastName}
                      </IonCardTitle>
                      <IonCardSubtitle>
                        Barangay: {request.barangayId}
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonButton
                        expand='block'
                        className='ion-padding-vertical'
                        onClick={() => handleUserSelect(request.userId)}
                      >
                        View Teleconsultation History
                        <IonIcon slot='end' icon={open} />
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            )}

            {selectedUserRequests.length > 0 && (
              <>
                <IonItem>
                  <IonLabel>RECENTLY COMPLETED TELECONSULTATIONS:</IonLabel>
                </IonItem>
                <IonList style={{ backgroundColor: 'transparent' }}>
                  {selectedUserRequests.map((request) => (
                    <IonCard key={request.id}>
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                          {request.userData?.firstName} {request.userData?.lastName}
                        </IonCardTitle>
                        <IonCardSubtitle>
                          Barangay: {request.barangayId}
                        </IonCardSubtitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <p>Reason: {request.reason}</p>
                        <p>Completed: {request.updatedAt ? request.updatedAt.toLocaleString() : 'N/A'}</p>
                        <IonButton
                          expand='block'
                          className='ion-padding-vertical'
                          onClick={() => handleCreateMedRequest(request)}
                        >
                          Create Medicine Request
                          <IonIcon slot='end' icon={paperPlane} />
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              </>
            )}

            {!showSearchResults && selectedUserRequests.length === 0 && requests.length > 0 && (
              <>
                <IonItem>
                  <IonLabel>RECENTLY COMPLETED TELECONSULTATIONS:</IonLabel>
                </IonItem>
                <IonList style={{ backgroundColor: 'transparent' }}>
                  {requests.map((request) => (
                    <IonCard key={request.id}>
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                          {request.userData?.firstName} {request.userData?.lastName}
                        </IonCardTitle>
                        <IonCardSubtitle>
                          Barangay: {request.barangayId}
                        </IonCardSubtitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <p>Reason: {request.reason}</p>
                        <p>Completed: {request.updatedAt ? request.updatedAt.toLocaleString() : 'N/A'}</p>
                        <IonButton
                          expand='block'
                          className='ion-padding-vertical'
                          onClick={() => handleCreateMedRequest(request)}
                        >
                          Create Medicine Request
                          <IonIcon slot='end' icon={paperPlane} />
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </IonList>
              </>
            )}

            {!showSearchResults && selectedUserRequests.length === 0 && requests.length === 0 && (
              <IonCard>
                <IonCardContent>
                  <IonText className="ion-padding">No completed teleconsultations found.</IonText>
                </IonCardContent>
              </IonCard>
            )}
          </>
        )}

        {/* Create Medicine Request Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Create Medicine Request</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonLoading isOpen={isSubmitting} message="Creating medicine request..." />
            {selectedRequest && (
              <IonCard className="ion-padding">
                <IonItem lines='none'>
                  <h2>Resident: {selectedRequest.userData?.firstName} {selectedRequest.userData?.lastName}</h2>
                </IonItem>
                <IonItem>
                  <IonLabel>Reason for Medicine Request:</IonLabel>
                </IonItem>
                <IonItem lines='none'>
                  <IonTextarea
                    fill='outline'
                    value={reason}
                    readonly
                    rows={4}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Has Prescription:</IonLabel>
                  <IonCheckbox
                    slot="end"
                    checked={hasPrescription}
                    onIonChange={e => {
                      setHasPrescription(e.detail.checked);
                      if (!e.detail.checked) {
                        setPrescriptionFile(null);
                      }
                    }}
                  />
                </IonItem>
                {hasPrescription && (
                  <IonItem>
                    <IonLabel>Upload Prescription Photo:</IonLabel>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setPrescriptionFile(file);
                      }}
                      style={{ marginTop: '8px' }}
                    />
                  </IonItem>
                )}
              </IonCard>
            )}
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton
                expand="block"
                shape="round"
                color="success"
                onClick={handleSubmitMedRequest}
                disabled={isSubmitting || !reason.trim()}
                className="ion-margin"
              >
                Create Request
                <IonIcon slot="end" icon={checkmark} />
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastMessage.includes('successfully') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminCreateMedRequest;
