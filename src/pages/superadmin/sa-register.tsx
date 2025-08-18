import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRouterLink, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonToast } from '@ionic/react';
import { checkmarkDoneOutline } from 'ionicons/icons';
import React from 'react';

import { registerUserWithFullData } from '../../firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { BARANGAYS } from '../../constants/barangays';

const SuperRegister: React.FC = () => {
    const { currentUser } = useAuth();

    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState('');
    const [fullName, setFullName] = React.useState(''); // add fullName state
    const [barangay, setBarangay] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const [showToast, setShowToast] = React.useState(false);

    const doRegister = async (event: any) => {
        event.preventDefault();
        setError(null);

        // Validation: ensure all fields are filled
        if (!role || !fullName.trim() || !email.trim() || !password.trim() || !barangay) {
            setError('All fields are required.');
            return dismiss();
        }

        await present('Creating account...');
        try {
            await registerUserWithFullData(email, password, fullName, role, { barangay }); // pass fullName as 4th arg
            dismiss();
            setShowToast(true);
            setTimeout(() => {
                    router.push('/superadmin/dashboard/adminmanagement', 'forward');
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
                        <IonBackButton defaultHref='/superadmin/dashboard/adminmanagement' />
                    </IonButtons>
                    <IonTitle>Create Account</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent scrollY={false}>
                <IonGrid fixed>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                            <IonCard>
                                <IonCardContent>
                                <form onSubmit={doRegister}>
                                    <IonSelect
                                        value={role}
                                        placeholder="Select Role"
                                        onIonChange={e => setRole(e.detail.value)}
                                    >
                                        <IonSelectOption value="admin">Admin</IonSelectOption>
                                        <IonSelectOption value="superadmin">Super Admin</IonSelectOption>
                                    </IonSelect>
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

                                    <IonSelect
                                        value={barangay}
                                        placeholder="Select Barangay"
                                        onIonChange={e => setBarangay(e.detail.value)}
                                        className="ion-margin-top"
                                    >
                                        {BARANGAYS.map((brgy) => (
                                            <IonSelectOption key={brgy} value={brgy}>
                                                {brgy}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                    
                                    {error && <p style={{ color: 'red' }}>{error}</p>}
                                    <IonButton type='submit' className="ion-margin-top" expand='block'>
                                        Create account
                                    <IonIcon icon={checkmarkDoneOutline} slot="end" />
                                    </IonButton>
                                </form>
                                <IonToast
                                    isOpen={showToast}
                                    onDidDismiss={() => setShowToast(false)}
                                    message="Account created successfully! Please login with your credentials."
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

export default SuperRegister;
