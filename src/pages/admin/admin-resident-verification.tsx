import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonButtons, IonBackButton, IonModal, IonInput, IonTextarea, IonToast, IonCardSubtitle, IonRefresher, IonText, IonItemDivider, IonFooter, IonCol, IonGrid, IonRow, IonAlert, IonLoading } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { call, checkmarkCircleOutline, close, closeCircleOutline, eyeOutline, home, mail, mailOutline, open, person, phonePortrait } from 'ionicons/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { getBarangayNameByCode } from '../../services/addressService';
import { getStorage, ref, deleteObject } from 'firebase/storage';

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
  barangayIdUrl?: string;
  barangayCertificateUrl?: string;
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
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('barangayId', '==', adminBarangayId), where('verificationStatus', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const users: UserForVerification[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as UserForVerification);
      });
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

  const deleteUserDocuments = async (user: UserForVerification) => {
    const storage = getStorage();
    const deletePromises = [];

    if (user.barangayIdUrl) {
      try {
        const fileRef = ref(storage, user.barangayIdUrl);
        deletePromises.push(deleteObject(fileRef));
      } catch (error) {
        console.error('Error creating reference for barangayIdUrl:', error);
      }
    }

    if (user.barangayCertificateUrl) {
      try {
        const fileRef = ref(storage, user.barangayCertificateUrl);
        deletePromises.push(deleteObject(fileRef));
      } catch (error) {
        console.error('Error creating reference for barangayCertificateUrl:', error);
      }
    }

    if (deletePromises.length > 0) {
      try {
        await Promise.all(deletePromises);
        console.log('User documents deleted successfully.');
      } catch (error) {
        console.error('Error deleting user documents:', error);
        // Optionally, show a toast message to the admin
        setToastMessage('Could not delete user documents.');
        setToastColor('danger');
        setShowToast(true);
      }
    }
  };

  const handleApprove = async (user: UserForVerification) => {
    setApproving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'verified',
      });
      // Call Cloud Function to send approval email
      const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
      await sendVerificationEmail({ email: user.email, status: 'approved' });

      // Delete documents
      await deleteUserDocuments(user);

      setToastMessage('User approved and email sent.');
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
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'rejected',
        rejectionReason: reason,
      });
      // Call Cloud Function to send rejection email
      const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
      await sendVerificationEmail({ email: user.email, status: 'rejected', reason: reason });

      // Delete documents
      await deleteUserDocuments(user);

      setToastMessage('User rejected and email sent.');
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
            <IonBackButton defaultHref="/admin/dashboard" />
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
                  <IonCardTitle>{user.firstName} {user.lastName}</IonCardTitle>
                  <IonCardSubtitle>{user.email}</IonCardSubtitle>
                </IonCardHeader>
                <IonButton expand="block" fill="outline" onClick={() => openModal(user)}>
                      <IonIcon slot="end" icon={open} />
                      Process Request
                    </IonButton>
              </IonCard>
            ))}
          </IonList>
        )}

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>User Details</IonTitle>
              <IonButtons slot="end">
                <IonButton shape='round' onClick={() => setShowModal(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedUser && (
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
            )}
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