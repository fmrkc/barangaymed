import { IonButton, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonPage, IonRow, IonInput, IonIcon, useIonLoading, useIonRouter, IonCardSubtitle, IonText } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { lockClosed, person } from 'ionicons/icons';
import healthcare from '../../assets/healthcare.png';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

const RegisterInvited: React.FC = () => {
  const router = useIonRouter();
  const [present, dismiss] = useIonLoading();

  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [barangayId, setBarangayId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = queryParams.get('token');
    setToken(tokenFromUrl);

    const validateInvitation = async () => {
      if (!tokenFromUrl) {
        setError('Invitation token missing.');
        setLoadingInvitation(false);
        return;
      }

      try {
        await present('Validating invitation...');
        const validateInvitationFunction = httpsCallable(functions, 'validateInvitation');
        const result = await validateInvitationFunction({ token: tokenFromUrl });
        const data = result.data as { success: boolean; message?: string; email?: string; role?: string; barangayId?: string };

        if (data.success && data.email && data.role) {
          setEmail(data.email);
          setRole(data.role);
          setBarangayId(data.barangayId || null);
          setError(null);
        } else {
          setError(data.message || 'Invalid or expired invitation.');
        }
      } catch (err: any) {
        console.error('Error validating invitation:', err);
        setError(err.message || 'Failed to validate invitation.');
      } finally {
        dismiss();
        setLoadingInvitation(false);
      }
    };

    validateInvitation();
  }, [present, dismiss]);

  const doRegister = async (event: any) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token || !email || !role) {
      setError('Missing invitation details. Please refresh the page or try again.');
      return;
    }

    await present('Registering...');
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Call Cloud Function to set custom claims and finalize registration
      const completeRegistrationFunction = httpsCallable(functions, 'completeInvitationRegistration');
      const result = await completeRegistrationFunction({
        uid: user.uid,
        token: token,
      });

      const data = result.data as { success: boolean; message?: string };
      if (data.success) {
        dismiss();
        // Redirect based on role or to a success page
        if (role === 'superadmin') {
          router.push('/superadmin/dashboard', 'forward');
        } else if (role === 'admin') {
          router.push('/admin/dashboard', 'forward');
        } else {
          router.push('/user/login', 'forward'); // Fallback
        }
      } else {
        // If custom claims failed, delete the user to prevent orphaned accounts
        await user.delete();
        dismiss();
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error during registration:', err);
      dismiss();
      setError(err.message || 'Registration failed.');
    }
  };

  if (loadingInvitation) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonText>Loading invitation...</IonText>
        </IonContent>
      </IonPage>
    );
  }

  if (error && !loadingInvitation && !email) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonText color="danger"><h1>{error}</h1></IonText>
        </IonContent>
      </IonPage>
    );
  }

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
                  <h2>Register Account</h2>
                </IonText>
              </div>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              <IonCard>
                <IonCardContent>
                  <form onSubmit={doRegister}>
                    <IonCardSubtitle>Email</IonCardSubtitle>
                    <IonInput
                      mode="md"
                      fill="outline"
                      type="email"
                      value={email}
                      disabled={true} // Email is pre-filled and not editable
                    >
                      <IonIcon icon={person} slot="start" />
                    </IonInput>
                    <IonCardSubtitle className='ion-margin-top'>Password</IonCardSubtitle>
                    <IonInput
                      mode="md"
                      fill="outline"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onIonChange={(e) => setPassword(e.detail.value!)}
                    >
                      <IonIcon icon={lockClosed} slot="start" />
                    </IonInput>
                    <IonCardSubtitle className='ion-margin-top'>Confirm Password</IonCardSubtitle>
                    <IonInput
                      mode="md"
                      fill="outline"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onIonChange={(e) => setConfirmPassword(e.detail.value!)}
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
                      Register
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

export default RegisterInvited;
