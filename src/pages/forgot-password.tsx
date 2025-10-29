import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonItemDivider,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
  IonFooter,
  IonText,
  IonProgressBar,
  IonToast,
  IonLoading,
  IonCardSubtitle,
} from '@ionic/react';
import { arrowForward, close, mail, checkmarkDoneOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const history = useHistory();

  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const progress = currentStep / 2;

  const validateStep1 = () => {
    if (!email.trim()) {
      setError('Email is required.');
      setShowErrorToast(true);
      return false;
    }
    setError(null);
    return true;
  };

  const handleSendResetEmail = async () => {
    if (!validateStep1()) return;

    setIsLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/reset-password',
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setIsLoading(false);
      setSuccessMessage('A password reset link has been sent to your email.');
      setShowSuccessToast(true);
      setCurrentStep(2);
    } catch (e: unknown) {
      setIsLoading(false);
      const error = e as { code?: string; message: string };
      if (error.code === 'auth/user-not-found') {
        setError('No user found with this email address.');
      } else {
        setError('An error occurred. Please try again.');
      }
      setShowErrorToast(true);
      console.error(error);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton routerLink="/login" routerDirection="back">
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Forgot Password</IonTitle>
        </IonToolbar>
        <IonProgressBar value={progress} />
      </IonHeader>
      <IonContent className="ion-padding">
        <IonToast
          isOpen={showErrorToast}
          onDidDismiss={() => setShowErrorToast(false)}
          message={error || ''}
          duration={3000}
          color="danger"
        />
        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message={successMessage || ''}
          duration={3000}
          color="success"
        />
        {currentStep === 1 && (
          <IonCard>
            <br />
            <IonCardHeader>
              <IonCardTitle>
                Step 1: Enter Your Email
              </IonCardTitle>
              <IonCardSubtitle>
                  Please provide the email address you used to register.
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <br />
              <IonItemDivider>Email *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                  helperText="We'll send a password reset link to this address."
                >
                  <IonIcon slot="start" icon={mail}></IonIcon>
                </IonInput>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 2 && (
          <IonCard>
            <br />
            <IonCardHeader>
              <IonCardTitle>
                Step 2: Check Your Email
              </IonCardTitle>
              <IonCardSubtitle>
                  A password reset link has been sent to your email address. Please check your inbox and follow the instructions.
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent className="ion-text-center">
                <IonIcon icon={checkmarkDoneOutline} size="large" color="success"></IonIcon>
                <p>If you don't see the email, please check your spam folder.</p>
            </IonCardContent>
          </IonCard>
        )}

      </IonContent>
      <IonFooter>
        <IonToolbar>
          {currentStep === 1 && (
            <IonButton
              expand="block"
              shape="round"
              onClick={handleSendResetEmail}
              className="ion-margin"
              disabled={isLoading}
            >
              <IonIcon slot="end" icon={arrowForward} />
              <IonText className='ion-padding-vertical'>Send Reset Link</IonText>
            </IonButton>
          )}

          {currentStep === 2 && (
             <IonButton
                expand="block"
                shape="round"
                onClick={() => history.push('/login')}
                className="ion-margin"
              >
                <IonText className='ion-padding-vertical'>Back to Login</IonText>
              </IonButton>
          )}
        </IonToolbar>
      </IonFooter>
      <IonLoading
        isOpen={isLoading}
        message="Sending reset link..."
      />
    </IonPage>
  );
};

export default ForgotPassword;
