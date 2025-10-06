import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ADashboard: React.FC = () => {
  const { currentUser } = useAuth();
  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Barangay Health Worker Dashboard</IonTitle>
          
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome, {currentUser?.email}!</h1>
        Click the menu on the top right of the page to access the dashboard features.
      </IonContent>
    </IonPage>
  );
};

export default ADashboard;