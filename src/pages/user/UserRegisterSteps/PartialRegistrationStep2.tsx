import React, { useState } from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText, IonCardSubtitle, IonCardTitle, IonIcon } from '@ionic/react';
import { arrowBack, arrowForward, lockClosed, mail, eye, eyeOff } from 'ionicons/icons';

interface Page4Props {
  email: string;
  password: string;
  confirmPassword?: string; // Make it optional to avoid breaking changes if not passed
  onChange: (field: string, value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  error: string | null;
}

const Page4: React.FC<Page4Props> = ({ email, password, confirmPassword, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>(undefined);

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(undefined);
    }
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      setPasswordError('Password is required');
    } else if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
      setPasswordError('Password must include uppercase, lowercase, number, and special character');
    } else {
      setPasswordError(undefined);
    }
  };

  const validateConfirmPassword = (value: string) => {
    if (!value.trim()) {
      setConfirmPasswordError('Confirm password is required');
    } else if (value !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError(undefined);
    }
  };

  const handleEmailChange = (value: string) => {
    onChange('email', value);
    validateEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    onChange('password', value);
    validatePassword(value);
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    onChange('confirmPassword', value);
    validateConfirmPassword(value);
  };

  return (
    <>
    <IonCardTitle className="ion-padding-vertical">
        Step 2: Enter your account details.
      </IonCardTitle>
      
      <div className="ion-margin-top">
        <IonCardSubtitle>Email *</IonCardSubtitle>
        <IonInput
          fill="outline"
          placeholder="juandelacruz@example.com"
          type="email"
          value={email}
          onIonChange={e => handleEmailChange(e.detail.value!)}
          helperText="Enter a valid email address"
          errorText={emailError}
          autocomplete="email"
        >
          <IonIcon slot="start" icon={mail}></IonIcon>
        </IonInput>
      </div>
      
      <div className="ion-margin-top">
        <IonCardSubtitle>Password *</IonCardSubtitle>
        <IonInput
          fill="outline"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onIonChange={e => handlePasswordChange(e.detail.value!)}
          helperText="Password must be at least 8 characters, include uppercase, lowercase, number, and special character"
          errorText={passwordError}
          autocomplete="new-password"
        >

          <IonIcon
            icon={showPassword ? eyeOff : eye}
            slot="end"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: "pointer" }}
          />
        </IonInput>
      </div>

      <div className='ion-margin-top'>
        <IonCardSubtitle>Confirm Password *</IonCardSubtitle>
        <IonInput
          fill="outline"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onIonChange={e => handleConfirmPasswordChange(e.detail.value!)}
          helperText="Re-enter your password to confirm"
          errorText={confirmPasswordError}
          autocomplete="new-password"
        >

          <IonIcon
            icon={showPassword ? eyeOff : eye}
            slot="end"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: "pointer" }}
          />
        </IonInput>
      </div>
     
      
    </>
  );
};

export default Page4;
