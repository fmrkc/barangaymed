import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonText } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { megaphone, clipboard, medkit, receipt } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';
import UserMedRequestModal from './user-med-request';
import UserTeleRequest from './user-tele-request';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';


const Home: React.FC = () => {
    const { currentUser } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
      

    useEffect(() => {
        const fetchUserData = async () => {
          if (!currentUser) return;
    
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              // Set individual name components
              setFirstName(userData.firstName || "");
            
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
            setIsLoadingUserData(false);
          }
        };
    
        fetchUserData();
      }, [currentUser]);


    const [showMedicineModal, setShowMedicineModal] = useState(false);
    const [showTeleconsultationModal, setShowTeleconsultationModal] = useState(false);

    return (
        <>
            <IonHeader className='ion-no-border'>
                <IonToolbar className='ion-text-center'>
                    <IonTitle>BarangayMed+</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12"  className="ion-text-center">   
                            <h1><IonText style={{ fontWeight: 'bold' }} color={'primary'}>Welcome {firstName}!</IonText></h1>
                            <p>Access BarangayMed's features below:</p>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol size="12" size-md="6">
                            <IonCard className='ion-padding-vertical' color={'primary'} button onClick={() => setShowMedicineModal(true)}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={medkit} style={{ marginRight: '8px' }} />
                                        <IonText>OTC Medicine Request</IonText>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText>
                                        Request over-the-counter medicines from your barangay.
                                    </IonText>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        <IonCol size="12" size-md="6">
                            <IonCard className='ion-padding-vertical' color={'primary'} button onClick={() => setShowMedicineModal(true)}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={receipt} style={{ marginRight: '8px' }} />
                                        <IonText>Prescription Medicine Request</IonText>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText>
                                        Upload your prescription here and we'll try to fulfill it.
                                    </IonText>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        
                        <IonCol size="12" size-md="6">
                            <IonCard className='ion-padding-vertical' color={'primary'} button onClick={() => setShowTeleconsultationModal(true)}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={clipboard} style={{ marginRight: '8px' }} />
                                        <IonText>Book Teleconsultation</IonText> 
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText>Book appointments for teleconsultation with healthcare professionals.</IonText> 
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        <IonCol size="12" size-md="6">
                            <IonCard className='ion-padding-vertical' color={'primary'} button routerLink="/user/dashboard/announcements">
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonText>
                                            <IonIcon icon={megaphone} style={{ marginRight: '8px' }} />
                                        Barangay Announcements
                                        </IonText>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText>View the latest announcements from your barangay.</IonText>
                                    
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                    
                    
                </IonGrid>
            </IonContent>
            <UserMedRequestModal
                isOpen={showMedicineModal}
                onDidDismiss={() => setShowMedicineModal(false)}
            />
            <UserTeleRequest
                isOpen={showTeleconsultationModal}
                onDidDismiss={() => setShowTeleconsultationModal(false)}
            />
        </>
    );
};

export default Home;
