import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Med_Inventory: React.FC = () => {
  useAuth();
  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Super Admin - Medicine Inventory</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        Super Admin medicine inventory UI goes here...
      </IonContent>
    </IonPage>
  );
};

export default Med_Inventory;
