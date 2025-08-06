import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import React from 'react';
import { megaphone, notifications, person, calendar } from 'ionicons/icons';

const Home: React.FC = () => {
    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Home</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol size="12">
                            <h1>Welcome to BarangayMed</h1>
                            <p>Your health and wellness companion</p>
                        </IonCol>
                    </IonRow>
                    
                    <IonRow>
                        <IonCol size="12" size-md="6">
                            <IonCard routerLink="/user/dashboard/announcements">
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={megaphone} style={{ marginRight: '8px' }} />
                                        Barangay Announcements
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    View the latest announcements from your barangay
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                        
                        <IonCol size="12" size-md="6">
                            <IonCard routerLink="/user/dashboard/notifications">
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={notifications} style={{ marginRight: '8px' }} />
                                        Notifications
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    Check your health notifications and reminders
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                    
                    <IonRow>
                        <IonCol size="12" size-md="6">
                            <IonCard routerLink="/user/dashboard/account">
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={person} style={{ marginRight: '8px' }} />
                                        My Account
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    Manage your profile and health information
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                        
                        <IonCol size="12" size-md="6">
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={calendar} style={{ marginRight: '8px' }} />
                                        Health Services
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    Book appointments and access health services
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </>
    );
};

export default Home;
