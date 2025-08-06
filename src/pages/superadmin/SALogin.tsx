import { IonButton, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonPage, IonRow, IonInput, IonIcon, useIonLoading, useIonRouter } from '@ionic/react';
import React, { useState } from 'react';
import { logInSharp, personCircle } from 'ionicons/icons';
import healthcare from '../../assets/healthcare.png';
import { useAuth } from '../../contexts/AuthContext';
import { login, getUserRole } from '../../firebaseConfig';
import { logFailedLogin } from '../../utils/logger';

const SuperAdminLogin: React.FC = () => {
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
        if (role !== 'superadmin') {
          // Log the failed login attempt
          logFailedLogin(email, 'Access denied: User is not a superadmin.');
          setError('Access denied: You are not a superadmin.');
          dismiss();
          return;
        }
        await authLogin(user);
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
      <IonContent className='ion-padding'>
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
                      label="Super Admin E-mail"
                      type='email'
                      placeholder='superadmin@example.com'
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
                      placeholder='superadmin123'
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
