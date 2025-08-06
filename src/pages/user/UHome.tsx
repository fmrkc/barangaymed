import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import React from 'react';
import { megaphone, notifications, person, calendar, clipboard, medkit } from 'ionicons/icons';
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
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12"  className="ion-text-center">   
                            <h1>Welcome {currentUser?.email}!</h1>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol size="12" size-md="6">
                            <IonCard routerLink="/user/dashboard/medicine_request">
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={medkit} style={{ marginRight: '8px' }} />
                                        Medicine Request
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    Request over-the-counter medicines from your barangay.
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        
                        <IonCol size="12" size-md="6">
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={clipboard} style={{ marginRight: '8px' }} />
                                        Book Teleconsultation
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    Book appointments for teleconsultation with healthcare professionals.
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                        

                        <IonCol size="12" size-md="6">
                            <IonCard routerLink="/user/dashboard/announcements">
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={megaphone} style={{ marginRight: '8px' }} />
                                        Barangay Announcements
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    View the latest announcements from your barangay.
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
