import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, useIonLoading, IonText } from '@ionic/react';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from '../../components/LogoutButton';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';

const SuperAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [present, dismiss] = useIonLoading();

  // State for the new super admin provisioning form
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleProvisionSuperAdmin = async () => {
    setError(null);
    setSuccess(null);

    if (!fullName || !contactEmail) {
      setError('Full Name and Contact Email are required.');
      return;
    }

    await present('Creating Super Admin...');

    try {
      const provisionUserFunction = httpsCallable(functions, 'provisionUser');
      const result = await provisionUserFunction({
        fullName,
        contactEmail,
        role: 'superadmin', // Hardcode role to superadmin
      });

      const data = result.data as { success: boolean; message: string };
      if (data.success) {
        setSuccess(data.message);
        // Clear form
        setFullName('');
        setContactEmail('');
      } else {
        setError(data.message);
      }
    } catch (error: any) {
      console.error('Error provisioning user:', error);
      setError(error.message || 'Failed to create user.');
    } finally {
      dismiss();
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
          <IonButtons slot="end">
            <LogoutButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome, {currentUser?.email}!</h1>
        <p>You are logged in as a super admin.</p>

        {/* Super Admin Provisioning Form */}
        {currentUser?.email === 'barangaymed@gmail.com' && (
          <IonCard className="ion-margin-top">
            <IonCardHeader>
              <IonCardTitle>Create New Super Admin Account</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Full Name</IonLabel>
                <IonInput
                  type="text"
                  value={fullName}
                  onIonChange={(e) => setFullName(e.detail.value!)}
                  placeholder="Juan Dela Cruz"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Contact Email</IonLabel>
                <IonInput
                  type="email"
                  value={contactEmail}
                  onIonChange={(e) => setContactEmail(e.detail.value!)}
                  placeholder="(Credentials will be sent here)"
                />
              </IonItem>

              {error && <IonText color="danger"><p>{error}</p></IonText>}
              {success && <IonText color="success"><p>{success}</p></IonText>}

              <IonButton expand="block" className="ion-margin-top" onClick={handleProvisionSuperAdmin}>
                Create and Send Credentials
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Add your other super admin dashboard content here */}
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminDashboard;
