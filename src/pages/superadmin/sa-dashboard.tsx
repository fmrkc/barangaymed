import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, useIonLoading, IonText } from '@ionic/react';
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from '../../components/LogoutButton';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig'; // Assuming firebaseConfig exports 'functions'

const SuperAdmin: React.FC = () => {
  const { currentUser } = useAuth();
  const [present, dismiss] = useIonLoading();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'superadmin' | ''>('');
  const [inviteBarangayId, setInviteBarangayId] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const handleSendInvitation = async () => {
    setInviteError(null);
    setInviteSuccess(null);
    await present('Sending invitation...');

    if (!inviteEmail || !inviteRole) {
      setInviteError('Email and Role are required.');
      dismiss();
      return;
    }

    if (inviteRole === 'admin' && !inviteBarangayId) {
      setInviteError('Barangay ID is required for Admin role.');
      dismiss();
      return;
    }

    try {
      const sendInvitationFunction = httpsCallable(functions, 'sendInvitation');
      const result = await sendInvitationFunction({
        email: inviteEmail,
        role: inviteRole,
        barangayId: inviteRole === 'admin' ? inviteBarangayId : undefined,
      });

      const data = result.data as { success: boolean; message: string };
      if (data.success) {
        setInviteSuccess(data.message);
        setInviteEmail('');
        setInviteRole('');
        setInviteBarangayId('');
      } else {
        setInviteError(data.message);
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setInviteError(error.message || 'Failed to send invitation.');
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

        {/* Invitation Form */}
        <IonCard className="ion-margin-top">
          <IonCardHeader>
            <IonCardTitle>Send New Invitation</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Invitee Email</IonLabel>
              <IonInput
                type="email"
                value={inviteEmail}
                onIonChange={(e) => setInviteEmail(e.detail.value!)}
                placeholder="email@example.com"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Role</IonLabel>
              <IonSelect
                value={inviteRole}
                placeholder="Select Role"
                onIonChange={(e) => setInviteRole(e.detail.value!)}
              >
                <IonSelectOption value="admin">Admin</IonSelectOption>
                <IonSelectOption value="superadmin">Super Admin</IonSelectOption>
              </IonSelect>
            </IonItem>
            {inviteRole === 'admin' && (
              <IonItem>
                <IonLabel position="stacked">Barangay ID (for Admin)</IonLabel>
                <IonInput
                  type="text"
                  value={inviteBarangayId}
                  onIonChange={(e) => setInviteBarangayId(e.detail.value!)}
                  placeholder="e.g., brgy123"
                />
              </IonItem>
            )}

            {inviteError && <IonText color="danger"><p>{inviteError}</p></IonText>}
            {inviteSuccess && <IonText color="success"><p>{inviteSuccess}</p></IonText>}

            <IonButton expand="block" className="ion-margin-top" onClick={handleSendInvitation}>
              Send Invitation
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Add your other super admin dashboard content here */}
      </IonContent>
    </IonPage>
  );
};

export default SuperAdmin;
