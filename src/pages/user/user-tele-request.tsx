import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonTextarea, IonText, IonLoading, IonToast } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser, verificationStatus, barangayId } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const db = getFirestore();

  const isVerified = verificationStatus === 'verified';

  const handleSubmit = async () => {
    if (!isVerified) {
      setToastMessage('You must be a verified user to submit a teleconsultation request.');
      setShowToast(true);
      return;
    }
    if (!reason.trim()) {
      setToastMessage('Please provide a reason for the teleconsultation request.');
      setShowToast(true);
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'teleconsultationRequests'), {
        userId: currentUser?.uid,
        barangayId: barangayId || '',
        reason: reason.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setToastMessage('Teleconsultation request submitted successfully.');
      setShowToast(true);
      setReason('');
    } catch (error) {
      setToastMessage('Failed to submit request. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Teleconsultation Request</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Request a Teleconsultation</h2>
          <p>Please provide the reason for your teleconsultation request below.</p>
        </IonText>
        <IonItem>
          <IonLabel position="floating">Reason</IonLabel>
          <IonTextarea
            value={reason}
            onIonChange={e => setReason(e.detail.value!)}
            rows={6}
            maxlength={500}
            placeholder="Describe your reason for teleconsultation"
          />
        </IonItem>
        <IonButton expand="block" onClick={handleSubmit} disabled={loading}>
          Submit Request
        </IonButton>
        <IonButton expand="block" fill="clear" onClick={onDidDismiss}>
          Close
        </IonButton>
        <IonLoading isOpen={loading} message={'Submitting request...'} />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastMessage.includes('successfully') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonModal>
  );
};

export default UserTeleRequest;
