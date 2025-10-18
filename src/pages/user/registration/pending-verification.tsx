import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonRefresher, IonRefresherContent, useIonRouter, IonAlert, IonLoading, IonButtons, IonText } from '@ionic/react';
import { checkmarkCircle, documentAttach, logOut, logOutOutline } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const PendingVerification: React.FC = () => {
  const { logout, refreshUserClaims, verificationStatus, loading } = useAuth();
  const history = useIonRouter();
  const [showAlert, setShowAlert] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (verificationStatus === 'verified') {
      history.push('/user/dashboard/home', 'back');
    } else if (verificationStatus === 'rejected') {
      history.push('/user/rejected-verification', 'back');
    }
  }, [verificationStatus, history]);

  const handleRefresh = async (event: CustomEvent) => {
    setIsRefreshing(true);
    try {
      await refreshUserClaims();
    } finally {
      setIsRefreshing(false);
      event.detail.complete();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Verification Pending</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowAlert(true)}>
              <IonIcon slot="icon-only" icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        <IonLoading 
          isOpen={loading || isRefreshing}
          message={'Checking status...'}
        />
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent refreshingSpinner="bubbles"></IonRefresherContent>
        </IonRefresher>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonCard style={{ maxWidth: '400px', textAlign: 'center' }}>
            <IonCardHeader>
              <IonText class='ion-text-center'>
                <IonIcon icon={checkmarkCircle} style={{ fontSize: '48px', color: 'var(--ion-color-success)' }} />
              </IonText>
              <IonCardTitle>Your Account is Under Review</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Your verification form has been sent successfully!</p>
              <p>Your form will soon be reviewed by your barangay. You will be notified once the review is complete.</p>
              <p>Please check back later.</p>
            </IonCardContent>
          </IonCard>
        </div>
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Confirm Logout'}
          message={'Are you sure you want to log out?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
            },
            {
              text: 'Logout',
              handler: handleLogout,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default PendingVerification;