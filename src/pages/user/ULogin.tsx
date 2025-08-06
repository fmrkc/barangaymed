import { IonButton, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonIcon, IonInput, IonPage, IonRow, useIonLoading, useIonRouter } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { logInSharp, personCircle, videocamOutline } from 'ionicons/icons';
import healthcare from '../../assets/healthcare.png'
import Intro from '../../components/Intro';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from '../../contexts/AuthContext';
import { login } from '../../firebaseConfig';
import { logFailedLogin } from '../../utils/logger';

const INTR0_KEY = 'intro-seen';

const Login: React.FC = () => {
    const router = useIonRouter();
    const { login: authLogin } = useAuth();
    const [introSeen, setIntroSeen] = useState(true);
    const [present, dismiss] = useIonLoading();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkStorage = async () => {
            const seen = await Preferences.get({ key:INTR0_KEY});
            console.log("🚀 ~ file: Login.tsx:17 ~ checkStorage ~ seen:", seen)
            setIntroSeen(seen.value === 'true');
        }
        checkStorage();
    }, [])

    const doLogin = async (event: any) => {
        event.preventDefault();
        setError(null);
        await present('Logging in...');
        try {
            const user = await login(email, password);
            if (user) {
                await authLogin(user);
                dismiss();
                router.push('/user/dashboard', 'forward');
            } else {
                // Log the failed login attempt
                logFailedLogin(email, 'Login failed. Please check your email/password.');
                dismiss();
                setError('Login failed. Please check your email/password.');
            }
        } catch (err: any) {
            // Log the failed login attempt
            logFailedLogin(email, err.message || 'Unknown error');
            dismiss();
            setError('Login failed. Please check your email/password.');
        }
    };

    const finishIntro = async() => {
        setIntroSeen(true);
        Preferences.set({ key:INTR0_KEY, value: 'true'});
    }

    const seeIntroAgain = () => {
        setIntroSeen(false);
        Preferences.remove({ key:INTR0_KEY });
    }; 

    return (
        <>
        {!introSeen ? (
            <Intro onFinish={finishIntro} />
        ) : (
        <IonPage>
            <IonContent scrollY={false} className='ion-padding'>
                <IonGrid fixed>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                            <div className="ion-text-center">
                                <img src={healthcare} alt='logo' width={'150vh'} />
                            </div>
                        </IonCol>
                    </IonRow>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                             <IonCard>
                                <IonCardContent>
                                    <form onSubmit={doLogin}>
                                    <IonInput
                                        mode='md'
                                        fill='outline'
                                        labelPlacement='floating'
                                        label="E-mail"
                                        type='email'
                                        placeholder='juan@gmail.com'
                                        value={email}
                                        onIonChange={e => setEmail(e.detail.value!)}
                                    />
                                    <IonInput
                                        mode='md'
                                        className="ion-margin-top"
                                        fill='outline'
                                        labelPlacement='floating'
                                        label="Password"
                                        type='password'
                                        placeholder='juan123'
                                        value={password}
                                        onIonChange={e => setPassword(e.detail.value!)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                // Update password state with current value before submitting
                                                if (e.target instanceof HTMLInputElement) {
                                                    setPassword(e.target.value);
                                                }
                                                doLogin(e);
                                            }
                                        }}
                                    />
                                    {error && <p style={{ color: 'red' }}>{error}</p>}
                                    <IonButton type='submit' className="ion-margin-top" expand='block'>
                                        Login
                                        <IonIcon icon={logInSharp} slot="end" />
                                    </IonButton>
                                    <IonButton routerLink='/user/register' type='button' color='tertiary' className="ion-margin-top" expand='block'>
                                        Create Account
                                        <IonIcon icon={personCircle} slot="end" />
                                    </IonButton>
                                    <IonButton onClick={seeIntroAgain} size='small' type='button' fill='clear' className="ion-margin-top" expand='block'>
                                        Watch intro again
                                        <IonIcon icon={videocamOutline} slot="end" />
                                    </IonButton>
                                    </form>
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                
               
            </IonContent>

        </IonPage>
        )}
        </>
    );
};


export default Login;

