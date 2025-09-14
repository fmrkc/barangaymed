import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MedicineRequests: React.FC = () => {
  useAuth();
  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Medicine Requests</IonTitle>

        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        Medicine requests UI goes here...
      </IonContent>
    </IonPage>
  );
};

export default MedicineRequests;
