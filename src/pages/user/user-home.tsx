import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonText } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { megaphone, clipboard, medkit, receipt } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';
import UserMedRequestModal from './user-med-request';
import UserTeleRequest from './user-tele-request';

import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useHistory } from 'react-router-dom';


const Home: React.FC = () => {
    const { currentUser, verificationStatus } = useAuth();
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
    const [showTeleRequestModal, setShowTeleRequestModal] = useState(false);

    const isVerified = verificationStatus === 'verified';

    return (
        <>
            <IonHeader className='ion-no-border'>
                <IonToolbar className='ion-text-center'>
                    <IonTitle>BarangayMed+</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="with-tab-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol size="12"  className="ion-text-center">   
                            <h1><IonText style={{ fontWeight: 'bold' }} color={'primary'}>Welcome {firstName}!</IonText></h1>
                            {!isVerified && (
                              <p style={{ color: 'red', fontWeight: 'bold' }}>
                                Your account is not verified. Some features may be restricted.
                              </p>
                            )}
                            <p>Access BarangayMed's features below:</p>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol size="12" size-md="6">
                            <IonCard className='ion-padding-vertical' color={isVerified ? 'primary' : 'medium'} button={isVerified} onClick={isVerified ? () => setShowMedicineModal(true) : undefined}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={medkit} style={{ marginRight: '8px' }} />
                                        <IonText>Medicine Request</IonText>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText>
                                        Request medicines from your barangay.
                                       
                                    </IonText>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        <IonCol size="12" size-md="6">
                            <IonCard className='ion-padding-vertical' color={isVerified ? 'primary' : 'medium'} button={isVerified} onClick={isVerified ? () => setShowTeleRequestModal(true) : undefined}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonIcon icon={clipboard} style={{ marginRight: '8px' }} />
                                        <IonText>Book Teleconsultation</IonText>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText>
                                        Request online consultation in your barangay.
                                    </IonText>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>

                        {/* <IonCol size="12" size-md="6">
                            <IonCard className='ion-padding-vertical' color={isVerified ? 'primary' : 'medium'} button={isVerified} routerLink={isVerified ? "/user/dashboard/announcements" : undefined}>
                                <IonCardHeader>
                                    <IonCardTitle>
                                        <IonText>
                                            <IonIcon icon={megaphone} style={{ marginRight: '8px' }} />
                                        Barangay Announcements
                                        </IonText>
                                    </IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonText>
                                        View the latest announcements from your barangay.
                                    
                                    </IonText>

                                </IonCardContent>
                            </IonCard>
                        </IonCol> */}
                    </IonRow>
                    
                    
                </IonGrid>
            </IonContent>
            <UserMedRequestModal
                isOpen={showMedicineModal}
                onDidDismiss={() => setShowMedicineModal(false)}
            />
            <UserTeleRequest
                isOpen={showTeleRequestModal}
                onDidDismiss={() => setShowTeleRequestModal(false)}
            />
        </>
    );
};

export default Home;
