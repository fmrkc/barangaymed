import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonToast } from '@ionic/react';
import { checkmarkDoneOutline } from 'ionicons/icons';
import React from 'react';

import { createAdmin } from '../../firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminRegister: React.FC = () => {
    const { currentUser } = useAuth();

    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const [showToast, setShowToast] = React.useState(false);

    const doRegister = async (event: any) => {
        event.preventDefault();
        setError(null);

        if (!fullName.trim() || !email.trim() || !password.trim()) {
            setError('All fields are required.');
            return dismiss();
        }

        await present('Creating account...');
        try {
            await createAdmin({ email, password, fullName, role: 'superadmin', barangay: 'N/A' });
            dismiss();
            setShowToast(true);
            setTimeout(() => {
                    router.push('/superadmin/dashboard/admin-management', 'forward');
            }, 1500);
        } catch (err) {
            dismiss();
            setError('Registration failed. Please try again.');
        }
    }


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
                                <IonCardContent>
                                <form onSubmit={doRegister}>
                                    <IonInput
                                        className="ion-margin-top"
                                        fill='outline'
                                        labelPlacement='floating'
                                        label="Full Name"
                                        type='text'
                                        placeholder='Juan Dela Cruz'
                                        value={fullName}
                                        onIonChange={e => setFullName(e.detail.value!)}
                                    />
                                    <IonInput
                                        className="ion-margin-top"
                                        fill='outline'
                                        labelPlacement='floating'
                                        label="E-mail"
                                        type='email'
                                        placeholder='juan@gmail.com'
                                        value={email}
                                        onIonChange={e => setEmail(e.detail.value!)}
                                    />
                                    <IonInput
                                        className="ion-margin-top"
                                        fill='outline'
                                        labelPlacement='floating'
                                        label="Password"
                                        type='password'
                                        placeholder='juan123'
                                        value={password}
                                        onIonChange={e => setPassword(e.detail.value!)}
                                    />
                                    
                                    {error && <p style={{ color: 'red' }}>{error}</p>}
                                    <IonButton type='submit' className="ion-margin-top" expand='block'>
                                        Create Super Admin
                                    <IonIcon icon={checkmarkDoneOutline} slot="end" />
                                    </IonButton>
                                </form>
                                <IonToast
                                    isOpen={showToast}
                                    onDidDismiss={() => setShowToast(false)}
                                    message="Super Admin account created successfully!"
                                    duration={1500}
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