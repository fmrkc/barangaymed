
import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  useIonToast,
  IonIcon,
  IonFooter,
  IonAlert,
  IonButtons,
} from '@ionic/react';
import { useAuth } from '../../../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../../../firebaseConfig';
import { useHistory } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { checkmarkDone, refresh, logOut } from 'ionicons/icons';

const UserVerifyEmail: React.FC = () => {
  const { currentUser, refreshUserClaims, logout } = useAuth();
  const [presentToast] = useIonToast();
  const history = useHistory();

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/user/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        message: 'Email successfully verified! You can now log in.',
        duration: 3000,
        color: 'success',
      });
      history.push('/user/login'); // Redirect to login page
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
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Verify Your Email</IonTitle>
          <IonButtons slot="end">
            <IonButton id="logout-confirm">
              <IonIcon slot="icon-only" icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1><IonText color={'primary'}>Account Created!</IonText></h1>
        <IonText>
          <p>
            A verification email has been sent to your email address. Please check your inbox (and spam folder) and click the link to verify your account.
          </p>
          <p>
            Once verified, click the "I have verified my email" button below.
          </p>
        </IonText>
        <IonButton expand="block" onClick={handleResendVerification} className="ion-margin-top" fill="outline">
          <IonText className='ion-padding-vertical'>Resend Verification Email</IonText>
          <IonIcon slot='start' icon={refresh}></IonIcon>
        </IonButton>
        
      </IonContent>
      <IonFooter className='ion-no-border'>
        <IonToolbar>
          <IonButton expand="block" onClick={handleRefreshStatus} className="ion-margin-top">
            <IonText className='ion-padding-vertical'>I have verified my email</IonText>
            <IonIcon slot='start' icon={checkmarkDone}></IonIcon>
          </IonButton>
        </IonToolbar>
      </IonFooter>
      <IonAlert
        trigger="logout-confirm"
        header="Are you sure?"
        message="Do you really want to log out?"
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: () => {
              console.log("Alert canceled");
            },
          },
          {
            text: "OK",
            role: "confirm",
            handler: () => {
              handleLogout();
            },
          },
        ]}
        onDidDismiss={({ detail }) =>
          console.log(`Dismissed with role: ${detail.role}`)
        }
      ></IonAlert>
    </IonPage>
  );
};

export default UserVerifyEmail;
