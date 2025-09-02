import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonToast, IonItem, IonLabel, IonText } from '@ionic/react';
import { checkmarkDoneOutline } from 'ionicons/icons';
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { BARANGAYS } from '../../constants/barangays';

const SuperAdminRegister: React.FC = () => {
    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();

    const [fullName, setFullName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [barangayId, setBarangay] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    const handleProvisionAdmin = async (event: any) => {
        event.preventDefault();
        setError(null);

        if (!fullName || !contactEmail || !barangayId) {
            setError('Full Name, Contact Email, and Barangay are required.');
            return;
        }

        await present('Creating Admin Account...');
        try {
            const provisionUserFunction = httpsCallable(functions, 'provisionUser');
            await provisionUserFunction({
                fullName,
                contactEmail,
                role: 'admin',
                barangayId: barangayId,
            });
            
            dismiss();
            setShowToast(true);
            // Clear form
            setFullName('');
            setContactEmail('');
            setBarangay('');

        } catch (err: any) {
            dismiss();
            setError(err.message || 'Registration failed. Please try again.');
        }
    }

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonBackButton defaultHref='/superadmin/dashboard/admin-management' />
                    </IonButtons>
                    <IonTitle>Create Admin Account</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent scrollY={false}>
                <IonGrid fixed>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                            <IonCard>
                                <IonCardContent>
                                <form onSubmit={handleProvisionAdmin}>
                                    <IonItem>
                                        <IonLabel position="stacked">Full Name</IonLabel>
                                        <IonInput
                                            type="text"
                                            value={fullName}
                                            onIonChange={e => setFullName(e.detail.value!)}
                                            placeholder="Juan Dela Cruz"
                                        />
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel position="stacked">Contact Email</IonLabel>
                                        <IonInput
                                            type="email"
                                            value={contactEmail}
                                            onIonChange={e => setContactEmail(e.detail.value!)}
                                            placeholder="(Credentials will be sent here)"
                                        />
                                    </IonItem>

                                    <IonItem>
                                      <IonLabel>Barangay</IonLabel>
                                      <IonSelect
                                          value={barangayId}
                                          placeholder="Select Barangay"
                                          onIonChange={e => setBarangay(e.detail.value)}
                                      >
                                          {BARANGAYS.map((brgy) => (
                                              <IonSelectOption key={brgy} value={brgy}>
                                                  {brgy}
                                              </IonSelectOption>
                                          ))}
                                      </IonSelect>
                                    </IonItem>
                                    
                                    {error && <IonText color="danger"><p className="ion-padding-start">{error}</p></IonText>}

                                    <IonButton type='submit' className="ion-margin-top" expand='block'>
                                        Create and Send Credentials
                                        <IonIcon icon={checkmarkDoneOutline} slot="end" />
                                    </IonButton>
                                </form>
                                <IonToast
                                    isOpen={showToast}
                                    onDidDismiss={() => setShowToast(false)}
                                    message="Admin account created successfully. Credentials have been sent."
                                    duration={2500}
                                    color="success"
                                />
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>

        </IonPage>
    );
};

export default SuperAdminRegister;