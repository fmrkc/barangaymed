import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton } from '@ionic/react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from '../../components/LogoutButton';
import { functions } from '../../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const SuperAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  // Function to call the Cloud Function
  const callStandardizeBarangayIds = async () => {
    try {
      const standardizeAdminBarangayIds = httpsCallable(functions, 'standardizeAdminBarangayIds');
      const result = await standardizeAdminBarangayIds();
      console.log('Standardization result:', result.data);
      alert('Barangay IDs standardization initiated successfully! Check console for details.');
    } catch (error) {
      console.error('Error calling standardizeAdminBarangayIds:', error);
      alert('Failed to standardize Barangay IDs. Check console for errors.');
    }
  };

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

        {/* Add your other super admin dashboard content here */}
        <IonButton onClick={callStandardizeBarangayIds} expand="block" className="ion-margin-top">
            Standardize Admin Barangay IDs
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminDashboard;
