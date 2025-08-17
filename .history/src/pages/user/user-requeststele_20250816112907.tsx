import React from 'react';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';

const UserRequestTele: React.FC = () => {
  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Teleconsultation Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Teleconsultation Requests</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Your teleconsultation requests will appear here.</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </>
  );
};

export default UserRequestTele;
