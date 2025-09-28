import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon
} from '@ionic/react';
import { logOutOutline, documentTextOutline } from 'ionicons/icons';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRegistrationModal } from '../../contexts/RegistrationModalContext';

const StartRegistration: React.FC = () => {
  const { logout } = useAuth();
  const { openModal } = useRegistrationModal();

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Welcome to BarangayMed+</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonCard style={{ maxWidth: '450px', textAlign: 'center' }}>
            <IonCardHeader>
              <IonCardTitle>Complete Your Registration</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>To access all features of the BarangayMed+ system, you must complete a one-time registration.</p>
              <p>This process involves providing your address details and uploading documents for verification by your barangay admin.</p>
              
              <IonButton expand="block" onClick={openModal} className="ion-margin-top">
                <IonIcon slot="start" icon={documentTextOutline} />
                Start Full Registration
              </IonButton>

              <IonButton expand="block" fill="clear" onClick={logout} className="ion-margin-top">
                <IonIcon slot="start" icon={logOutOutline} />
                Logout
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default StartRegistration;
