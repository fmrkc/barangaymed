import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import React, { useState } from 'react';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../contexts/AuthContext';
import { logOut } from 'ionicons/icons';

const Account: React.FC = () => {
    const { logout, currentUser } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);

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
        <>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Account</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent >
            <IonCard>
                <IonCardContent>
                    <h1>{currentUser?.email}</h1>
                    
                    <IonItem detail={false} button onClick={handleLogout}>
                                  <IonIcon slot="start" icon={logOut} />
                                  Logout
                                </IonItem>
                </IonCardContent>
            </IonCard>

            
          
            </IonContent>
        </>
    );
};

export default Account;
