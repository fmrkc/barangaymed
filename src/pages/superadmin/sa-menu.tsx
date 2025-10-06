import { IonAlert, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonLabel, IonMenu, IonMenuToggle, IonPage, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { Route } from 'react-router';

import Dashboard from './sa-dashboard';
import Admin_Management from './sa-admin-manage';
import Admin_Register from './sa-admin-register';
import Super_Admin_Register from './sa-superadmin-register';
import Super_Announcements from './sa-rhu-announcements';
import Med_Inventory from './sa-med-inventory';
import Med_Requests from './sa-med-request-list';
import SuperAdminTeleRequestList from './sa-tele-request-list';

import { medical, medkit, megaphone, people, podium, logOut, person, personAdd, calendar } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
    const { currentUser, logout, userRole } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

    const paths = [
        { name: 'Dashboard', url: '/superadmin/dashboard', icon: podium},
        { name: 'Medicine Inventory', url: '/superadmin/dashboard/medicine-inventory', icon: medkit },
        { name: 'Medicine Requests', url: '/superadmin/dashboard/medicine-requests', icon: megaphone },
      //  { name: 'Medicine Transfer', url: '/superadmin/dashboard/medicine-inventory', icon: medkit },
        { name: 'Teleconsultation Requests', url: '/superadmin/dashboard/teleconsultation-requests', icon: calendar },
       // { name: 'Consultation Schedule', url: '/superadmin/dashboard/rhu-announcements', icon: calendar },
      //  { name: 'RHU Announcements', url: '/superadmin/dashboard/rhu-announcements', icon: medical },
      //  { name: 'All Admins', url: '/superadmin/dashboard/admin-management', icon: people },
        { name: 'Create BHW Account', url: '/superadmin/dashboard/sa-register', icon: personAdd },
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
    document.title = 'Super Admin Dashboard - BarangayMed+';
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
                  <IonItemDivider><IonLabel>Super Admin Account Settings ({currentUser?.email})</IonLabel></IonItemDivider>    
                  {currentUser?.email === 'barangaymed@gmail.com' && (
                    <IonMenuToggle autoHide={false}>
                      <IonItem detail={false} routerLink="/superadmin/dashboard/sa-superadmin-register" routerDirection="none">
                        <IonIcon slot="start" icon={person} />
                        Create Super Admin
                      </IonItem>
                    </IonMenuToggle>
                  )}
                  <IonMenuToggle autoHide={false}>
                    <IonItem button detail={false}>
                      Profile
                      <IonIcon  slot="start" icon={person} />
                    </IonItem>
                    
                  </IonMenuToggle>
                  <IonMenuToggle autoHide={false}>
                    <IonItem  detail={false} button color="danger" id="sa-logout">
                    <IonIcon slot="start" icon={logOut} />
                      Logout
                    </IonItem>
                  </IonMenuToggle>            
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
            <Route exact path="/superadmin/dashboard/medicine-inventory" component={Med_Inventory} />
            <Route exact path="/superadmin/dashboard/medicine-requests" component={Med_Requests} />
            <Route exact path="/superadmin/dashboard/teleconsultation-requests" component={SuperAdminTeleRequestList} />
            <Route exact path="/superadmin/dashboard/admin-management" component={Admin_Management} />
            <Route exact path="/superadmin/dashboard/sa-register" component={Admin_Register} />
            <Route exact path="/superadmin/dashboard/sa-superadmin-register" component={Super_Admin_Register} />
            <Route exact path="/superadmin/dashboard/rhu-announcements" component={Super_Announcements} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonPage>
    );
};

export default Menu;
