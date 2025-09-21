import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonCard, IonCardContent } from '@ionic/react';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Teleconsultation Request</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Teleconsultation Service</h2>
          <p>This feature is currently unavailable.</p>
          <p>Please contact your barangay administrator for assistance with teleconsultation services.</p>
        </IonText>

        <IonCard color="warning">
          <IonCardContent>
            <IonText>
              <h3>Service Temporarily Disabled</h3>
              <p>The teleconsultation request feature has been temporarily disabled.</p>
              <p>We apologize for any inconvenience this may cause.</p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonButton expand="full" fill="outline" onClick={onDidDismiss} className="ion-margin-top">
          Close
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default UserTeleRequest;
