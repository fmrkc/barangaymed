import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonRefresher, IonRefresherContent, useIonRouter } from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PendingVerification: React.FC = () => {
  const { logout, refreshUserClaims, verificationStatus } = useAuth();
  const history = useIonRouter();

  useEffect(() => {
    if (verificationStatus === 'verified') {
      history.push('/user/dashboard/home', 'back');
    } else if (verificationStatus === 'rejected') {
      history.push('/user/rejected-verification', 'back');
    }
  }, [verificationStatus, history]);

  const handleRefresh = async (event: CustomEvent) => {
    await refreshUserClaims();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verification Pending</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
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
