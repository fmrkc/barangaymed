import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton } from '@ionic/react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from '../../components/LogoutButton';

const SuperAdmin: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Super Admin Dashboard</IonTitle>
          
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome, {currentUser?.email}!</h1>
        <p>You are logged in as a super admin.</p>
        {/* Add your super admin dashboard content here */}
      </IonContent>
    </IonPage>
  );
};

export default SuperAdmin;
