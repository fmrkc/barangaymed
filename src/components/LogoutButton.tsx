

import React, { useState } from 'react';
import { IonButton, IonLoading } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { useIonRouter } from '@ionic/react';

const LogoutButton: React.FC = () => {
  const { logout, userRole } = useAuth();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState(false);

  const handleLogout = async () => {
    setShowLoading(true);
    try {
      await logout();
      // Redirect based on user role
      if (userRole === 'admin') {
        router.push('/admin', 'forward');
      } else if (userRole === 'superadmin') {
        router.push('/superadmin', 'forward');
      } else {
        router.push('/user/login', 'forward');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <>
      <IonButton onClick={handleLogout} color="danger">
        Logout
      </IonButton>
      <IonLoading
        isOpen={showLoading}
        message={'Logging out...'}
        duration={2000}
      />
    </>
  );
};

export default LogoutButton;
