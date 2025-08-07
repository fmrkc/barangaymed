import { IonContent, IonHeader, IonIcon, IonItem, IonMenu, IonMenuToggle, IonPage, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar } from '@ionic/react';
import React, { useState } from 'react';
import { Route } from 'react-router';
import { useIonRouter } from '@ionic/react';

import ADashboard from './admin-dashboard';
import AAnnouncements from './admin-brgy-announcements';
import ARHUpdates from './admin-rhu-announcements';

import { calendar, medical, medkit, megaphone, podium, reader, logOut } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Menu: React.FC = () => {
    const { logout, userRole } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

    const paths = [
        { name: 'Dashboard', url: '/admin/dashboard', icon: podium},
        { name: 'Medicine Inventory', url: '/admin/inventory', icon: medkit },
        { name: 'Medicine Requests', url: '/admin/inventory', icon: reader },
        { name: 'Consultation Requests', url: '/admin/inventory', icon: calendar },
        { name: 'Barangay Announcements', url: '/admin/dashboard/announcements', icon: megaphone },
        { name: 'RHU Announcements', url: '/admin/dashboard/rhupdates', icon: medical },
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
            <Route exact path="/admin/dashboard" component={ADashboard} />
            <Route exact path="/admin/dashboard/announcements" component={AAnnouncements} />
            <Route exact path="/admin/dashboard/rhupdates" component={ARHUpdates} />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonPage>
    );
};

export default Menu;
