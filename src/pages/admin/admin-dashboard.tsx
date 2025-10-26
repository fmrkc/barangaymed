import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonText, IonButton } from '@ionic/react';
import React, { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { people, personAdd, checkbox, medkit, reader, megaphone, medical, menu } from 'ionicons/icons';

const ADashboard: React.FC = () => {
  const { currentUser } = useAuth();
  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
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
              <p>Access BHW Dashboard features below or with the <IonIcon icon={menu} slot='icon-only'/> button in the top-left corner.</p>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <h2>Residents</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard/residents">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={people} style={{ marginRight: '8px' }} />
                    <IonText>Verified Residents</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    View and manage verified residents.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={personAdd} style={{ marginRight: '8px' }} />
                    <IonText>Register New Resident</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Register a new resident in the system.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard/residents/verification">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={checkbox} style={{ marginRight: '8px' }} />
                    <IonText>Resident Verification</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Verify resident applications.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <h2>Medicine</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard/inventory">
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
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={personAdd} style={{ marginRight: '8px' }} />
                    <IonText>Create Medicine Request</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    Create a new medicine request.
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" size-md="4">
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard/medicine-requests">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={reader} style={{ marginRight: '8px' }} />
                    <IonText>Incoming Medicine Requests</IonText>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    View incoming medicine requests.
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
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard/brgy-announcements">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={megaphone} style={{ marginRight: '8px' }} />
                    <IonText>Barangay Announcements</IonText>
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
              <IonCard className='ion-padding-vertical' color='primary' button routerLink="/admin/dashboard/rhu-announcements">
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
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default ADashboard;