import React, { useState } from 'react';
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
  IonButtons,
  IonButton,
  IonModal,
  IonItem,
  IonLabel,
  IonTextarea,
  IonCheckbox,
  IonToast,
  IonPage,
  IonMenuButton,
  IonIcon,
  IonFooter,
  IonSearchbar,
} from '@ionic/react';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { getBarangayNameByCode } from '../../services/addressService';
import { checkmark } from 'ionicons/icons';

const db = getFirestore();

const SuperAdminCreateMedRequest: React.FC = () => {
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string; } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string; name: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUserRequests, setSelectedUserRequests] = useState<any[]>([]);
  const [showUserRequests, setShowUserRequests] = useState(false);
  const [selectedTeleconsultRequest, setSelectedTeleconsultRequest] = useState<any>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleSearchChange = async (e: CustomEvent) => {
    const queryStr = e.detail.value?.toLowerCase() || '';
    setSearchQuery(queryStr);
    setError(null);

    if (queryStr.trim() === '') {
      setSearchedUsers([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('role', '==', 'user'));
      const querySnapshot = await getDocs(q);
      const users: { uid: string; firstName: string; lastName: string; barangayId: string; name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase().trim();
        if (fullName.includes(queryStr)) {
          users.push({
            uid: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            barangayId: data.barangayId || '',
            name: fullName,
          });
        }
      });
      setSearchedUsers(users);
      setShowSearchResults(true);
    } catch (error: any) {
      setError(error.message || 'Failed to search for users.');
    }
  };

  const handleUserSelect = async (user: { uid: string; firstName: string; lastName: string; barangayId: string; }) => {
    setSelectedUser(user);
    setShowSearchResults(false);
    setSearchQuery('');
    setReason('');
    setHasPrescription(false);
    setPrescriptionFile(null);

    try {
      const q = query(collection(db, 'teleconsultationRequests'), where('userId', '==', user.uid), where('status', '==', 'completed'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const requests: any[] = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setSelectedUserRequests(requests);
      setShowUserRequests(true);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch user requests.');
    }
  };

  const handleCreateMedRequestFromTeleconsult = async (teleconsultRequest: any) => {
    if (!selectedUser || !currentUser) {
      setToastMessage('User not selected.');
      setShowToast(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const userService = UserService.getInstance();
      const userData = await userService.getUserData(selectedUser.uid);

      const barangayName = await getBarangayNameByCode(selectedUser.barangayId);

      await addDoc(collection(db, 'medicineRequests'), {
        userId: selectedUser.uid,
        barangayId: selectedUser.barangayId,
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
        reason: teleconsultRequest.reason,
        hasPrescription: false,
        prescriptionUrl: '',
        status: 'accepted',
        createdAt: serverTimestamp(),
      });
      setToastMessage('Medicine request created successfully.');
      setShowToast(true);
      setShowUserRequests(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error creating medicine request:', error);
      setToastMessage('Failed to create medicine request. Please try again.');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMedRequest = async () => {
    if (!selectedUser || !currentUser || !reason.trim()) {
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
      const userData = await userService.getUserData(selectedUser.uid);

      const barangayName = await getBarangayNameByCode(selectedUser.barangayId);

      let prescriptionUrl = '';
      if (hasPrescription && prescriptionFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `prescriptions/${selectedUser.uid}/${Date.now()}_${prescriptionFile.name}`);
        await uploadBytes(storageRef, prescriptionFile);
        prescriptionUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'medicineRequests'), {
        userId: selectedUser.uid,
        barangayId: selectedUser.barangayId,
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
        status: 'accepted',
        createdAt: serverTimestamp(),
      });
      setToastMessage('Medicine request created successfully.');
      setShowToast(true);
      setShowModal(false);
      setSelectedUser(null);
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
        {error && (
          <IonText color="danger" className="ion-padding">
            {error}
          </IonText>
        )}

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

        {showSearchResults && searchedUsers.length > 0 && (
          <IonList style={{ backgroundColor: 'transparent' }}>
            {searchedUsers.map((user) => (
              <IonCard key={user.uid}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {user.firstName} {user.lastName}
                  </IonCardTitle>
                  <IonCardSubtitle>
                    Barangay: {user.barangayId}
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonButton
                    expand='block'
                    className='ion-padding-vertical'
                    onClick={() => handleUserSelect(user)}
                  >
                    View Teleconsultation Requests
                    <IonIcon slot='end' icon={checkmark} />
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        {showSearchResults && searchedUsers.length === 0 && (
          <IonCard>
            <IonCardContent>
              <IonText className="ion-padding">No users found.</IonText>
            </IonCardContent>
          </IonCard>
        )}

        {/* User Requests Modal */}
        <IonModal isOpen={showUserRequests} onDidDismiss={() => setShowUserRequests(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Teleconsultation Requests</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowUserRequests(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedUser && (
              <IonCard className="ion-padding">
                <IonItem lines='none'>
                  <h2>Resident: {selectedUser.firstName} {selectedUser.lastName}</h2>
                </IonItem>
              </IonCard>
            )}
            {selectedUserRequests.length > 0 ? (
              <IonList>
                {selectedUserRequests.map((request, index) => (
                  <IonCard key={request.id}>
                    <IonCardHeader>
                      <IonCardTitle>Request ID: {request.id}</IonCardTitle>
                      <IonCardSubtitle>Status: {request.status}</IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonText>Reason: {request.reason}</IonText>
                      <br />
                      <IonText>Created At: {request.createdAt?.toDate().toLocaleString()}</IonText>
                      {index === 0 && (
                        <IonButton
                          expand="block"
                          color="primary"
                          onClick={() => {
                            setSelectedTeleconsultRequest(request);
                            setShowSummaryModal(true);
                          }}
                          disabled={isSubmitting}
                          className="ion-margin-top"
                        >
                          Create Medicine Request
                          <IonIcon slot="end" icon={checkmark} />
                        </IonButton>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            ) : (
              <IonCard>
                <IonCardContent>
                  <IonText>No completed teleconsultation requests found.</IonText>
                </IonCardContent>
              </IonCard>
            )}
          </IonContent>
        </IonModal>

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
            {selectedUser && (
              <IonCard className="ion-padding">
                <IonItem lines='none'>
                  <h2>Resident: {selectedUser.firstName} {selectedUser.lastName}</h2>
                </IonItem>
                <IonItem>
                  <IonLabel>Reason for Medicine Request:</IonLabel>
                </IonItem>
                <IonItem lines='none'>
                  <IonTextarea
                    fill='outline'
                    value={reason}
                    onIonInput={(e) => setReason(e.detail.value!)}
                    placeholder="Enter reason for medicine request"
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

        {/* Summary Modal */}
        <IonModal isOpen={showSummaryModal} onDidDismiss={() => setShowSummaryModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Confirm Medicine Request</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSummaryModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedUser && selectedTeleconsultRequest && (
              <IonCard className="ion-padding">
                <IonItem lines='none'>
                  <h2>Resident: {selectedUser.firstName} {selectedUser.lastName}</h2>
                </IonItem>
                <IonItem>
                  <IonLabel>Reason for Medicine Request:</IonLabel>
                </IonItem>
                <IonItem lines='none'>
                  <IonTextarea
                    fill='outline'
                    value={selectedTeleconsultRequest.reason}
                    readonly
                    rows={4}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Status:</IonLabel>
                  <IonText>Accepted</IonText>
                </IonItem>
              </IonCard>
            )}
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton
                expand="block"
                shape="round"
                color="success"
                onClick={() => {
                  handleCreateMedRequestFromTeleconsult(selectedTeleconsultRequest);
                  setShowSummaryModal(false);
                }}
                disabled={isSubmitting}
                className="ion-margin"
              >
                Confirm and Create Request
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
