import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonButton, IonIcon, IonButtons, IonModal, IonToast, IonCardSubtitle, IonRefresher, IonText, IonItemDivider, IonFooter, IonCol, IonGrid, IonRow, IonAlert, IonLoading, IonMenuButton } from '@ionic/react';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebaseConfig';
import { query, where, getDocs, collection, doc, updateDoc, deleteField } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { call, checkmarkCircleOutline, close, closeCircleOutline, eyeOutline, home, mail, mailOutline, open, person, phonePortrait } from 'ionicons/icons';
import { getBarangayNameByCode } from '../../services/addressService';

interface UserForVerification {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  barangayId: string;
  verificationStatus: string;
  lotBlkHouseNo?: string;
  streetName?: string;
  subdivisionVillageZonePurok?: string;
  zipCode?: string;
  contactNumber?: string;
  idVerificationUrl?: string;
  idVerificationType?: string;
  fullRegistrationSubmittedAt?: string | { toDate: () => Date; } | Date | null | undefined;
}

// Converts a timestamp to "X days ago" format
function getTimeAgo(timestamp: string | { toDate: () => Date; } | Date | null | undefined): string {
  let date: Date;
  if (typeof timestamp === 'string') {
    // Try to parse string date
    date = new Date(timestamp);
  } else if (timestamp && typeof (timestamp as any).toDate === 'function') {
    // Firestore Timestamp object
    date = (timestamp as any).toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '';
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays > 1) {
    return `${diffDays} days ago`;
  } else {
    return '';
  }
}

