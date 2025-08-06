import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../contexts/AuthContext';

const Account: React.FC = () => {
    const { currentUser } = useAuth();

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Account</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
            {currentUser?.email}
            <LogoutButton />
          
            </IonContent>
        </>
    );
};

export default Account;
