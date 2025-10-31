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
  IonAlert,
  IonPage,
  IonMenuButton,
  IonIcon,
  IonFooter,
  IonSearchbar,
  IonSkeletonText,
  IonItemDivider,
} from '@ionic/react';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, QueryDocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { getBarangayNameByCode } from '../../services/addressService';
import { checkmark, help, open } from 'ionicons/icons';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';

const db = getFirestore();

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
  const [searchedUsers, setSearchedUsers] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; name: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUserRequests, setSelectedUserRequests] = useState<TeleconsultationRequest[]>([]);
  const [showUserRequests, setShowUserRequests] = useState(false);
  const [selectedTeleconsultRequest, setSelectedTeleconsultRequest] = useState<TeleconsultationRequest | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showHelpAlert, setShowHelpAlert] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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
      const q = query(collection(db, 'users'), where('role', '==', 'user'));
      const querySnapshot = await getDocs(q);
      const users: { uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; name: string }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as { firstName: string, lastName: string, barangayId: string, barangayName: string };
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase().trim();
        if (fullName.includes(queryStr)) {
          users.push({
            uid: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            barangayId: data.barangayId || '',
            barangayName: data.barangayName || '',
            name: fullName,
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
                  View Recent Requests
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
              </IonCard>
            )}
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

        {/* Summary Modal */}
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
                      value={selectedTeleconsultRequest.reason}
                      readonly
                      rows={4}
                    />
                  </IonItem>

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
                disabled={isSubmitting || !selectedTeleconsultRequest}
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
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminCreateMedRequest;