const AdminUserVerification: React.FC = () => {
  const { barangayId: adminBarangayId } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserForVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForVerification | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [barangayName, setBarangayName] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    if (!adminBarangayId) {
      setLoading(false);
      setToastMessage('Admin barangay ID is not set. Please contact support.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('verificationStatus', '==', 'pending_approval'),
        where('barangayId', '==', adminBarangayId)
      );

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          barangayId: data.barangayId,
          verificationStatus: data.verificationStatus,
          lotBlkHouseNo: data.lotBlkHouseNo || '',
          streetName: data.streetName || '',
          subdivisionVillageZonePurok: data.subdivisionVillageZonePurok || '',
          zipCode: data.zipCode || '',
          contactNumber: data.contactNumber || '',
          idVerificationUrl: data.idVerificationUrl || '',
          idVerificationType: data.idVerificationType || '',
          fullRegistrationSubmittedAt: data.createdAt, // Assuming createdAt is the timestamp
        };
      });
      
      setPendingUsers(users.filter((user: UserForVerification) => user.uid));

    } catch (error) {
      console.error('Error fetching pending users:', error);
      setToastMessage('Error fetching pending users.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [adminBarangayId]);

  useEffect(() => {
    fetchPendingUsers();
  }, [adminBarangayId, fetchPendingUsers]);

  useEffect(() => {
    if (selectedUser?.barangayId) {
      setBarangayName('Loading...');
      getBarangayNameByCode(selectedUser.barangayId).then(name => {
        if (name) {
          setBarangayName(name);
        } else {
          setBarangayName('Not found');
        }
      });
    }
  }, [selectedUser]);

  import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const setCustomClaimsOnVerification = httpsCallable(functions, 'setCustomClaimsOnVerification');

const handleReview = async (user: UserForVerification, action: 'verified' | 'rejected', reason?: string) => {
  setIsReviewing(true);
  try {
    await setCustomClaimsOnVerification({ 
      userId: user.uid, 
      action, 
      barangayId: user.barangayId 
    });

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      verificationStatus: action,
      rejectionReason: action === 'rejected' ? reason : deleteField(),
      verifiedAt: action === 'verified' ? new Date() : deleteField(),
      verifiedBy: action === 'verified' ? auth.currentUser?.uid : deleteField(),
    });

    setToastMessage(`User has been ${action}.`);
    setToastColor('success');
    setShowToast(true);
    fetchPendingUsers(); // Refresh list
    setShowModal(false); // Close modal
    setShowAlert(false); // Close alert

  } catch (error: unknown) {
    console.error(`Error ${action} user:`, error);
    setToastMessage((error as any).message || `Error ${action} user.`);
    setToastColor('danger');
    setShowToast(true);
  } finally {
    setIsReviewing(false);
  }
};

  const openModal = (user: UserForVerification) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Resident Verification</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { await fetchPendingUsers(); e.detail.complete(); }} />

        <p>Showing all residents awaiting verification in your barangay.</p>
        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
            <p>Loading pending users...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="ion-text-center ion-padding">
            <p>No pending users for verification in your barangay.</p>
          </div>
        ) : (
          <IonList>
            {pendingUsers.map((user) => (
              <IonCard key={user.uid}>
                <IonCardHeader>
                  <IonCardTitle>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {user.firstName} {user.lastName}
                      {user.fullRegistrationSubmittedAt && (
                        <IonText color="medium" style={{ fontSize: '0.7em' }}>
                          Submitted {getTimeAgo(user.fullRegistrationSubmittedAt)}
                        </IonText>
                      )}
                    </div>
                  </IonCardTitle>
                  <IonCardSubtitle>
                    <IonText>
                      <IonIcon icon={mailOutline} />  {user.email}
                    </IonText>
                    &nbsp; | &nbsp;
                    <IonText>
                      <IonIcon icon={phonePortrait} />  {user.contactNumber || 'N/A'}
                    </IonText>
                  </IonCardSubtitle>
                    
                </IonCardHeader>
                <IonButton expand="block" fill="outline" onClick={() => openModal(user)}>
                      <IonIcon slot="end" icon={open} />
                      Process Request
                    </IonButton>
              </IonCard>
            ))}
          </IonList>
        )}
        {selectedUser && (
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedUser.firstName} {selectedUser.lastName}</IonTitle>
              <IonButtons slot="end">
                <IonButton shape='round' onClick={() => setShowModal(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
           <IonText>
              <p className="ion-padding-horizontal">Review the details and documents submitted by the resident. You can approve or reject their verification request.</p>
           </IonText>
              <IonList>
                <IonItemDivider className="ion-margin-top">Personal Details</IonItemDivider>
                <IonItem>
                  <IonIcon slot="start" icon={person} />
                  {selectedUser.firstName} {selectedUser.lastName}
                </IonItem>
                <IonItem>
                  <IonIcon slot="start" icon={call} />
                  <IonText>{selectedUser.contactNumber || 'N/A'}</IonText>
                </IonItem>
                <IonItem>
                  <IonIcon slot="start" icon={mail} />
                  {selectedUser.email}
                </IonItem>
                <IonItem>
                  <IonIcon slot="start" icon={home} />
                  {barangayName}
                </IonItem>
                <IonItemDivider className="ion-margin-top">Address Details</IonItemDivider>
                <IonItem>
                  <IonIcon slot='start' icon={home} />
                  <IonLabel slot='start'>Lot/Blk/House No.:</IonLabel>
                  <IonLabel slot='end'>{selectedUser.lotBlkHouseNo || 'N/A'}</IonLabel>
                  </IonItem>
                <IonItem>
                  <IonIcon slot='start' icon={home} />
                  <IonLabel slot='start'>Street Name:</IonLabel>
                  <IonLabel slot='end'>{selectedUser.streetName || 'N/A'}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon slot='start' icon={home} />
                  <IonLabel slot='start'>Subdivision/Village/Zone/Purok:</IonLabel>
                  <IonLabel slot='end'>{selectedUser.subdivisionVillageZonePurok || 'N/A'}</IonLabel>
                </IonItem>
               
                <IonItemDivider className="ion-margin-top">Uploaded Documents</IonItemDivider> 
                
                {selectedUser.idVerificationUrl && (
                  <IonItem button onClick={() => window.open(selectedUser.idVerificationUrl, '_blank')}>
                    <IonIcon slot="start" icon={eyeOutline} />
                    <IonLabel>View {selectedUser.idVerificationType}</IonLabel>
                  </IonItem>
                )}

              </IonList>
          </IonContent>
          <IonFooter>

            <IonToolbar>
              <IonGrid>
              <IonRow>
                <IonCol size="6">
                   <IonButton expand='block' color="danger" fill="outline" shape='round' onClick={() => setShowAlert(true)}>
                <IonIcon slot="start" icon={closeCircleOutline} />
                <IonText className='ion-padding-vertical'>Reject User</IonText>
              </IonButton>
                </IonCol>

                <IonCol size="6">
                    <IonButton expand='block' color="success" shape='round' onClick={() => selectedUser && handleReview(selectedUser, 'verified')}>
                <IonText className='ion-padding-vertical'>Approve User</IonText>
                <IonIcon slot="end" icon={checkmarkCircleOutline} />
              </IonButton>
                </IonCol>
              </IonRow>
              </IonGrid>
            </IonToolbar>
          </IonFooter>
        </IonModal>
        )}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Reject User"
          message="Please provide a reason for rejection."
          inputs={[
            {
              name: 'reason',
              type: 'textarea',
              placeholder: 'Enter reason for rejection'
            }
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setShowAlert(false)
            },
            {
              text: 'Reject',
              handler: (data) => {
                const reason = data.reason;
                if (selectedUser) {
                  handleReview(selectedUser, 'rejected', reason);
                }
              }
            }
          ]}
        />
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          onDidDismiss={() => setShowToast(false)}
        />
        <IonLoading isOpen={isReviewing} message="Please wait..." />
      </IonContent>
    </IonPage>
  );
};

export default AdminUserVerification;