import { IonAccordion, IonAccordionGroup, IonAlert, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonLabel, IonMenu, IonMenuToggle, IonPage, IonRouterOutlet, IonSplitPane, IonText, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { Route } from 'react-router';

import Dashboard from './sa-dashboard';
import Admin_Management from './sa-admins';
import Admin_Register from './sa-register-admin';
import Super_Admin_Register from './sa-register-superadmin';
import Super_Announcements from './sa-rhu-announcements';
import Med_Inventory from './sa-med-inventory';
import Med_Requests from './sa-med-request-list';
import SuperAdminTeleRequestList from './sa-tele-request-list';
import SuperAdminCreateMedRequest from './sa-create-med-request';
import Profile from './sa-profile';


import { medical, medkit, megaphone, people, podium, logOut, person, personAdd, calendar, shield, bagAdd, clipboard, videocam } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
    const { currentUser, logout, userRole } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

    const dashboard = { name: 'Dashboard', url: '/superadmin/dashboard', icon: podium };
    const bmedfeatures = [
        { name: 'Register New Resident', url: '/superadmin/dashboard', icon: personAdd },
        { name: 'Create Medicine Request', url: '/superadmin/dashboard/create-med-request', icon: medkit },
        { name: 'Create Consultation Request', url: '/superadmin/dashboard', icon: videocam },

    ];
    const medicine = [
        { name: 'Medicine Inventory', url: '/superadmin/dashboard/medicine-inventory', icon: medkit },
        { name: 'Medicine Requests', url: '/superadmin/dashboard/medicine-requests', icon: megaphone },
        { name: 'Medicine Transfer', url: '/superadmin/dashboard/medicine-inventory', icon: medkit },
    ];
    const announcements = [
        { name: 'Brgy. Announcements', url: '/superadmin/dashboard/rhu-announcements', icon: medical },
        { name: 'RHU Announcements', url: '/superadmin/dashboard/rhu-announcements', icon: medical },
    ];
    const teleconsultation = [
        { name: 'Teleconsultation Requests', url: '/superadmin/dashboard/teleconsultation-requests', icon: calendar },
    ];
    const admins = [
        { name: 'BHW Accounts', url: '/superadmin/dashboard/bhw-accounts', icon: people },
        { name: 'RHU Accounts', url: '/superadmin/dashboard/rhu-accounts', icon: people },
    ];

    const handleLogout = async () => {
      setShowLoading(true);
      try {
        await logout();
        router.push('/superadmin', 'forward');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setShowLoading(false);
      }
    };

    useEffect(() => {
    document.title = 'RHU Dashboard - BarangayMed+';
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
                    <IonAccordion value="bmedfeatures">
                      <IonItem slot="header">
                        <IonLabel>BMED+ Features</IonLabel>
                      </IonItem>
                      <div slot="content">
                        {bmedfeatures.map((item, index) => (
                          <IonMenuToggle key={index} autoHide={false}>
                            <IonItem detail={false} routerLink={item.url} routerDirection="none">
                              <IonIcon slot="start" icon={item.icon} />
                              {item.name}
                            </IonItem>
                          </IonMenuToggle>
                        ))}
                      </div>
                    </IonAccordion>
                    <IonAccordion value="medicine">
                      <IonItem slot="header">
                        <IonLabel>Medicine</IonLabel>
                      </IonItem>
                      <div slot="content">
                        {medicine.map((item, index) => (
                          <IonMenuToggle key={index} autoHide={false}>
                            <IonItem detail={false} routerLink={item.url} routerDirection="none">
                              <IonIcon slot="start" icon={item.icon} />
                              {item.name}
                            </IonItem>
                          </IonMenuToggle>
                        ))}
                      </div>
                    </IonAccordion>
                    <IonAccordion value="teleconsultation">
                      <IonItem slot="header">
                        <IonLabel>Teleconsultation</IonLabel>
                      </IonItem>
                      <div slot="content">
                        {teleconsultation.map((item, index) => (
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
                    <IonAccordion value="admins">
                      <IonItem slot="header">
                        <IonLabel>Accounts</IonLabel>
                      </IonItem>
                      <div slot="content">
                        {admins.map((item, index) => (
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
                  <IonItemDivider>
                    <IonLabel>
                      RHU Dashboard
                    </IonLabel>
                  </IonItemDivider>
                  {currentUser?.email === 'barangaymed@gmail.com' && (
                    <IonMenuToggle autoHide={false}>
                      <IonItem detail={false} routerLink="/superadmin/dashboard/register-rhu" routerDirection="none">
                        <IonIcon slot="start" icon={person} />
                        Create RHU Account
                      </IonItem>
                    </IonMenuToggle>
                  )}
                  <IonAccordionGroup>
                    <IonAccordion value="account">
                      <IonItem slot="header">
                        <IonLabel>Account</IonLabel>
                      </IonItem>
                      <div slot="content">
                        <IonMenuToggle autoHide={false}>
                          <IonItem button detail={false} routerLink="/superadmin/dashboard/profile" routerDirection="none">
                            Profile
                            <IonIcon  slot="start" icon={person} />
                          </IonItem>
                        </IonMenuToggle>
                        <IonMenuToggle autoHide={false}>
                          <IonItem  detail={false} button id="sa-logout">
                          <IonIcon slot="start" icon={logOut} />
                            Log Out
                          </IonItem>
                        </IonMenuToggle>
                      </div>
                    </IonAccordion>
                  </IonAccordionGroup>
                  <IonAlert
                    trigger="sa-logout"
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
            <Route exact path="/superadmin/dashboard" component={Dashboard} />
            <Route exact path="/superadmin/dashboard/profile" component={Profile} />
            <Route exact path="/superadmin/dashboard/medicine-inventory" component={Med_Inventory} />
            <Route exact path="/superadmin/dashboard/medicine-requests" component={Med_Requests} />
            <Route exact path="/superadmin/dashboard/teleconsultation-requests" component={SuperAdminTeleRequestList} />
            <Route exact path="/superadmin/dashboard/create-med-request" component={SuperAdminCreateMedRequest} />
            <Route exact path="/superadmin/dashboard/bhw-accounts" component={Admin_Management} />
            <Route exact path="/superadmin/dashboard/register-bhw" component={Admin_Register} />
            <Route exact path="/superadmin/dashboard/register-rhu" component={Super_Admin_Register} />
            <Route exact path="/superadmin/dashboard/rhu-announcements" component={Super_Announcements} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonPage>
    );
};

export default Menu;
