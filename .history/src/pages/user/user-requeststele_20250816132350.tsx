import React from 'react';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { person, home, notifications, albums } from 'ionicons/icons';

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

      {/* Navigation Menu Bar */}
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" onClick={() => window.location.href = '/user/dashboard/home'}>
          <IonIcon icon={home} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="user_requests" onClick={() => window.location.href = '/user/dashboard/user_requests'}>
          <IonIcon icon={albums} />
          <IonLabel>Requests</IonLabel>
        </IonTabButton>  
        <IonTabButton tab="notifications" onClick={() => window.location.href = '/user/dashboard/notifications'}>
          <IonIcon icon={notifications} />
          <IonLabel>Notifications</IonLabel>
        </IonTabButton>
        <IonTabButton tab="account" onClick={() => window.location.href = '/user/dashboard/account'}>
          <IonIcon icon={person} />
          <IonLabel>Account</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </>
  );
};

export default UserRequestTele;
