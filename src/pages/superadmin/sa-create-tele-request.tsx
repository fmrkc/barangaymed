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
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, QueryDocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { getBarangayNameByCode } from '../../services/addressService';
import { checkmark, help, open, paperPlane, arrowBack, arrowForward, cloudUpload } from 'ionicons/icons';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';

const db = getFirestore();

const SuperAdminCreateTeleRequest: React.FC = () => {
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<{ uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; name: string; birthdate: any; gender: string; }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showHelpAlert, setShowHelpAlert] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // New state for teleconsultation request
  const [showCreateTeleRequestModal, setShowCreateTeleRequestModal] = useState(false);
  const [teleRequestStep, setTeleRequestStep] = useState(1);
  const [teleRequestReasons, setTeleRequestReasons] = useState({
    'Follow-up check-up': false,
    'New health concern': false,
    'Prescription renewal': false,
    'Mental health support': false,
    'General health advice': false,
    'Others': false,
  });
  const [teleRequestOtherReason, setTeleRequestOtherReason] = useState('');
  const [teleRequestUploadedFile, setTeleRequestUploadedFile] = useState<File | null>(null);
  const teleRequestFileInputRef = useRef<HTMLInputElement>(null);

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
      const q = query(collection(db, 'users'), where('role', '==', 'user'));
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

  const handleUserSelect = (user: { uid: string; firstName: string; lastName: string; barangayId: string; barangayName: string; }) => {
    setSelectedUser(user);
    setShowCreateTeleRequestModal(true);
  };

  const handleTeleRequestSubmit = async () => {
    if (!selectedUser || !currentUser) {
      setToastMessage('No user selected.');
      setShowToast(true);
      return;
    }

    const getReasonString = () => {
      const selectedReasons = Object.entries(teleRequestReasons)
        .filter(([, isChecked]) => isChecked)
        .map(([reason]) => reason)
        .filter(reason => reason !== 'Others');
      let finalReason = selectedReasons.join(', ');
      if (teleRequestReasons.Others && teleRequestOtherReason.trim()) {
        if (finalReason) {
          finalReason += `, ${teleRequestOtherReason.trim()}`;
        } else {
          finalReason = teleRequestOtherReason.trim();
        }
      }
      return finalReason;
    };

    const reasonString = getReasonString();
    if (!reasonString) {
      setToastMessage('Please provide a reason for the request.');
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const userService = UserService.getInstance();
      const userData = await userService.getUserData(selectedUser.uid);
      const barangayName = await getBarangayNameByCode(selectedUser.barangayId);

      let uploadedFileData: { url: string; name: string } | undefined;
      if (teleRequestUploadedFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `teleconsultation-files/${selectedUser.uid}/${Date.now()}_${teleRequestUploadedFile.name}`);
        const snapshot = await uploadBytes(storageRef, teleRequestUploadedFile);
        const uploadedFileUrl = await getDownloadURL(snapshot.ref);
        uploadedFileData = { url: uploadedFileUrl, name: teleRequestUploadedFile.name };
      }

      await addDoc(collection(db, 'teleconsultationRequests'), {
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
        status: 'accepted',
        createdAt: serverTimestamp(),
        ...(uploadedFileData && { uploadedFile: uploadedFileData }),
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
            action: 'Accepted teleconsultation request',
            userId: currentUser.uid,
            userEmail: currentUser.email || 'unknown',
            userName: currentUser.displayName || currentUser.email || 'Super Admin',
            timestamp: new Date(),
          }
        ],
      });

      setToastMessage('Teleconsultation request created successfully.');
      setShowToast(true);

      // Reset and close
      setShowCreateTeleRequestModal(false);
      setSelectedUser(null);
      setTeleRequestStep(1);
      setTeleRequestReasons({
        'Follow-up check-up': false,
        'New health concern': false,
        'Prescription renewal': false,
        'Mental health support': false,
        'General health advice': false,
        'Others': false,
      });
      setTeleRequestOtherReason('');
      setTeleRequestUploadedFile(null);

    } catch (error) {
      console.error('Error creating teleconsultation request:', error);
      setToastMessage('Failed to create teleconsultation request. Please try again.');
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
          <IonTitle>Create Teleconsultation Request</IonTitle>
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
                    <strong>Create Teleconsultation Request for a Resident</strong>
                  </IonText>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Search for a resident by their full name to begin creating a teleconsultation request on their behalf.</p>
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
                  Create Request
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

        <IonModal isOpen={showCreateTeleRequestModal} onDidDismiss={() => setShowCreateTeleRequestModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Create Request for {selectedUser?.firstName}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateTeleRequestModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {teleRequestStep === 1 && (
              <IonCard className="ion-padding">
                <IonItem lines='none'>
                  <h2>What are the resident's current symptoms or conditions?</h2>
                </IonItem>
                {Object.keys(teleRequestReasons).map((reasonKey) => (
                  <IonItem key={reasonKey}>
                    <IonCheckbox
                      justify="space-between"
                      checked={teleRequestReasons[reasonKey as keyof typeof teleRequestReasons]}
                      onIonChange={e => {
                        setTeleRequestReasons(prev => ({ ...prev, [reasonKey]: e.detail.checked }));
                      }}
                    >
                      {reasonKey}
                    </IonCheckbox>
                  </IonItem>
                ))}
                {teleRequestReasons.Others && (
                  <>
                    <IonItem className="ion-margin-top">
                      <IonTextarea
                        fill="outline"
                        value={teleRequestOtherReason}
                        onIonInput={e => setTeleRequestOtherReason((e.target as HTMLIonTextareaElement).value ?? '')}
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

            {teleRequestStep === 2 && (
              <IonCard className='ion-padding'>
                <IonItem lines='none'><h2>Upload a file (e.g. Laboratory Results) (Optional)</h2></IonItem>
                <input
                  type="file"
                  onChange={(e) => setTeleRequestUploadedFile(e.target.files?.[0] || null)}
                  ref={teleRequestFileInputRef}
                  style={{ display: 'none' }}
                />
                <IonButton className='ion-padding-vertical' expand='block' onClick={() => teleRequestFileInputRef.current?.click()}>
                  {teleRequestUploadedFile ? 'Change File' : 'Upload File'}
                  <IonIcon slot="start" icon={cloudUpload} />
                </IonButton>
                {teleRequestUploadedFile && (
                  <IonItem>
                    Uploaded file: <IonText color={'primary'}>{teleRequestUploadedFile.name}</IonText>
                  </IonItem>
                )}
              </IonCard>
            )}

            {teleRequestStep === 3 && (
              <IonCard className="ion-padding">
                <IonItem lines='none'><h2>Review Request Details</h2></IonItem>
                <IonItem>
                  <IonTextarea color={'primary'} fill='outline' value={Object.entries(teleRequestReasons).filter(([, v]) => v).map(([k]) => k === 'Others' ? teleRequestOtherReason : k).join(', ')} rows={10} readonly></IonTextarea>
                </IonItem>
                {teleRequestUploadedFile && (
                  <IonItem>
                    <IonLabel>Uploaded File:</IonLabel>
                    <IonText>{teleRequestUploadedFile.name}</IonText>
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
                      onClick={() => setTeleRequestStep(s => s - 1)}
                      disabled={teleRequestStep === 1}
                    >
                      <IonIcon slot="start" icon={arrowBack} />
                      Back
                    </IonButton>
                  </IonCol>
                  <IonCol size="9">
                    {teleRequestStep < 3 ? (
                      <IonButton
                        expand="block"
                        shape="round"
                        onClick={() => setTeleRequestStep(s => s + 1)}
                        disabled={(teleRequestStep === 1 && (!Object.values(teleRequestReasons).some(Boolean) || (teleRequestReasons.Others && !teleRequestOtherReason.trim())))}
                      >
                        Next
                        <IonIcon slot="end" icon={arrowForward} />
                      </IonButton>
                    ) : (
                      <IonButton
                        color={'success'}
                        expand="block"
                        shape="round"
                        onClick={handleTeleRequestSubmit}
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
          message="Search for a resident by their full name to begin creating a teleconsultation request on their behalf."
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminCreateTeleRequest;