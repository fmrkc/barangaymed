import { IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonLabel, IonMenu, IonMenuToggle, IonPage, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import React, { useState } from 'react';
import { Route } from 'react-router';

import Dashboard from './sa-dashboard';
import Admin_Management from './sa-admin-manage';
import Admin_Register from './sa-register';
import Super_Announcements from './sa-rhu-announcements';
import Med_Inventory from './sa-med-inventory';

import { medical, medkit, megaphone, people, podium, logOut, person } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
    const { currentUser, logout, userRole } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

    const paths = [
        { name: 'Dashboard', url: '/superadmin/dashboard', icon: podium},
        { name: 'Medicine Inventory', url: '/superadmin/dashboard/medicine-inventory', icon: medkit },
        { name: 'Admin Management', url: '/superadmin/dashboard/admin-management', icon: people },
        { name: 'RHU Requests', url: '/admin/med-inventory', icon: megaphone },
        { name: 'RHU Announcements', url: '/superadmin/dashboard/rhu-announcements', icon: medical },
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
                  <IonMenuToggle>
                    <IonItem button detail={false}>
                      Profile
                      <IonIcon slot="start" icon={person} />
                    </IonItem>
                    
                  </IonMenuToggle>
                  <IonMenuToggle>
                    <IonItem detail={false} button color="danger" onClick={handleLogout}>
                    <IonIcon slot="start" icon={logOut} />
                      Logout
                    </IonItem>
                  </IonMenuToggle>             
                </div>
              </div>
            </IonContent>
          </IonMenu>
          <IonRouterOutlet id="main">
            <Route exact path="/superadmin/dashboard" component={Dashboard} />
            <Route exact path="/superadmin/dashboard/medicine-inventory" component={Med_Inventory} />
            <Route exact path="/superadmin/dashboard/admin-management" component={Admin_Management} />
            <Route exact path="/superadmin/dashboard/sa-register" component={Admin_Register} />
            <Route exact path="/superadmin/dashboard/rhu-announcements" component={Super_Announcements} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonPage>
    );
};

export default Menu;
