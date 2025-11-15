import { IonAccordion, IonAccordionGroup, IonAlert, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonLabel, IonMenu, IonMenuToggle, IonPage, IonRouterOutlet, IonSplitPane, IonText, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { Route } from 'react-router';
import { useIonRouter } from '@ionic/react';

import Dashboard from './admin-dashboard';
import Profile from './admin-profile';
import Residents from './admin-residents';
import Verification from './admin-resident-verification';
import Brgy_Announcements from './admin-brgy-announcements';
import RHU_Announcements from './admin-rhu-announcements';

import { medical, megaphone, podium, logOut, people, person, checkbox } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
    const { logout, userRole, currentUser } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

    const dashboard = { name: 'Dashboard', url: '/admin/dashboard', icon: podium };
    const residents = [
        { name: 'Verified Residents', url: '/admin/dashboard/residents', icon: people },
        { name: 'Resident Verification', url: '/admin/dashboard/residents/verification', icon: checkbox },
    ];
    const announcements = [
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
    document.title = 'BHW Dashboard - BarangayMed+';
  }, []);

    return (
      <IonPage>
        <IonSplitPane contentId="main">
          <IonMenu contentId="main">
            <IonHeader className='ion-no-border'>
              <IonToolbar>
                <IonTitle>
                  BarangayMed+
                </IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <IonMenuToggle autoHide={false}>
                    <IonItem detail={false} routerLink={dashboard.url} routerDirection="none">
                      <IonIcon slot="start" icon={dashboard.icon} />
                      {dashboard.name}
                    </IonItem>
                  </IonMenuToggle>
                  <IonAccordionGroup>
                    <IonAccordion value="residents">
                      <IonItem slot="header">
                        <IonLabel>Residents</IonLabel>
                      </IonItem>
                      <div slot="content">
                        {residents.map((item, index) => (
                          <IonMenuToggle key={index} autoHide={false}>
                            <IonItem detail={false} routerLink={item.url} routerDirection="none">
                              <IonIcon slot="start" icon={item.icon} />
                              {item.name}
                            </IonItem>
                          </IonMenuToggle>
                        ))}
                      </div>
                    </IonAccordion>
                    <IonAccordion value="announcements">
                      <IonItem slot="header">
                        <IonLabel>Announcements</IonLabel>
                      </IonItem>
                      <div slot="content">
                        {announcements.map((item, index) => (
                          <IonMenuToggle key={index} autoHide={false}>
                            <IonItem detail={false} routerLink={item.url} routerDirection="none">
                              <IonIcon slot="start" icon={item.icon} />
                              {item.name}
                            </IonItem>
                          </IonMenuToggle>
                        ))}
                      </div>
                    </IonAccordion>
                  </IonAccordionGroup>
                </div>
                
                <div>
                <IonAccordionGroup>
                   <IonItemDivider>
                    <IonLabel>
                      BHW Dashboard
                    </IonLabel>
                  </IonItemDivider>
                   <IonAccordion value="profile">
                      <IonItem slot="header">
                        <IonLabel>Account</IonLabel>
                      </IonItem>
                      <div slot="content">
                        <IonMenuToggle autoHide={false}>
                          <IonItem detail={false} button routerLink="/admin/dashboard/profile" routerDirection="none">
                            <IonIcon slot="start" icon={person} />
                            Profile
                          </IonItem>
                          <IonItem detail={false} button id="admin-logout">
                            <IonIcon slot="start" icon={logOut} />
                            Logout
                          </IonItem>
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
                          />
                        </IonMenuToggle>
                      </div>
                    </IonAccordion>
                </IonAccordionGroup>
                </div>
              </div>
            </IonContent>
          </IonMenu>
          <IonRouterOutlet id="main">
            <Route exact path="/admin/dashboard" component={Dashboard} />
            <Route exact path="/admin/dashboard/profile" component={Profile} />
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
