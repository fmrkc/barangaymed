import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton } from '@ionic/react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  // Function to call the Cloud Function

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Rural Health Unit Dashboard</IonTitle>
          
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome, {currentUser?.email}!</h1>
        Click the menu on the top right of the page to access the dashboard features.

        {/* Add your other super admin dashboard content here */}
      
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminDashboard;
