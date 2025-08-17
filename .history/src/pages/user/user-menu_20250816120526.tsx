import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import React from 'react';
import { Route, Redirect } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';


import Home from './user-home';
import Notifications from './user-notifications';
import Account from './user-my-account';
import Announcements from './user-brgy-announcements';
import Medicine_Request from './user-med-request';
import User_Requests from './user-requests';

import { home as homeIcon, notifications as notificationsIcon, person as personIcon, megaphone as megaphoneIcon, albums } from 'ionicons/icons';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
      <IonTabs>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/user/dashboard/home">
            <IonIcon icon={homeIcon} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="user_requests" href="/user/dashboard/user_requests">
            <IonIcon icon={albums} />
            <IonLabel>Requests</IonLabel>
          </IonTabButton>  
          <IonTabButton tab="notifications" href="/user/dashboard/notifications">
            <IonIcon icon={notificationsIcon} />
            <IonLabel>Notifications</IonLabel>
          </IonTabButton>
          <IonTabButton tab="account" href="/user/dashboard/account">
            <IonIcon icon={personIcon} />
            <IonLabel>Account</IonLabel>
          </IonTabButton>
        </IonTabBar>

        <IonRouterOutlet>
            <Route path="/user/dashboard/home" component={Home} exact />
            <Route path="/user/dashboard/notifications" component={Notifications} exact />
            <Route path="/user/dashboard/user_requests" component={User_Requests} exact />
            <Route path="/user/dashboard/account" component={Account} exact />

            <Route path="/user/dashboard/announcements" component={Announcements} exact />
            <Route path="/user/dashboard/medicine_request" component={Medicine_Request} exact />
            
            {/* Redirects */}
            <Route exact path="/user/dashboard">
              <Redirect to="/user/dashboard/home" />
          </Route>
        </IonRouterOutlet>
      </IonTabs>
  );
};

export default UserDashboard;
