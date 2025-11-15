import React, { useState, useRef } from 'react';
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
  IonAlert,
  IonPage,
  IonMenuButton,
  IonIcon,
  IonFooter,
  IonSearchbar,
  IonSkeletonText,
  IonItemDivider,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, QueryDocumentSnapshot, getDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { getBarangayNameByCode } from '../../services/addressService';
import { checkmark, help, open, paperPlane, arrowBack, arrowForward, cloudUpload } from 'ionicons/icons';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { getFunctions, httpsCallable } from 'firebase/functions';

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

const SuperAdminCreateMedRequest: React.FC = () => {
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; name: string; birthdate: any; gender: string; }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUserRequests, setSelectedUserRequests] = useState<TeleconsultationRequest[]>([]);
  const [showUserRequests, setShowUserRequests] = useState(false);
  const [selectedTeleconsultRequest, setSelectedTeleconsultRequest] = useState<TeleconsultationRequest | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showHelpAlert, setShowHelpAlert] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [editableReason, setEditableReason] = useState('');
  const [showCreateGeneralRequestModal, setShowCreateGeneralRequestModal] = useState(false);
  const [medRequestStep, setMedRequestStep] = useState(1);
  const [medRequestReasons, setMedRequestReasons] = useState({
    'Fever': false,
    'Cough and Colds': false,
    'Headache': false,
    'Body Pain': false,
    'Allergies': false,
    'Diarrhea': false,
    'Others': false,
  });
  const [medRequestOtherReason, setMedRequestOtherReason] = useState('');
  const [medRequestHasPrescription, setMedRequestHasPrescription] = useState(false);
  const [medRequestPrescriptionFile, setMedRequestPrescriptionFile] = useState<File | null>(null);
  const medRequestFileInputRef = useRef<HTMLInputElement>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const calculateAge = (birthdate: any) => {
    if (!birthdate) return '';
    const birthDate = birthdate.toDate ? birthdate.toDate() : new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const formatBirthdate = (birthdate: any) => {
      if (!birthdate) return '';
      const date = birthdate.toDate ? birthdate.toDate() : new Date(birthdate);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
  };

  const handleSearchChange = async (e: CustomEvent) => {
    const queryStr = e.detail.value?.toLowerCase() || '';
    setSearchQuery(queryStr);
    setError(null);

    if (queryStr.trim() === '') {
      setSearchedUsers([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setShowSearchResults(false);
    setIsSearching(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'user'), where('verificationStatus', '==', 'verified'));
      const querySnapshot = await getDocs(q);
      const users: { uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; name: string; birthdate: any; gender: string; }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as { firstName: string, lastName: string, barangayId: string, barangayName: string, birthdate: any, gender: string };
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase().trim();
        if (fullName.includes(queryStr)) {
          users.push({
            uid: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            barangayId: data.barangayId || '',
            barangayName: data.barangayName || '',
            name: fullName,
            birthdate: data.birthdate,
            gender: data.gender,
          });
        }
      });
      setSearchedUsers(users);
      setShowSearchResults(true);
    } catch (error: any) {
      setError(error.message || 'Failed to search for users.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = async (user: { uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; }) => {
    setSelectedUser(user);
    setReason('');
    setHasPrescription(false);
    setPrescriptionFile(null);

    try {
      const q = query(collection(db, 'teleconsultationRequests'), where('userId', '==', user.uid), where('status', '==', 'completed'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const requests: TeleconsultationRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          ...(data as object),
          id: doc.id,
          createdAt: (data.createdAt as any).toDate(),
          updatedAt: (data.updatedAt as any)?.toDate(),
          startTime: (data.startTime as any)?.toDate(),
          endTime: (data.endTime as any)?.toDate(),
        } as TeleconsultationRequest);
      });
      setSelectedUserRequests(requests);
      setShowUserRequests(true);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch user requests.');
    }
  };

  const handleCreateMedRequestFromTeleconsult = async (teleconsultRequest: TeleconsultationRequest) => {
    if (!selectedUser || !currentUser || !editableReason.trim()) {
      setToastMessage('A reason for the request is required.');
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
        reason: editableReason.trim(),
        hasPrescription: !!teleconsultRequest.prescriptionUrl,
        prescriptionUrl: teleconsultRequest.prescriptionUrl || '',
        status: 'accepted',
        createdAt: serverTimestamp(),
        isShown: true,
        auditTrail: [
          {
            action: 'Created request from teleconsultation',
            userId: currentUser.uid,
            userEmail: currentUser.email || 'unknown',
            userName: currentUser.displayName || currentUser.email || 'Super Admin',
            timestamp: new Date(),
          },
          {
            action: 'Accepted request',
            userId: currentUser.uid,
            userEmail: currentUser.email || 'unknown',
            userName: currentUser.displayName || currentUser.email || 'Super Admin',
            timestamp: new Date(),
          }
        ],
      });
      setToastMessage('Medicine request created successfully.');
      setShowToast(true);
      setShowUserRequests(false);
      setSelectedUser(null);

      // Send SMS notification
      if (selectedUser.uid) {
        const smsMessage = `Your medicine request has been created and accepted by the Superadmin.`;
        await sendSms(selectedUser.uid, smsMessage);
      }

    } catch (error) {
      console.error('Error creating medicine request:', error);
      setToastMessage('Failed to create medicine request. Please try again.');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneralMedRequestSubmit = async () => {
    if (!selectedUser || !currentUser) {
      setToastMessage('No user selected.');
      setShowToast(true);
      return;
    }
    
    const getReasonString = () => {
        const selectedReasons = Object.entries(medRequestReasons)
          .filter(([, isChecked]) => isChecked)
          .map(([reason]) => reason)
          .filter(reason => reason !== 'Others');
        let finalReason = selectedReasons.join(', ');
        if (medRequestReasons.Others && medRequestOtherReason.trim()) {
          if (finalReason) {
            finalReason += `, ${medRequestOtherReason.trim()}`;
          } else {
            finalReason = medRequestOtherReason.trim();
          }
        }
        return finalReason;
    };

    const reasonString = getReasonString();
    if (!reasonString) {
      setToastMessage('Please provide a reason for the medicine request.');
      setShowToast(true);
      return;
    }
    if (medRequestReasons.Others && !medRequestOtherReason.trim()) {
      setToastMessage('Please specify the other reason.');
      setShowToast(true);
      return;
    }
    if (medRequestHasPrescription && !medRequestPrescriptionFile) {
      setToastMessage('Please upload a photo of your prescription.');
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const userService = UserService.getInstance();
      const userData = await userService.getUserData(selectedUser.uid);
      const barangayName = await getBarangayNameByCode(selectedUser.barangayId);

      let prescriptionUrl = '';
      if (medRequestHasPrescription && medRequestPrescriptionFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `prescriptions/${selectedUser.uid}/${Date.now()}_${medRequestPrescriptionFile.name}`);
        await uploadBytes(storageRef, medRequestPrescriptionFile);
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
        reason: reasonString,
        hasPrescription: medRequestHasPrescription,
        prescriptionUrl,
        status: 'accepted', // Superadmin creates it as accepted
        createdAt: serverTimestamp(),
        isShown: true,
        auditTrail: [
          {
            action: 'Created request by Superadmin',
            userId: currentUser.uid,
            userEmail: currentUser.email || 'unknown',
            userName: currentUser.displayName || currentUser.email || 'Super Admin',
            timestamp: new Date(),
          },
          {
            action: 'Accepted request',
            userId: currentUser.uid,
            userEmail: currentUser.email || 'unknown',
            userName: currentUser.displayName || currentUser.email || 'Super Admin',
            timestamp: new Date(),
          }
        ],
      });
      setToastMessage('Medicine request created successfully.');
      setShowToast(true);
      
      // Send SMS notification
      if (selectedUser.uid) {
        const smsMessage = `Your medicine request has been created and accepted by the Superadmin.`;
        await sendSms(selectedUser.uid, smsMessage);
      }
      
      setShowCreateGeneralRequestModal(false);
      setSelectedUser(null);
      setMedRequestStep(1);
      setMedRequestReasons({
        'Fever': false, 'Cough and Colds': false, 'Headache': false, 'Body Pain': false, 'Allergies': false, 'Diarrhea': false, 'Others': false,
      });
      setMedRequestOtherReason('');
      setMedRequestHasPrescription(false);
      setMedRequestPrescriptionFile(null);

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
        isShown: true,
      });
      setToastMessage('Medicine request created successfully.');
      setShowToast(true);

      // Send SMS notification
      if (selectedUser.uid) {
        const smsMessage = `Your medicine request has been created and accepted by the Superadmin.`;
        await sendSms(selectedUser.uid, smsMessage);
      }

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
          <IonButtons slot='end'>
            <IonButton onClick={() => setShowHelpAlert(true)}>
              <IonIcon icon={help} slot='icon-only' />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
             <IonSearchbar
            placeholder="Search by resident's full name"
            value={searchQuery}
            onIonInput={handleSearchChange}
            debounce={300}
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {error && (
          <IonText color="danger" className="ion-padding">
            {error}
          </IonText>
        )}

        {searchQuery.trim() === '' && !showSearchResults && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
            <IonCard style={{ textAlign: 'center' }} className='ion-padding-vertical'>
              <IonCardHeader>
                <IonCardTitle>
                  <IonText color={'primary'}>
                    <strong>Welcome to Create Medicine Request</strong>
                  </IonText>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>This page is an extension of <strong>Teleconsultation Requests</strong>. This is where to add the prescription for a resident's completed teleconsultation.</p>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {showSearchResults && searchedUsers.length > 0 && (
          <IonCard>
            <IonList style={{ backgroundColor: 'transparent' }}>
            {searchedUsers.map((user) => (
              <IonItem key={user.uid} className='ion-no-padding' lines='none'>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      {user.firstName} {user.lastName}
                    </IonCardTitle>
                    <IonCardSubtitle>
                      {formatBirthdate(user.birthdate)} ({calculateAge(user.birthdate)}) | {user.gender}
                    </IonCardSubtitle>
                    <IonCardSubtitle>
                      Barangay: {user.barangayName}
                    </IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>

                  </IonCardContent>
                </IonCard>
                <IonButton slot='end'
                  expand='block'
                  className='ion-padding-vertical'
                  onClick={() => handleUserSelect(user)}
                >
                  Create Medicine Request
                  <IonIcon slot='end' icon={open} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
          </IonCard>
        )}

        {isSearching && (
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
                  <IonSkeletonText animated style={{ width: '80%' }} />
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
                <IonCardHeader>
                 <IonCardTitle>
                   {selectedUser.firstName} {selectedUser.lastName}
                 </IonCardTitle>
                 <IonCardSubtitle>
                    Barangay: {selectedUser.barangayName}
                 </IonCardSubtitle>
                </IonCardHeader>
                <IonButton expand="block" onClick={() => {
                    setShowCreateGeneralRequestModal(true);
                    setShowUserRequests(false);
                }}>
                    Create New Medicine Request
                </IonButton>
              </IonCard>
            )}
            <IonItemDivider>Or create from a completed teleconsultation</IonItemDivider>
            {selectedUserRequests.length > 0 ? (
              <IonList>
                {selectedUserRequests.map((request, index) => (
                  <IonCard key={request.id}>
                      <IonItemDivider>Request ID: {request.id} • Created at: {request.createdAt?.toLocaleString()}</IonItemDivider>
                    <IonCardHeader>
                      <IonCardSubtitle>
                        Status:
                        <IonText color={request.status === 'completed' ? 'success' : 'medium'} className="ion-margin-start">
                         <strong> {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</strong>
                        </IonText>
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonText>Reason: {request.reason}</IonText>
                     
                      {index === 0 && (
                        <IonButton
                          expand="block"
                          color="primary"
                          onClick={() => {
                            setSelectedTeleconsultRequest(request);
                            setEditableReason(request.reason);
                            setShowSummaryModal(true);
                          }}
                          disabled={isSubmitting}
                          className="ion-padding-vertical"
                        >
                          Create Medicine Request
                          <IonIcon slot="end" icon={open} />
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

        <IonModal isOpen={showSummaryModal} onDidDismiss={() => setShowSummaryModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Create Medicine Request</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowSummaryModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedUser && selectedTeleconsultRequest && currentUser && (
              <>
                <IonCard className="ion-padding">
                  <IonCardHeader>
                    <IonCardSubtitle>Creating medicine request for:</IonCardSubtitle>
                    <IonCardTitle>{selectedUser.firstName} {selectedUser.lastName}</IonCardTitle>
                    
                  </IonCardHeader>
                  <IonCardContent>
                    <p>You are about to create a new medicine request for the resident based on their recently completed teleconsultation. This medicine request will automatically be marked as 'Accepted', ready for scheduling.</p>
                  </IonCardContent>
                </IonCard>

                <IonCard className="ion-padding">
                  <IonItemDivider className="ion-margin-top">Resident Details</IonItemDivider>
                  <IonItem lines='none'>
                    <IonLabel>Name:</IonLabel>
                    <IonText>{selectedUser.firstName} {selectedUser.lastName}</IonText>
                  </IonItem>
                  <IonItem lines='none'>
                    <IonLabel>Barangay:</IonLabel>
                    <IonText>{selectedUser.barangayName}</IonText>
                  </IonItem>

                  <IonItemDivider className="ion-margin-top">Teleconsultation Details</IonItemDivider>
                  <IonItem lines='none'>
                    <IonLabel>Reason for Request:</IonLabel>
                  </IonItem>
                  <IonItem lines='none'>
                    <IonTextarea
                      fill='outline'
                      value={editableReason}
                      onIonInput={(e) => setEditableReason(e.detail.value!)}
                      rows={4}
                    />
                  </IonItem>

                  {selectedTeleconsultRequest.prescriptionUrl && (
                    <>
                      <IonItemDivider className="ion-margin-top">Prescription</IonItemDivider>
                      <IonItem lines="none">
                        <IonLabel>Prescription attached</IonLabel>
                        <IonButton slot="end" fill="outline" onClick={() => window.open(selectedTeleconsultRequest.prescriptionUrl, '_blank')}>
                          View
                        </IonButton>
                      </IonItem>
                    </>
                  )}

                  <IonItemDivider className="ion-margin-top">Creator Details</IonItemDivider>
                  <IonItem lines='none'>
                    <IonLabel>Created by:</IonLabel>
                    <IonText>{currentUser.displayName || currentUser.email}</IonText>
                  </IonItem>
                  <IonItem lines='none'>
                    <IonLabel>Email:</IonLabel>
                    <IonText>{currentUser.email}</IonText>
                  </IonItem>
                </IonCard>
              </>
            )}
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton
                expand="block"
                shape="round"
                color="success"
                onClick={() => {
                  if (selectedTeleconsultRequest) {
                    handleCreateMedRequestFromTeleconsult(selectedTeleconsultRequest);
                    setShowSummaryModal(false);
                  } else {
                    setToastMessage('No teleconsultation selected.');
                    setShowToast(true);
                  }
                }}
                disabled={isSubmitting || !selectedTeleconsultRequest || !selectedTeleconsultRequest.prescriptionUrl}
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

        <IonAlert
          isOpen={showHelpAlert}
          onDidDismiss={() => setShowHelpAlert(false)}
          header="Page Help"
          message="Type the resident's full name in the searchbar then look for the recently completed teleconsultation requests to add the medicine request."
          buttons={['OK']}
        />

        <IonModal isOpen={showCreateGeneralRequestModal} onDidDismiss={() => setShowCreateGeneralRequestModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Create Medicine Request for {selectedUser?.firstName}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateGeneralRequestModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {medRequestStep === 1 && (
              <IonCard className="ion-padding">
                <IonItem lines='none'>
                  <h2>What are the resident's current symptoms or conditions?</h2>
                </IonItem>
                {Object.keys(medRequestReasons).map((reasonKey) => (
                  <IonItem key={reasonKey}>
                    <IonCheckbox
                      justify="space-between"
                      checked={medRequestReasons[reasonKey as keyof typeof medRequestReasons]}
                      onIonChange={e => {
                        setMedRequestReasons(prev => ({ ...prev, [reasonKey]: e.detail.checked }));
                      }}
                    >
                      {reasonKey}
                    </IonCheckbox>
                  </IonItem>
                ))}
                {medRequestReasons.Others && (
                  <>
                    <IonItem className="ion-margin-top">
                      <IonTextarea
                        fill="outline"
                        value={medRequestOtherReason}
                        onIonInput={e => setMedRequestOtherReason((e.target as HTMLIonTextareaElement).value ?? '')}
                        onIonFocus={() => setIsDebouncing(true)}
                        onIonBlur={() => setTimeout(() => setIsDebouncing(false), 1500)}
                        placeholder="Please specify other reason"
                        rows={3}
                      />
                    </IonItem>
                    <IonItem lines='none'><small>Please provide accurate information.</small></IonItem>
                  </>
                )}
              </IonCard>
            )}

            {medRequestStep === 2 && (
              <IonCard className='ion-padding'>
                <IonItem lines='none'><h2>Upload a prescription (optional)</h2></IonItem>
                <IonItem lines='none'><small>Upload a photo of the prescription if available.</small></IonItem>
                <IonItem>
                  Does the resident have a prescription?
                  <IonCheckbox
                    slot="end"
                    checked={medRequestHasPrescription}
                    onIonChange={e => setMedRequestHasPrescription(e.detail.checked)}
                  />
                </IonItem>
                {medRequestHasPrescription && (
                  <IonCard>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => setMedRequestPrescriptionFile(e.target.files?.[0] || null)}
                      ref={medRequestFileInputRef}
                      style={{ display: 'none' }}
                    />
                    <IonButton className='ion-padding-vertical' expand='block' onClick={() => medRequestFileInputRef.current?.click()}>
                      {medRequestPrescriptionFile ? 'Change Prescription' : 'Upload Prescription'}
                      <IonIcon slot="start" icon={cloudUpload} />
                    </IonButton>
                    {medRequestPrescriptionFile && (
                      <IonItem>
                        Uploaded file: <IonText color={'primary'}>{medRequestPrescriptionFile.name}</IonText>
                      </IonItem>
                    )}
                  </IonCard>
                )}
              </IonCard>
            )}

            {medRequestStep === 3 && (
              <IonCard className="ion-padding">
                <IonItem lines='none'><h2>Review Request Details</h2></IonItem>
                <IonItem>
                  <IonTextarea color={'primary'} fill='outline' value={Object.entries(medRequestReasons).filter(([, v]) => v).map(([k]) => k === 'Others' ? medRequestOtherReason : k).join(', ')} rows={10} readonly></IonTextarea>
                </IonItem>
                <IonItem>
                  <IonLabel>Has Prescription:</IonLabel>
                  <IonText>{medRequestHasPrescription ? 'Yes' : 'No'}</IonText>
                </IonItem>
                {medRequestHasPrescription && medRequestPrescriptionFile && (
                  <IonItem>
                    <IonLabel>Prescription File:</IonLabel>
                    <IonText>{medRequestPrescriptionFile.name}</IonText>
                  </IonItem>
                )}
              </IonCard>
            )}
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonGrid>
                <IonRow>
                  <IonCol size="3">
                    <IonButton
                      expand="block"
                      shape="round"
                      fill="outline"
                      onClick={() => setMedRequestStep(s => s - 1)}
                      disabled={medRequestStep === 1}
                    >
                      <IonIcon slot="start" icon={arrowBack} />
                      Back
                    </IonButton>
                  </IonCol>
                  <IonCol size="9">
                    {medRequestStep < 3 ? (
                      <IonButton
                        expand="block"
                        shape="round"
                        onClick={() => setMedRequestStep(s => s + 1)}
                        disabled={(medRequestStep === 2 && medRequestHasPrescription && !medRequestPrescriptionFile) || (medRequestStep === 1 && !Object.values(medRequestReasons).some(Boolean) || (medRequestReasons.Others && !medRequestOtherReason.trim()))}
                      >
                        Next
                        <IonIcon slot="end" icon={arrowForward} />
                      </IonButton>
                    ) : (
                      <IonButton
                        color={'success'}
                        expand="block"
                        shape="round"
                        onClick={handleGeneralMedRequestSubmit}
                        disabled={isSubmitting || isDebouncing}
                      >
                        Submit Request
                        <IonIcon slot="end" icon={paperPlane} />
                      </IonButton>
                    )}
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonToolbar>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminCreateMedRequest;
