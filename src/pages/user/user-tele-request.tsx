import React, { useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonTextarea, IonText, IonLoading, IonToast, IonButtons, IonCard, IonItemDivider, IonNote, IonCheckbox, IonFooter, IonIcon } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserService } from '../../services/userService';
import { send } from 'ionicons/icons';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser, userRole, verificationStatus, barangayId } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const db = getFirestore();

  const isUser = userRole === 'user';

  const handleSubmit = async () => {
    if (!isUser) {
      setToastMessage('You must be a registered user to submit a teleconsultation request.');
      setShowToast(true);
      return;
    }
    if (!reason.trim()) {
      setToastMessage('Please provide a reason for the teleconsultation request.');
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
      // Refresh the user's ID token to ensure latest claims
      await currentUser?.getIdToken(true);

      // Fetch complete user data
      const userService = UserService.getInstance();
      const userData = await userService.getUserData(currentUser?.uid!);

      await addDoc(collection(db, 'teleconsultationRequests'), {
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
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setToastMessage('Teleconsultation request submitted successfully.');
      setShowToast(true);
      setReason('');
    } catch (error) {
      console.error('Error submitting teleconsultation request:', error);
      setToastMessage('Failed to submit request. Please try again.');
      setShowToast(true);
    } finally { 
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Create a Consultation Request</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
     
        <IonCard className="ion-padding">
          <IonItem lines='none'>
            Consultation Reason:
          </IonItem>
          <IonItem lines='none'>
          <IonTextarea
            fill='outline'
            value={reason}
            onIonChange={e => setReason(e.detail.value!)}
            rows={6}
            maxlength={500}
            placeholder="Describe your reason for scheduling a consultation. Include any symptoms or concerns you have."
          />
        </IonItem>
        <IonItem>
          <small>Please provide accurate information to help us assist you better.</small>
        </IonItem>
        </IonCard>

        <IonCard className='ion-padding'>
          <IonItem>
            Attach Medical Record (Optional)
            <IonCheckbox slot="end" />
          </IonItem>
          <IonItem lines='none'>
            <small>
              This medical record will be sent to the RHU along with your request. Ensure that it does not contain sensitive information you do not wish to share.
            </small>
          </IonItem>
        </IonCard>
        <IonText>
          
         
        </IonText>
       
       
        <IonLoading isOpen={loading} message={'Submitting request...'} />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastMessage.includes('successfully') ? 'success' : 'danger'}
        />
      </IonContent>
      <IonFooter>
        <IonToolbar>
           <IonItem lines='none'>
             <p><small>Note that submission of this form does not guarantee an appointment. You will be contacted once your request is reviewed. After submitting, you can check updates on this request on <IonText color={'primary'}>My Requests</IonText> .</small></p>
          </IonItem>
          <IonButton className='ion-padding-vertical' expand="block" onClick={handleSubmit} disabled={loading}>
            Submit Request
            <IonIcon slot="end" name='send' />
          </IonButton>

        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default UserTeleRequest;
