import React, { useState, useEffect } from 'react';
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
  IonToast,
  IonLoading,
  IonCardSubtitle,
  IonText,
} from '@ionic/react';
import { checkmarkDoneOutline, eye, eyeOff } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const ResetPassword = () => {
  const history = useHistory();
  const query = useQuery();
  const oobCode = query.get('oobCode');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid password reset link.');
      setShowErrorToast(true);
      return;
    }

    setIsLoading(true);
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setIsCodeVerified(true);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Invalid or expired password reset link.');
        setShowErrorToast(true);
        setIsLoading(false);
      });
  }, [oobCode]);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setShowErrorToast(true);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setShowErrorToast(true);
      return;
    }
    if (!oobCode) {
        setError('Invalid password reset link.');
        setShowErrorToast(true);
        return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsLoading(false);
      setSuccessMessage('Password has been reset successfully. You can now log in with your new password.');
      setShowSuccessToast(true);

      // Create a notification for the password change
      if (auth.currentUser) { // Check if currentUser exists
        await addDoc(collection(db, "notifications"), {
          userId: auth.currentUser.uid,
          title: "Password Changed",
          message: "Your password was successfully changed.",
          type: "password_changed",
          timestamp: new Date(),
          read: false,
          isShown: true,
        });
      }

      setTimeout(() => {
        history.push('/login');
      }, 3000);
    } catch (error: unknown) {
      setIsLoading(false);
      setError('An error occurred. Please try again.');
      setShowErrorToast(true);
      console.error(error);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Reset Password</IonTitle>
        </IonToolbar>
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
        {isCodeVerified ? (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Enter New Password</IonCardTitle>
              <IonCardSubtitle>Please enter a new password for your account.</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItemDivider>New Password *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                >
                  <IonIcon
                    icon={showPassword ? eyeOff : eye}
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </IonInput>
              </IonItem>
              <IonItemDivider>Confirm New Password *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                >
                  <IonIcon
                    icon={showPassword ? eyeOff : eye}
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </IonInput>
              </IonItem>
              <IonButton
                expand="block"
                shape="round"
                onClick={handleResetPassword}
                className="ion-margin-top"
                disabled={isLoading}
              >
                <IonText>Reset Password</IonText>
                <IonIcon slot="end" icon={checkmarkDoneOutline} />
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : (
          <div className="ion-text-center">
            <p>Verifying your password reset link...</p>
          </div>
        )}
      </IonContent>
      <IonLoading isOpen={isLoading} message="Please wait..." />
    </IonPage>
  );
};

export default ResetPassword;
