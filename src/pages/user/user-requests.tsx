import React from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCardSubtitle, IonIcon, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { clipboard, medkit, megaphone } from 'ionicons/icons';

const UserRequests: React.FC = () => {
  const history = useHistory();

  const handleMedicineRequest = () => {
    history.push('/user/dashboard/requests/medicine');
  };

  const handleTeleconsultationRequest = () => {
    history.push('/user/dashboard/requests/teleconsultation');
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader className='ion-text-center'>
            <IonCardSubtitle>Check the status of your barangay requests here.</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <IonCard className='ion-padding-vertical' color={'primary'} button onClick={handleMedicineRequest}>
              <IonCardHeader className='ion-text-center'>
                <IonCardTitle>
                  <IonText>
                    <IonIcon icon={medkit} style={{ marginRight: '8px' }} />
                    Medicine Requests
                  </IonText>
                </IonCardTitle>
              </IonCardHeader>
            </IonCard>  

            <IonCard className='ion-padding-vertical ion-margin-top' color={'primary'} button onClick={handleTeleconsultationRequest}>
              <IonCardHeader className='ion-text-center'>
                <IonCardTitle>
                  <IonText>
                    <IonIcon icon={clipboard} style={{ marginRight: '8px' }} /> 
                    Teleconsultation Requests
                  </IonText>
                </IonCardTitle>
              </IonCardHeader>
            </IonCard>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </>
  );
};

export default UserRequests;
