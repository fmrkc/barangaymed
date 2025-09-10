import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText } from '@ionic/react';

interface UserMedRequestModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserMedRequestModal: React.FC<UserMedRequestModalProps> = ({ isOpen, onDidDismiss }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Medicine Request</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Medicine Request Form</h2>
          <p>This is a placeholder for the medicine request modal component.</p>
          <p>Please implement the actual medicine request functionality here.</p>
        </IonText>
        <IonButton expand="full" onClick={onDidDismiss}>
          Close
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default UserMedRequestModal;
