import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonText } from '@ionic/react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { personAdd, medkit, videocam, megaphone, calendar, medical, people, menu } from 'ionicons/icons';

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
          <IonTitle>Dashboard</IonTitle>

        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" className="ion-text-center">
              <h1>Welcome, {currentUser?.displayName}!</h1>
              <p>Access RHU Dashboard features below or with the <IonIcon icon={menu} slot='icon-only'/> button in the top-left corner.</p>
            </IonCol>
          </IonRow>

         

          <IonRow>
            <IonCol size="12">
              <h2>Medicine</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/medicine-inventory">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={medkit} style={{ marginRight: '8px' }} />
                    <IonText>Medicine Inventory</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Manage medicine inventory.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/medicine-requests">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={megaphone} style={{ marginRight: '8px' }} />
                    <IonText>Medicine Requests</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    View medicine requests.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/medicine-inventory">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={medkit} style={{ marginRight: '8px' }} />
                    <IonText>Medicine Transfer</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Transfer medicines.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <h2>Teleconsultation</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" size-md="6">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/teleconsultation-requests">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={calendar} style={{ marginRight: '8px' }} />
                    <IonText>Teleconsultation Requests</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Manage teleconsultation requests.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <h2>Announcements</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" size-md="6">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/rhu-announcements">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={medical} style={{ marginRight: '8px' }} />
                    <IonText>Brgy. Announcements</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Manage barangay announcements.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" size-md="6">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/rhu-announcements">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={medical} style={{ marginRight: '8px' }} />
                    <IonText>RHU Announcements</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Manage RHU announcements.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <h2>Accounts</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" size-md="6">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/bhw-accounts">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={people} style={{ marginRight: '8px' }} />
                    <IonText>BHW Accounts</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Manage BHW accounts.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" size-md="6">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/superadmin/dashboard/rhu-accounts">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={people} style={{ marginRight: '8px' }} />
                    <IonText>RHU Accounts</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Manage RHU accounts.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminDashboard;
