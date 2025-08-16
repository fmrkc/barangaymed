import React from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const UserRequests: React.FC = () => {
  const history = useHistory();

  const handleMedicineRequest = () => {
    history.push('/user/requests/meds_request');
  };

  const handleTeleconsultationRequest = () => {
    history.push('/user/requests/tele_request');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Request Services</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <IonButton 
                expand="block" 
                color="primary"
                onClick={handleMedicineRequest}
                style={{ marginBottom: '8px' }}
              >
                Medicine Request
              </IonButton>
              
              <IonButton 
                expand="block" 
                color="secondary"
                onClick={handleTeleconsultationRequest}
              >
                Teleconsultation Request
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default UserRequests;
