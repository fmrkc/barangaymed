import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonButtons, IonBackButton, IonModal, IonInput, IonTextarea, IonToast } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { checkmarkCircleOutline, closeCircleOutline, eyeOutline, mailOutline } from 'ionicons/icons';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';

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
  const [rejectionReason, setRejectionReason] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');

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

  const handleApprove = async (user: UserForVerification) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'verified',
      });
      // Call Cloud Function to send approval email
      const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
      await sendVerificationEmail({ email: user.email, status: 'approved' });

      setToastMessage('User approved and email sent.');
      setToastColor('success');
      setShowToast(true);
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error('Error approving user:', error);
      setToastMessage('Error approving user.');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleReject = async (user: UserForVerification) => {
    if (!rejectionReason.trim()) {
      setToastMessage('Rejection reason cannot be empty.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'rejected',
        rejectionReason: rejectionReason,
      });
      // Call Cloud Function to send rejection email
      const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
      await sendVerificationEmail({ email: user.email, status: 'rejected', reason: rejectionReason });

      setToastMessage('User rejected and email sent.');
      setToastColor('success');
      setShowToast(true);
      setShowModal(false); // Close modal
      setRejectionReason(''); // Clear reason
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error('Error rejecting user:', error);
      setToastMessage('Error rejecting user.');
      setToastColor('danger');
      setShowToast(true);
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
          <IonTitle>User Verification</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
                  <IonCardContent>
                    <p>Email: {user.email}</p>
                    <p>Barangay: {user.barangayId}</p>
                    <IonButton expand="block" fill="outline" onClick={() => openModal(user)}>
                      <IonIcon slot="start" icon={eyeOutline} />
                      View Details
                    </IonButton>
                  </IonCardContent>
                </IonCardHeader>
              </IonCard>
            ))}
          </IonList>
        )}

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>User Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={closeCircleOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedUser && (
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Name</IonLabel>
                  <p>{selectedUser.firstName} {selectedUser.lastName}</p>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Email</IonLabel>
                  <p>{selectedUser.email}</p>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Barangay</IonLabel>
                  <p>{selectedUser.barangayId}</p>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Address</IonLabel>
                  <p>{selectedUser.lotBlkHouseNo}, {selectedUser.streetName}, {selectedUser.subdivisionVillageZonePurok}, {selectedUser.zipCode}</p>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Contact Number</IonLabel>
                  <p>{selectedUser.contactNumber}</p>
                </IonItem>
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

                <IonInput
                  label="Rejection Reason (if rejecting)"
                  labelPlacement="stacked"
                  value={rejectionReason}
                  onIonChange={(e) => setRejectionReason(e.detail.value!)}
                  placeholder="Enter reason for rejection"
                  className="ion-margin-top"
                ></IonInput>

                <IonButton expand="block" color="success" className="ion-margin-top" onClick={() => handleApprove(selectedUser)}>
                  <IonIcon slot="start" icon={checkmarkCircleOutline} />
                  Approve User
                </IonButton>
                <IonButton expand="block" color="danger" className="ion-margin-top" onClick={() => handleReject(selectedUser)}>
                  <IonIcon slot="start" icon={closeCircleOutline} />
                  Reject User
                </IonButton>
              </IonList>
            )}
          </IonContent>
        </IonModal>
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminUserVerification;