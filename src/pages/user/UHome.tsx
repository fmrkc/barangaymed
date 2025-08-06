import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import React from 'react';
import { megaphone, notifications, person, calendar } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

const Home: React.FC = () => {
    const { currentUser } = useAuth();
    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>BarangayMed+</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding ion-text-center">
                <IonGrid>
                    <IonRow>
                        <IonCol size="12">
                            
                            <h1>Welcome {currentUser?.email} </h1>
                            
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
