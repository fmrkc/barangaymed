import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonButtons, IonBackButton, IonModal, IonInput, IonTextarea, IonToast, IonCardSubtitle, IonRefresher, IonText, IonItemDivider, IonFooter, IonCol, IonGrid, IonRow, IonAlert, IonLoading, IonBadge, IonMenuButton } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, collectionGroup, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { call, checkmarkCircleOutline, close, closeCircleOutline, eyeOutline, home, mail, mailOutline, open, person, phonePortrait } from 'ionicons/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { getBarangayNameByCode } from '../../services/addressService';
import { getStorage, ref, deleteObject } from 'firebase/storage';

interface UserForVerification {
  uid: string;
  attemptId: string;
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
  barangayIdUrl?: string;
  barangayCertificateUrl?: string;
  fullRegistrationSubmittedAt?: any;
}

// Converts a timestamp to "X days ago" format
function getTimeAgo(timestamp: any): string {
  let date: Date;
  if (typeof timestamp === 'string') {
    // Try to parse string date
    date = new Date(timestamp);
  } else if (timestamp?.toDate) {
    // Firestore Timestamp object
    date = timestamp.toDate();
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
  const { currentUser, userRole, barangayId: adminBarangayId } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserForVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForVerification | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [barangayName, setBarangayName] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchPendingUsers = async () => {
    if (!adminBarangayId) {
      setLoading(false);
      setToastMessage('Admin barangay ID is not set. Please contact support.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const registrationStatusQuery = query(
        collectionGroup(db, 'full_registration'),
        where('status', '==', 'pending'),
        where('barangayId', '==', adminBarangayId)
      );

      const statusSnapshot = await getDocs(registrationStatusQuery);
      const users: UserForVerification[] = [];

      for (const statusDoc of statusSnapshot.docs) {
        const statusData = statusDoc.data();
        const userDocRef = statusDoc.ref.parent.parent;
        if (userDocRef) {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            users.push({
              uid: userDoc.id,
              attemptId: statusDoc.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              contactNumber: userData.contactNumber,
              lotBlkHouseNo: userData.lotBlkHouseNo,
              streetName: userData.streetName,
              subdivisionVillageZonePurok: userData.subdivisionVillageZonePurok,
              zipCode: userData.zipCode,
              verificationStatus: statusData.status,
              barangayId: statusData.barangayId,
              barangayIdUrl: statusData.barangayIdUrl,
              barangayCertificateUrl: statusData.barangayCertificateUrl,
              fullRegistrationSubmittedAt: statusData.submittedAt,
            });
          }
        }
      }
      setPendingUsers(users);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setToastMessage('Error fetching pending users.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, [adminBarangayId]);

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

  const deleteUserDocuments = async (userId: string) => {
    try {
      const deleteUserDocumentsFn = httpsCallable(functions, 'deleteUserDocuments');
      await deleteUserDocumentsFn({ userId });
      console.log('User documents deleted successfully via cloud function.');
    } catch (error) {
      console.error('Error deleting user documents via cloud function:', error);
      setToastMessage('Could not delete user documents.');
      setToastColor('danger');
      setShowToast(true);
      // Re-throw the error to be caught by the calling function
      throw error;
    }
  };

  const handleApprove = async (user: UserForVerification) => {
    setApproving(true);
    try {
      // Update status in the sub-collection
      const fullRegRef = doc(db, 'users', user.uid, 'full_registration', user.attemptId);
      await updateDoc(fullRegRef, {
        status: 'verified',
        reviewedAt: serverTimestamp(),
      });

      // Also update the main user doc for compatibility with other parts of the app for now
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'verified',
      });

      // Add a notification for the user
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      await addDoc(notificationsRef, {
        message: 'Congratulations! Your registration has been verified. You can now access all features.',
        timestamp: serverTimestamp(),
        read: false,
        type: 'registration_verified'
      });

      // Call Cloud Function to send approval email
      const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
      await sendVerificationEmail({ email: user.email, status: 'verified' });

      // Delete documents
      await deleteUserDocuments(user.uid);

      setToastMessage('User approved and notification sent.');
      setToastColor('success');
      setShowToast(true);
      fetchPendingUsers(); // Refresh list
      setShowModal(false);
    } catch (error) {
      console.error('Error approving user:', error);
      setToastMessage('Error approving user.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (user: UserForVerification, reason: string) => {
    if (!reason.trim()) {
      setToastMessage('Rejection reason cannot be empty.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    setRejecting(true);
    try {
      // Update status in the sub-collection
      const fullRegRef = doc(db, 'users', user.uid, 'full_registration', user.attemptId);
      await updateDoc(fullRegRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        rejectionReason: reason,
      });

      // Also update the main user doc for compatibility
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'rejected',
        rejectionReason: reason,
      });

      // Add a notification for the user
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      await addDoc(notificationsRef, {
        message: `Your registration has been rejected. Reason: ${reason}`,
        timestamp: serverTimestamp(),
        read: false,
        type: 'registration_rejected'
      });

      // Call Cloud Function to send rejection email
      const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
      await sendVerificationEmail({ email: user.email, status: 'rejected', reason: reason });

      // Delete documents
      await deleteUserDocuments(user.uid);

      setToastMessage('User rejected and notification sent.');
      setToastColor('success');
      setShowToast(true);
      setShowModal(false); // Close modal
      setShowAlert(false); // Close alert
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error('Error rejecting user:', error);
      setToastMessage('Error rejecting user.');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setRejecting(false);
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
                
                {selectedUser.barangayIdUrl && (
                  <IonItem button onClick={() => window.open(selectedUser.barangayIdUrl, '_blank')}>
                    <IonIcon slot="start" icon={eyeOutline} />
                    <IonLabel>View Barangay ID</IonLabel>
                  </IonItem>
                )}
                {selectedUser.barangayCertificateUrl && (
                  <IonItem button onClick={() => window.open(selectedUser.barangayCertificateUrl, '_blank')}>
                    <IonIcon slot="start" icon={eyeOutline} />
                    <IonLabel>View Barangay Certificate</IonLabel>
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
                    <IonButton expand='block' color="success" shape='round' onClick={() => selectedUser && handleApprove(selectedUser)}>
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
                  handleReject(selectedUser, reason);
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
        <IonLoading isOpen={approving} message="Approving user..." />
        <IonLoading isOpen={rejecting} message="Rejecting user..." />
      </IonContent>
    </IonPage>
  );
};

export default AdminUserVerification;