import { IonBackButton, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonPage, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonItem, IonLabel, IonText } from '@ionic/react';
import React from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';

const SuperAdminRegister: React.FC = () => {
    const { currentUser } = useAuth();

    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();

    // State for the new super admin provisioning form
    const [fullName, setFullName] = React.useState('');
    const [contactEmail, setContactEmail] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const handleProvisionSuperAdmin = async () => {
        setError(null);
        setSuccess(null);

        if (!fullName || !contactEmail) {
            setError('Full Name and Contact Email are required.');
            return;
        }

        await present('Creating Super Admin...');

        try {
            const provisionUserFunction = httpsCallable(functions, 'provisionUser');
            const result = await provisionUserFunction({
                fullName,
                contactEmail,
                role: 'superadmin', // Hardcode role to superadmin
            });

            const data = result.data as { success: boolean; message: string };
            if (data.success) {
                setSuccess(data.message);
                // Clear form
                setFullName('');
                setContactEmail('');
            } else {
                setError(data.message);
            }
        } catch (error: any) {
            console.error('Error provisioning user:', error);
            setError(error.message || 'Failed to create user.');
        } finally {
            dismiss();
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonBackButton defaultHref='/superadmin/dashboard/admin-management' />
                    </IonButtons>
                    <IonTitle>Create Super Admin</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent scrollY={false}>
                <IonGrid fixed>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>Create New Super Admin Account</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonItem>
                                        <IonLabel position="stacked">Full Name</IonLabel>
                                        <IonInput
                                            type="text"
                                            value={fullName}
                                            onIonChange={(e) => setFullName(e.detail.value!)}
                                            placeholder="Juan Dela Cruz"
                                        />
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel position="stacked">Contact Email</IonLabel>
                                        <IonInput
                                            type="email"
                                            value={contactEmail}
                                            onIonChange={(e) => setContactEmail(e.detail.value!)}
                                            placeholder="(Credentials will be sent here)"
                                        />
                                    </IonItem>

                                    {error && <IonText color="danger"><p>{error}</p></IonText>}
                                    {success && <IonText color="success"><p>{success}</p></IonText>}

                                    <IonButton expand="block" className="ion-margin-top" onClick={handleProvisionSuperAdmin}>
                                        Create and Send Credentials
                                    </IonButton>
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