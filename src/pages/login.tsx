import { 
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonIcon, IonInput, IonPage, 
  IonRow, IonText, IonTitle, useIonLoading, useIonRouter 
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { logIn, person, eye, eyeOff, help } from 'ionicons/icons';
import healthcare from '../assets/healthcare.png';
import Intro from '../components/Intro';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from '../contexts/AuthContext';
import { login, auth } from '../firebaseConfig';
import { logFailedLogin } from '../utils/logger';
import { sendEmailVerification, signOut } from 'firebase/auth';

const INTR0_KEY = 'intro-seen';

const Login: React.FC = () => {
  const router = useIonRouter();
  const { login: authLogin, userRole } = useAuth();
  const [introSeen, setIntroSeen] = useState(true);
  const [present, dismiss] = useIonLoading();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkStorage = async () => {
      const seen = await Preferences.get({ key: INTR0_KEY });
      setIntroSeen(seen.value === 'true');
    };
    checkStorage();
  }, []);

  const doLogin = async (event: any) => {
    event.preventDefault();
    setError(null);
    await present('Logging in...');

    try {
      const user = await login(email, password);
      if (user) {
        // Check email verification
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          await signOut(auth);
          dismiss();
          setError('Your email is not verified. We have sent you a new verification email. Please check your inbox.');
          return;
        }

        // Let AuthContext handle claims & Firestore role resolution
        await authLogin(user);
        dismiss();

        // Redirect based on userRole from context
        if (userRole === 'user') {
          router.push('/user/dashboard', 'forward');
        } else if (userRole === 'admin') {
          router.push('/admin/dashboard', 'forward');
        } else if (userRole === 'superadmin') {
          router.push('/superadmin/dashboard', 'forward');
        } else {
          logFailedLogin(email, 'Access denied: Invalid role or no role assigned.');
          setError('Access denied: Invalid role or no role assigned.');
        }
      } else {
        logFailedLogin(email, 'Login failed. Please check your email/password.');
        dismiss();
        setError('Login failed. Please check your email/password.');
      }
    } catch (err: any) {
      logFailedLogin(email, err.message || 'Unknown error');
      dismiss();
      setError('Login failed. Please check your email/password.');
    }
  };

  const finishIntro = async () => {
    setIntroSeen(true);
    Preferences.set({ key: INTR0_KEY, value: 'true' });
  };

  const seeIntroAgain = () => {
    setIntroSeen(false);
    Preferences.remove({ key: INTR0_KEY });
  };

  useEffect(() => {
    document.title = 'BarangayMed+';
  }, []);

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
                minHeight: "90vh",
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
                      <IonCardTitle className="ion-padding-top">
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
                          type={showPassword ? "text" : "password"}
                          placeholder="juan123"
                          value={password}
                          onIonChange={(e) => setPassword(e.detail.value!)}
                        >
                          <IonIcon
                            icon={showPassword ? eyeOff : eye}
                            slot="end"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: "pointer" }}
                          />
                        </IonInput>
                        <IonButton
                          routerLink="/forgot-password"
                          type="button"
                          fill="clear"
                          expand="block"
                          routerDirection="forward"
                        >
                          Forgot Password?
                        </IonButton>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        <IonButton
                          type="submit"
                          className="ion-padding-vertical"
                          expand="block"
                          routerDirection="forward"
                          shape="round"
                        >
                          Login
                          <IonIcon icon={logIn} slot="end" />
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
                </IonCol>
              </IonRow>
            </IonGrid>
            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton onClick={seeIntroAgain}>
                <IonIcon icon={help} />
              </IonFabButton>
            </IonFab>
          </IonContent>
        </IonPage>
      )}
    </>
  );
};

export default Login;