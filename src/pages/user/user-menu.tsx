import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import React, { useState } from 'react';
import { Route, Redirect } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

import Home from './user-home';
import Notifications from './user-notifications';
import Account from './user-my-account';
import Announcements from './user-brgy-announcements';
import Medicine_Request from './user-med-request';
import User_Requests from './user-requests';
import Medicine_Requests_Status from './user-med-list';
import Teleconsultation_Requests_Status from './user-tele-list';
import { clipboard, home, notifications, person } from 'ionicons/icons';



const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState('home'); // State to track selected tab

  return (
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
            <Route path="/user/dashboard/notifications" component={Notifications} exact />
            <Route path="/user/dashboard/requests" component={User_Requests} exact />
            <Route path="/user/dashboard/account" component={Account} exact />

            <Route path="/user/dashboard/requests/medicine" component={Medicine_Requests_Status} exact />
            <Route path="/user/dashboard/requests/teleconsultation" component={Teleconsultation_Requests_Status} exact />

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
