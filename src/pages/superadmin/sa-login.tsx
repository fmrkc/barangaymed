import { IonButton, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonPage, IonRow, IonInput, IonIcon, useIonLoading, useIonRouter, IonCardSubtitle, IonText } from '@ionic/react';
import React, { useState } from 'react';
import { lockClosed, logInSharp, person, personCircle } from 'ionicons/icons';
import healthcare from '../../assets/healthcare.png';
import { useAuth } from '../../contexts/AuthContext';
import { login } from '../../firebaseConfig';
import { logFailedLogin } from '../../utils/logger';

const SuperAdminLogin: React.FC = () => {
  const router = useIonRouter();
  const { login: authLogin } = useAuth(); // Removed userRole from here
  const [present, dismiss] = useIonLoading();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (event: any) => {
    event.preventDefault();
    setError(null);
    await present('Logging in...');
    try {
      const user = await login(email, password);
      if (user) {
        // Before calling authLogin, get the role directly from the authenticated user
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh to get latest claims
        const role = idTokenResult.claims.role as string || null;
        console.log('sa-login: Role obtained from idTokenResult:', role); // ADD THIS LOG

        await authLogin(user); // This will update the AuthContext state

        // Now, check the role obtained directly from the user's claims
        if (role !== 'superadmin') {
          logFailedLogin(email, 'Access denied: User is not a superadmin.');
          setError('Access denied: You are not a superadmin.');
          dismiss();
          return;
        }
        
        dismiss();
        router.push('/superadmin/dashboard', 'forward');
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

  return (
    <IonPage>
      <IonContent>
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
              <div className="ion-text-center">
                <IonText color={'primary'}>
                  <h1>BarangayMed+</h1>
                  <h2>Super Admin Login</h2>
                </IonText>
              </div>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              <IonCard>
                <IonCardContent>
                  <form onSubmit={doLogin}>
                    <IonCardSubtitle>E-mail</IonCardSubtitle>
                    <IonInput
                      mode="md"
                      fill="outline"
                      type="email"
                      placeholder="superadmin@example.com"
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
                      placeholder="superadmin123"
                      value={password}
                      onIonChange={(e) => setPassword(e.detail.value!)}
                       >
                            <IonIcon icon={lockClosed} slot="start" />
                          </IonInput>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <IonButton
                      type="submit"
                      className="ion-padding-vertical"
                      expand="block"
                      shape='round'
                    >
                      Login
                      <IonIcon icon={logInSharp} slot="end" />
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SuperAdminLogin;
