import { IonAlert, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonLabel, IonMenu, IonMenuToggle, IonPage, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { Route } from 'react-router';
import { useIonRouter } from '@ionic/react';

import Dashboard from './admin-dashboard';
import Residents from './admin-residents';
import Verification from './admin-resident-verification';
import Brgy_Announcements from './admin-brgy-announcements';
import RHU_Announcements from './admin-rhu-announcements';

import { calendar, medical, medkit, megaphone, podium, reader, logOut, people, person, shield, checkbox } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
    const { logout, userRole, currentUser } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

    const paths = [
        { name: 'Dashboard', url: '/admin/dashboard', icon: podium},
        { name: 'All Residents', url: '/admin/dashboard/residents', icon: people},
        { name: 'Resident Verification', url: '/admin/dashboard/residents/verification', icon: checkbox},
        { name: 'Barangay Announcements', url: '/admin/dashboard/brgy-announcements', icon: megaphone },
        { name: 'RHU Announcements', url: '/admin/dashboard/rhu-announcements', icon: medical },
    ];

    const handleLogout = async () => {
      setShowLoading(true);
      try {
        await logout();
        router.push('/admin', 'forward');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setShowLoading(false);
      }
    };

    useEffect(() => {
    document.title = 'Admin Dashboard - BarangayMed+';
  }, []);

    return (
      <IonPage>
        <IonSplitPane contentId="main">
          <IonMenu contentId="main">
            <IonHeader className='ion-no-border'>
              <IonToolbar>
                <IonTitle>BarangayMed+</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
             
                  {paths.map((item, index) => (
                    <IonMenuToggle key={index} autoHide={false}>
                      <IonItem detail={false} routerLink={item.url} routerDirection="none">
                        <IonIcon slot="start" icon={item.icon} />
                        {item.name}
                      </IonItem>
                    </IonMenuToggle>
                  ))}
                </div>
                
                <div>
                  <IonItemDivider><IonLabel>Admin Account Settings ({currentUser?.email})</IonLabel></IonItemDivider>
                   <IonMenuToggle autoHide={false}>
                    <IonItem detail={false} button onClick={() => router.push('/admin/profile', 'forward')}>
                      <IonIcon slot="start" icon={person} />
                      Profile
                    </IonItem>
                  </IonMenuToggle>
                  <IonMenuToggle autoHide={false}>
                    <IonItem detail={false} button color="danger" id="admin-logout">
                      <IonIcon slot="start" icon={logOut} />
                      Logout
                    </IonItem>
                  </IonMenuToggle>

                           <IonAlert
                           trigger="admin-logout"
                           backdropDismiss={false}
                                  header="Are you sure?"
                                  message="Do you really want to log out?"
                                  buttons={[
                                    {
                                      text: "Cancel",
                                      role: "cancel",
                                      handler: () => {
                                        console.log("Alert cancelled");
                                      },
                                    },
                                    {
                                      text: "OK",
                                      role: "confirm",
                                      handler: () => {
                                        handleLogout();
                                      },
                                    },
                                  ]}
                                  onDidDismiss={({ detail }) =>
                                    console.log(`Dismissed with role: ${detail.role}`)
                                  }
                                ></IonAlert>
                </div>
              </div>
            </IonContent>
          </IonMenu>
          <IonRouterOutlet id="main">
            <Route exact path="/admin/dashboard" component={Dashboard} />
            <Route exact path="/admin/dashboard/residents" component={Residents} />
            <Route exact path="/admin/dashboard/residents/verification" component={Verification} />
            <Route exact path="/admin/dashboard/brgy-announcements" component={Brgy_Announcements} />
            <Route exact path="/admin/dashboard/rhu-announcements" component={RHU_Announcements} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonPage>
    );
};

export default Menu;
