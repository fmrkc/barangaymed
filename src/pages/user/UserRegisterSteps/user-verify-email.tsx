import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, useIonToast, IonFooter, IonIcon } from '@ionic/react';
import { useAuth } from '../../../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useHistory } from 'react-router-dom';
import { arrowBack, arrowForward, backspaceOutline, checkmark, refresh } from 'ionicons/icons';

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
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Verify Your Email</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1><IonText color={'primary'}><IonIcon icon={checkmark} /> Account Created!</IonText></h1>
        <IonText>
          <p>
            Your account has been successfully created!
          </p>
          <p>
            A verification email has been sent to your email address. Please check your inbox (and spam folder) and click the link to verify your account.
          </p>
          <p>
            Once verified, click the "Return to Login" button below.
          </p>
        </IonText>
        <IonButton expand="block" onClick={handleResendVerification} className="ion-margin-top" fill="outline">
          <IonText className='ion-padding-vertical'>Resend Verification Email</IonText>
          <IonIcon slot='start' icon={refresh}></IonIcon>
        </IonButton>
        
      </IonContent>
      <IonFooter className='ion-no-border'>
        <IonToolbar>
          <IonButton expand="block" routerLink="/user/login" routerDirection="back" className="ion-margin-top" >
          <IonText className='ion-padding-vertical'>Return to Login</IonText>
          <IonIcon slot='start' icon={arrowBack}></IonIcon>
        </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default UserVerifyEmail;
