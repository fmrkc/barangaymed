import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PendingVerification: React.FC = () => {
  const { logout } = useAuth();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verification Pending</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonCard style={{ maxWidth: '400px', textAlign: 'center' }}>
            <IonCardHeader>
              <IonCardTitle>Your Account is Under Review</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Thank you for submitting your registration details.</p>
              <p>Your account is currently being reviewed by your barangay admin. You will be notified once the review is complete.</p>
              <p>Please check back later.</p>
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

export default PendingVerification;
