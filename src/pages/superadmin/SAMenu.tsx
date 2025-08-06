import { IonContent, IonHeader, IonIcon, IonItem, IonMenu, IonMenuToggle, IonPage, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import React, { useState } from 'react';
import { Route } from 'react-router';

import SADashboard from './SADashboard';
import SAManagement from './SAManagement';
import SARegister from './SARegister';
import SAAnnouncements from './SARHUAnnouncements';

import { medical, medkit, megaphone, people, podium, logOut } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
    const { logout, userRole } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

    const paths = [
        { name: 'Dashboard', url: '/superadmin/dashboard', icon: podium},
        { name: 'Medicine Inventory', url: '/admin/inventory', icon: medkit },
        { name: 'Admin Management', url: '/superadmin/dashboard/adminmanagement', icon: people },
        { name: 'RHU Requests', url: '/admin/inventory', icon: megaphone },
        { name: 'RHU Announcements', url: '/superadmin/dashboard/rhuannouncements', icon: medical },
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
            <IonHeader>
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
            <Route exact path="/superadmin/dashboard" component={SADashboard} />
            <Route exact path="/superadmin/dashboard/adminmanagement" component={SAManagement} />
            <Route exact path="/superadmin/dashboard/saregister" component={SARegister} />
            <Route exact path="/superadmin/dashboard/rhuannouncements" component={SAAnnouncements} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonPage>
    );
};

export default Menu;
