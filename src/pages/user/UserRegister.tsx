
import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
  IonFooter,
  IonText,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonToast,
  IonLoading,
} from '@ionic/react';
import { arrowForward, checkmarkDoneOutline, close, eye, eyeOff, person, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const UserRegister: React.FC = () => {
  const history = useHistory();

  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const progress = currentStep / 3;

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      setShowErrorToast(true);
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!birthdate || !gender) {
      setError('Birthdate and gender are required.');
      setShowErrorToast(true);
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Email, password, and confirm password are required.');
      setShowErrorToast(true);
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setShowErrorToast(true);
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setShowErrorToast(true);
      return false;
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null); // Clear error when going back
    }
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        middleName,
        lastName,
        suffix,
        birthdate,
        gender,
        email,
        role: 'user',
        verificationStatus: 'unverified',
        createdAt: new Date(),
      });

      await sendEmailVerification(user);

      setIsLoading(false);
      setSuccessMessage('Registration successful! A verification email has been sent.');
      setShowSuccessToast(true);
      setTimeout(() => {
        history.push('/user/verify-email');
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use.');
      } else {
        setError('An error occurred during registration.');
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
            <IonButton routerLink="/user/login" routerDirection="back">
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
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
            <IonCardHeader>
              <IonCardTitle>
                <IonItem>Step 1: Your Name</IonItem>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonInput
                  fill="outline"
                  label="First Name"
                  value={firstName}
                  onIonChange={(e) => setFirstName(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                </IonInput>
              </IonItem>
              <IonItem>
                <IonInput
                  fill="outline"
                  label="Middle Name (Optional)"
                  value={middleName}
                  onIonChange={(e) => setMiddleName(e.detail.value!)}
                  className="ion-margin-bottom"
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                </IonInput>
              </IonItem>
              <IonItem>
                <IonInput
                  fill="outline"
                  label="Last Name"
                  value={lastName}
                  onIonChange={(e) => setLastName(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                </IonInput>
              </IonItem>
              <IonItem>
                <IonInput
                  fill="outline"
                  label="Suffix (Optional)"
                  value={suffix}
                  onIonChange={(e) => setSuffix(e.detail.value!)}
                  className="ion-margin-bottom"
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                </IonInput>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 2 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonItem>Step 2: Personal Details</IonItem>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonInput
                  fill="outline"
                  label="Birthdate"
                  type="date"
                  value={birthdate}
                  onIonChange={(e) => setBirthdate(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  fill="outline"
                  label="Gender"
                  value={gender}
                  onIonChange={(e) => setGender(e.detail.value!)}
                  placeholder="Select Gender"
                  className="ion-margin-bottom"
                  required
                >
                  <IonSelectOption value="Male">Male</IonSelectOption>
                  <IonSelectOption value="Female">Female</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 3 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonItem className='ion-margin-bottom'>Step 3: Account Credentials</IonItem>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonInput
                  fill="outline"
                  label="Email"
                  type="email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                />
              </IonItem>
              <IonItem>
                <IonInput
                  fill="outline"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
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
              <IonItem>
                <IonInput
                  fill="outline"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
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
              onClick={nextStep}
              className="ion-margin"
            >
              <IonIcon slot="end" icon={arrowForward} />
              <IonText className='ion-padding-vertical'>Next</IonText>
            </IonButton>
          )}

          {currentStep === 2 && (
            <IonGrid>
              <IonRow>
                <IonCol size="3">
                  <IonButton
                    expand="block"
                    shape="round"
                    fill="outline"
                    onClick={prevStep}
                  >
                    <IonIcon slot="start" icon={arrowBack} />
                    <IonText className='ion-padding-vertical'>Back</IonText>
                  </IonButton>
                </IonCol>
                <IonCol size="9">
                  <IonButton
                    expand="block"
                    shape="round"
                    onClick={nextStep}
                  >
                    <IonIcon slot="end" icon={arrowForward} />
                    <IonText className='ion-padding-vertical'>Next</IonText>
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}

          {currentStep === 3 && (
            <IonGrid>
              <IonRow>
                <IonCol size="3">
                  <IonButton
                    expand="block"
                    shape="round"
                    fill="outline"
                    onClick={prevStep}
                  >
                    <IonIcon slot="start" icon={arrowBack} />
                    <IonText className='ion-padding-vertical'>Back</IonText>
                  </IonButton>
                </IonCol>
                <IonCol size="9">
                  <IonButton
                    color={'success'}
                    expand="block"
                    shape="round"
                    onClick={handleRegister}
                    disabled={isLoading}
                  >
                    <IonText className='ion-padding-vertical'>Register</IonText>
                    <IonIcon slot="end" icon={checkmarkDoneOutline} />
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}
        </IonToolbar>
      </IonFooter>
      <IonLoading
        isOpen={isLoading}
        message="Registering..."
      />
    </IonPage>
  );
};

export default UserRegister;
