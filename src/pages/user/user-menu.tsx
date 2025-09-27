import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { Route, Redirect } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useRegistrationModal } from '../../contexts/RegistrationModalContext';
import FullRegistrationModal from './user-register-steps/full-registration-modal';

import Home from './user-home';
import Notifications from './user-notifications';
import User_Requests from './user-requests';
import Account from './user-my-account';
import Announcements from './user-brgy-announcements';
import { clipboard, home, notifications, person } from 'ionicons/icons';



const UserDashboard: React.FC = () => {
  const { currentUser, refreshUserClaims } = useAuth();
  const { isModalOpen, closeModal } = useRegistrationModal();
  const [selectedTab, setSelectedTab] = useState('home'); // State to track selected tab

  useEffect(() => {
    document.title = 'User Dashboard - BarangayMed+';
  }, []);

  return (
    <>
      <IonTabs>
        <IonTabBar slot="bottom" className='ion-padding'>
          <IonTabButton tab="home" href="/user/dashboard/home" onClick={() => setSelectedTab('home')}>
            <IonIcon icon={home} /> {/* Change icon based on selection */}
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="requests" href="/user/dashboard/requests" onClick={() => setSelectedTab('requests')}>
            <IonIcon icon={clipboard} /> {/* Change icon based on selection */}
            <IonLabel>My Requests</IonLabel>
          </IonTabButton>
          <IonTabButton tab="notifications" href="/user/dashboard/notifications" onClick={() => setSelectedTab('notifications')}>
            <IonIcon icon={notifications} /> {/* Change icon based on selection */}
            <IonLabel>Notifications</IonLabel>
          </IonTabButton>
          <IonTabButton tab="account" href="/user/dashboard/account" onClick={() => setSelectedTab('account')}>
            <IonIcon icon={person} /> {/* Change icon based on selection */}
            <IonLabel>Account</IonLabel>
          </IonTabButton>
        </IonTabBar>

        <IonRouterOutlet>
            <Route path="/user/dashboard/home" component={Home} exact />
            <Route path="/user/dashboard/requests" component={User_Requests} exact />
            <Route path="/user/dashboard/notifications" component={Notifications} exact />
            <Route path="/user/dashboard/account" component={Account} exact />

            <Route path="/user/dashboard/announcements" component={Announcements} exact />
            
            {/* Redirects */}
            <Route exact path="/user/dashboard">
              <Redirect to="/user/dashboard/home" />
          </Route>
        </IonRouterOutlet>
      </IonTabs>
      <FullRegistrationModal
        isOpen={isModalOpen}
        onDidDismiss={() => {
          closeModal();
          refreshUserClaims();
        }}
      />
    </>
  );
};

export default UserDashboard;
