import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/react';
import React, { useState } from 'react';
import { megaphone, clipboard, medkit } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';
import UserMedRequestModal from './user-med-request';

const Home: React.FC = () => {
    const { currentUser } = useAuth();
    const [showMedicineModal, setShowMedicineModal] = useState(false);

    return (
        <>
            <IonHeader>
                <IonToolbar className='ion-text-center'>
                    <IonTitle>BarangayMed+</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12"  className="ion-text-center">   
                            <h1>Welcome {currentUser?.displayName}!</h1>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol size="12" size-md="6">
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={medkit} style={{ marginRight: '8px' }} />
                                        Medicine Request
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    Request over-the-counter medicines from your barangay.
                                </IonCardContent>
                                <IonButton
                                    expand="block" 
                                    onClick={() => setShowMedicineModal(true)}
                                >
                                    Request Medicine Here
                                </IonButton>
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
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={megaphone} style={{ marginRight: '8px' }} />
                                        Barangay Announcements
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    View the latest announcements from your barangay.
                                </IonCardContent>
                                <IonButton 
                                    expand="block" 
                                    routerLink="/user/dashboard/announcements">
                                    View Announcements Here
                                    </IonButton>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                    
                    
                </IonGrid>
            </IonContent>
            <UserMedRequestModal 
                isOpen={showMedicineModal}
                onDidDismiss={() => setShowMedicineModal(false)}
            />
        </>
    );
};

export default Home;
