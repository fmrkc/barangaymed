import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCol, IonContent, IonGrid, IonIcon, IonInput, IonPage, IonRow, useIonLoading, useIonRouter } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { lockClosed, logInSharp, person, personCircle, videocamOutline } from 'ionicons/icons';
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
            <IonContent scrollY={false}>
              <IonGrid
                fixed
                style={{
                  minHeight: "80vh",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <IonRow className="ion-justify-content-center">
                  <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
                    <div className="ion-text-center">
                      <img src={healthcare} alt="logo" width={"150vh"} />
                    </div>
                  </IonCol>
                </IonRow>
                <IonRow className="ion-justify-content-center">
                  <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
                    <IonCard>
                      <IonCardContent>
                        <IonCardTitle className="ion-padding-vertical">
                          BarangayMed+
                        </IonCardTitle>
                        <IonCardSubtitle>
                            Your one stop for barangay healthcare needs!
                        </IonCardSubtitle>
                        <form onSubmit={doLogin}>
                          <IonCardSubtitle className='ion-margin-top'>E-mail</IonCardSubtitle>
                          <IonInput
                            mode="md"
                            fill="outline"
                            type="email"
                            placeholder="juan@gmail.com"
                            value={email}
                            onIonChange={(e) => setEmail(e.detail.value!)}
                          >
                            <IonIcon icon={person} slot="start" />
                          </IonInput>
                          <IonCardSubtitle className='ion-margin-top'>Password</IonCardSubtitle>
                          <IonInput
                            mode="md"
                            fill="outline"
                            type="password"
                            placeholder="juan123"
                            value={password}
                            onIonChange={(e) => setPassword(e.detail.value!)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                // Update password state with current value before submitting
                                if (e.target instanceof HTMLInputElement) {
                                  setPassword(e.target.value);
                                }
                                doLogin(e);
                              }
                            }}
                          >
                            <IonIcon icon={lockClosed} slot="start" />
                          </IonInput>
                          {error && <p style={{ color: "red" }}>{error}</p>}
                          <IonButton
                            type="submit"
                            className="ion-padding-vertical"
                            expand="block"
                            routerDirection="forward"
                            shape='round'
                          >
                            Login
                            <IonIcon icon={logInSharp} slot="end" />
                          </IonButton>
                          <IonButton
                            routerLink="/user/register"
                            type="button"
                            fill="clear"
                            expand="block"
                            routerDirection="forward"
                          >
                            Don't have an account? Sign Up Here
                          </IonButton>
                        </form>
                      </IonCardContent>
                    </IonCard>
                    <IonButton
                      onClick={seeIntroAgain}
                      size="small"
                      type="button"
                      fill="clear"
                      className="ion-margin-top"
                      expand="block"
                    >
                      Watch intro again
                      <IonIcon icon={videocamOutline} slot="end" />
                    </IonButton>
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

