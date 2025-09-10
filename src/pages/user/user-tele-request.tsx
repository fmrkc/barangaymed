import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText } from '@ionic/react';

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
          <h2>Teleconsultation Request Form</h2>
          <p>This is a placeholder for the teleconsultation request modal component.</p>
          <p>Please implement the actual teleconsultation booking functionality here.</p>
        </IonText>
        <IonButton expand="full" onClick={onDidDismiss}>
          Close
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default UserTeleRequest;
