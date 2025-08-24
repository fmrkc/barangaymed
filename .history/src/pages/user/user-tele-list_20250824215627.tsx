import React, { useEffect, useState } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonButtons, 
  IonButton,
  IonModal,
  IonList,
  IonItem
} from '@ionic/react';
import { person, home, notifications, albums, chevronBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationService } from '../../services/teleconsultationService';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';

const UserRequestTele: React.FC = () => {
  const history = useHistory();

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {/* Back Button (similar to UserRequests.tsx) */}
            <IonButton onClick={() => history.push('/user/dashboard/requests')}>
              <IonIcon icon={chevronBack} />
            </IonButton>
          </IonButtons>
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
        <IonTabButton tab="home" onClick={() => history.push('/user/dashboard/home')}>
          <IonIcon icon={home} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="user_requests" onClick={() => history.push('/user/dashboard/requests')}>
          <IonIcon icon={albums} />
          <IonLabel>Requests</IonLabel>
        </IonTabButton>  
        <IonTabButton tab="notifications" onClick={() => history.push('/user/dashboard/notifications')}>
          <IonIcon icon={notifications} />
          <IonLabel>Notifications</IonLabel>
        </IonTabButton>
        <IonTabButton tab="account" onClick={() => history.push('/user/dashboard/account')}>
          <IonIcon icon={person} />
          <IonLabel>Account</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </>
  );
};

export default UserRequestTele;