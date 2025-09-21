import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonInput,
  IonToast
} from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationService } from '../../services/teleconsultationService';
import { TeleconsultationRequestFormData } from '../../types/teleconsultationRequests';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser || !reason.trim()) {
      setShowErrorToast(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const teleconsultationService = TeleconsultationService.getInstance();
      const formData: TeleconsultationRequestFormData = {
        reason: reason.trim()
      };

      await teleconsultationService.createRequest(currentUser.uid, formData);

      setShowSuccessToast(true);
      setReason('');
      onDidDismiss();
    } catch (error) {
      console.error('Error submitting teleconsultation request:', error);
      setShowErrorToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onDidDismiss();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Teleconsultation Request</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText>
            <h2>Request Teleconsultation</h2>
            <p>Please provide the reason for your teleconsultation request below.</p>
          </IonText>

          <IonCard>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Reason for Request *</IonLabel>
                <IonTextarea
                  value={reason}
                  onIonChange={(e) => setReason(e.detail.value!)}
                  placeholder="Please describe your health concern or reason for needing a teleconsultation..."
                  rows={4}
                  maxlength={500}
                  required
                />
              </IonItem>

              <div className="ion-text-center ion-margin-top">
                <IonText color="medium">
                  <small>{reason.length}/500 characters</small>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>

          <div className="ion-margin-top">
            <IonButton
              expand="full"
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="ion-margin-bottom"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </IonButton>

            <IonButton
              expand="full"
              fill="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showSuccessToast}
        onDidDismiss={() => setShowSuccessToast(false)}
        message="Your teleconsultation request has been submitted successfully!"
        duration={3000}
        color="success"
      />

      <IonToast
        isOpen={showErrorToast}
        onDidDismiss={() => setShowErrorToast(false)}
        message="Failed to submit request. Please try again."
        duration={3000}
        color="danger"
      />
    </>
  );
};

export default UserTeleRequest;
