import React, { useState, useRef } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonTextarea, IonText, IonLoading, IonToast, IonToggle } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserService } from '../../services/userService';

interface UserMedRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserMedRequest: React.FC<UserMedRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser, userRole, barangayId } = useAuth();
  const [reason, setReason] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const db = getFirestore();
  const storage = getStorage();

  const isUser = userRole === 'user';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPrescriptionFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!isUser) {
      setToastMessage('You must be a registered user to submit a medicine request.');
      setShowToast(true);
      return;
    }
    if (!reason.trim()) {
      setToastMessage('Please provide a reason for the medicine request.');
      setShowToast(true);
      return;
    }
    if (hasPrescription && !prescriptionFile) {
      setToastMessage('Please upload a photo of your prescription.');
      setShowToast(true);
      return;
    }
    if (!barangayId) {
      setToastMessage('Barangay information is missing. Please update your profile.');
      setShowToast(true);
      return;
    }
    setLoading(true);
    try {
      await currentUser?.getIdToken(true);

      const userService = UserService.getInstance();
      const userData = await userService.getUserData(currentUser?.uid!);

      let prescriptionUrl = '';
      if (hasPrescription && prescriptionFile) {
        const storageRef = ref(storage, `prescriptions/${currentUser?.uid}/${Date.now()}_${prescriptionFile.name}`);
        const uploadResult = await uploadBytes(storageRef, prescriptionFile);
        prescriptionUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, 'medicineRequests'), {
        userId: currentUser?.uid,
        barangayId: barangayId,
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
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setToastMessage('Medicine request submitted successfully.');
      setShowToast(true);
      setReason('');
      setHasPrescription(false);
      setPrescriptionFile(null);
      onDidDismiss(); 
    } catch (error) {
      console.error('Error submitting medicine request:', error);
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
          <IonTitle>Medicine Request</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Request Medicine</h2>
          <p>Please provide the reason for your medicine request below.</p>
        </IonText>
        <IonItem>
          <IonLabel position="floating">Reason</IonLabel>
          <IonTextarea
            value={reason}
            onIonChange={e => setReason(e.detail.value!)}
            rows={6}
            maxlength={500}
            placeholder="Describe your reason for the medicine request"
          />
        </IonItem>
        <IonItem>
          <IonLabel>Do you have a prescription?</IonLabel>
          <IonToggle
            checked={hasPrescription}
            onIonChange={e => setHasPrescription(e.detail.checked)}
          />
        </IonItem>
        {hasPrescription && (
          <IonItem>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <IonButton onClick={() => fileInputRef.current?.click()}>
              Upload Prescription
            </IonButton>
            {prescriptionFile && <IonText>{prescriptionFile.name}</IonText>}
          </IonItem>
        )}
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

export default UserMedRequest;