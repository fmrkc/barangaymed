import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, useIonToast } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useHistory } from 'react-router-dom';

const UserVerifyEmail: React.FC = () => {
  const { currentUser, refreshUserClaims } = useAuth();
  const [presentToast] = useIonToast();
  const history = useHistory();

  const handleResendVerification = async () => {
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
        presentToast({
          message: 'Verification email sent! Please check your inbox.',
          duration: 3000,
          color: 'success',
        });
      } catch (error) {
        console.error('Error resending verification email:', error);
        presentToast({
          message: 'Failed to send verification email. Please try again later.',
          duration: 3000,
          color: 'danger',
        });
      }
    }
  };

  const handleRefreshStatus = async () => {
    await refreshUserClaims(); // This will reload the user and update emailVerified status in AuthContext

    // Get the latest user object directly from Firebase Auth
    const latestUser = auth.currentUser;

    if (latestUser?.emailVerified) {
      presentToast({
        message: 'Email successfully verified!',
        duration: 3000,
        color: 'success',
      });
      history.push('/user/login'); // Redirect to dashboard or appropriate page
    } else {
      presentToast({
        message: 'Email not yet verified. Please check your inbox.',
        duration: 3000,
        color: 'warning',
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verify Your Email</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <p>
            A verification email has been sent to your email address. Please check your inbox (and spam folder) and click the link to verify your account.
          </p>
          <p>
            Once verified, click the "I have verified my email" button below.
          </p>
        </IonText>
        <IonButton expand="block" onClick={handleResendVerification} className="ion-margin-top">
          Resend Verification Email
        </IonButton>
        <IonButton expand="block" onClick={handleRefreshStatus} className="ion-margin-top" fill="outline">
          I have verified my email
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default UserVerifyEmail;
