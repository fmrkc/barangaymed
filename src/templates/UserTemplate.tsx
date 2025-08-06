import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import React from 'react';
import { Route, Redirect } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

import { home as homeIcon, notifications as notificationsIcon, person as personIcon, megaphone as megaphoneIcon } from 'ionicons/icons';

interface UserTemplateProps {
  children?: React.ReactNode;
}

const UserTemplate: React.FC<UserTemplateProps> = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <IonPage>
        <div>Loading...</div>
      </IonPage>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Redirect to="/user/login" />;
  }

  // Redirect if not user
  if (userRole !== 'user') {
    return <Redirect to="/" />;
  }

  return (
    <IonPage>
      <IonTabs>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/user/dashboard/home">
            <IonIcon icon={homeIcon} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="announcements" href="/user/dashboard/announcements">
            <IonIcon icon={megaphoneIcon} />
            <IonLabel>Announcements</IonLabel>
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
          {children}
          <Route exact path="/user/dashboard">
            <Redirect to="/user/dashboard/home" />
          </Route>
        </IonRouterOutlet>
      </IonTabs>
    </IonPage>
  );
};

export default UserTemplate;
