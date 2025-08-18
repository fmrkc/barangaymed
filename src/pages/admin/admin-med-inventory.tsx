import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';

const Admin_Med_Inventory: React.FC = () => {

    return (
        <IonPage>
            <IonHeader className='ion-no-border'>
                <IonButtons slot="start">
                    <IonMenuButton />
                </IonButtons>
                <IonToolbar>
                    <IonTitle>Page Title</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                UI goes here...
            </IonContent>
        </IonPage>
    );
};

export default Admin_Med_Inventory;