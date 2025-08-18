import { IonButton, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonPage, IonRow, IonInput, IonIcon, useIonLoading, useIonRouter, IonCardSubtitle, IonText } from '@ionic/react';
import React, { useState } from 'react';
import { lockClosed, logInSharp, person, personCircle } from 'ionicons/icons';
import healthcare from '../../assets/healthcare.png';
import { useAuth } from '../../contexts/AuthContext';
import { login, getUserRole } from '../../firebaseConfig';
import { logFailedLogin } from '../../utils/logger';

const AdminLogin: React.FC = () => {
  const router = useIonRouter();
  const { login: authLogin } = useAuth();
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
        const role = await getUserRole(user.uid);
        if (role !== 'admin') {
          logFailedLogin(email, 'Access denied: User is not an admin.');
          setError('Access denied: You are not an admin.');
          dismiss();
          return;
        }
        await authLogin(user);
        dismiss();
        router.push('/admin/dashboard', 'forward');
      } else {
        logFailedLogin(email, 'Login failed. Please check your credentials.');
        dismiss();
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      // Log the failed login attempt
      logFailedLogin(email, err.message || 'Unknown error');
      dismiss();
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
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
                  <h2>Admin Login</h2>
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
                      placeholder="admin@example.com"
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
                      placeholder="admin123"
                      value={password}
                      onIonChange={(e) => setPassword(e.detail.value!)}
                       >
                                                <IonIcon icon={lockClosed} slot="start" />
                                              </IonInput>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <IonButton
                    shape='round'
                      type="submit"
                      className="ion-padding-vertical"
                      expand="block"
                    >
                      Login
                      <IonIcon icon={logInSharp} slot="end" />
                    </IonButton>
                    <IonButton
                    fill='clear'
                    expand='block'
                    >
                      Forgot Password?
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

export default AdminLogin;
