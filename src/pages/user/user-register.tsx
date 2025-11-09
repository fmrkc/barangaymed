
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
  IonItemDivider,
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
  IonCardSubtitle,
  IonCheckbox,
  IonLabel,
} from '@ionic/react';
import { arrowForward, checkmarkDoneOutline, close, eye, eyeOff, person, arrowBack, mail, lockClosed } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const UserRegister: React.FC = () => {
  const history = useHistory();

  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  const progress = currentStep / 4;

  const validateStep1 = () => {
    if (!termsAccepted) {
      setError('You must accept the terms and conditions to continue.');
      setShowErrorToast(true);
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      setShowErrorToast(true);
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (!birthdate || !gender) {
      setError('Birthdate and gender are required.');
      setShowErrorToast(true);
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep4 = () => {
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
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
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null); // Clear error when going back
    }
  };

  const handleRegister = async () => {
    if (!validateStep4()) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const name = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        middleName,
        lastName,
        suffix,
        name,
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
          <IonTitle>Create New Account</IonTitle>
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
              <IonCardTitle>Step 1: Terms and Conditions</IonCardTitle>
              <IonCardSubtitle>Please read and accept the terms and conditions to proceed.</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <p style={{'maxHeight': '200px', 'overflowY': 'auto', 'border': '1px solid #ccc', 'padding': '10px'}}>
                <strong>Terms and Conditions for BarangayMed</strong><br/><br/>
                <strong>1. Acceptance of Terms</strong><br/>
                By using BarangayMed, you agree to these Terms and Conditions. If you do not agree, do not use the app.<br/><br/>
                <strong>2. Services</strong><br/>
                BarangayMed provides a platform for residents to request medicine, schedule teleconsultations, and receive health announcements from their local barangay health unit.<br/><br/>
                <strong>3. User Accounts</strong><br/>
                You must provide accurate information when creating your account. You are responsible for maintaining the confidentiality of your account and password.<br/><br/>
                <strong>4. Data Privacy</strong><br/>
                We collect and use your personal and health information in accordance with our Privacy Policy. By using the app, you consent to such collection and use.<br/><br/>
                <strong>5. User Conduct</strong><br/>
                You agree not to use the app for any unlawful purpose or to harass, abuse, or harm another person.<br/><br/>
                <strong>6. Disclaimer</strong><br/>
                BarangayMed is a tool to facilitate communication and is not a substitute for professional medical advice. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.<br/><br/>
                <strong>7. Limitation of Liability</strong><br/>
                BarangayMed is not liable for any damages arising from your use of the app.<br/><br/>
                <strong>8. Changes to Terms</strong><br/>
                We may modify these Terms at any time. Your continued use of the app after changes constitutes your acceptance of the new Terms.
              </p>
              <IonItem lines="none">
                <IonCheckbox checked={termsAccepted} onIonChange={e => setTermsAccepted(e.detail.checked)} slot="start"></IonCheckbox>
                <IonLabel>I have read and agree to the terms and conditions.</IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 2 && (
          <IonCard>
            <br />
            <IonCardHeader>
              <IonCardTitle>
                Step 2: Your Name
              </IonCardTitle>
              <IonCardSubtitle>
                  Please provide your full name. Middle Name and Suffix can be left out if not applicable.
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <br />
              <IonItemDivider>First Name *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  placeholder="Enter your first name"
                  value={firstName}
                  onIonChange={(e) => setFirstName(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                  maxlength={50}
                  counter={true}
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                </IonInput>
              </IonItem>
              <IonItemDivider>Middle Name (Optional)</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  placeholder="Enter your middle name (optional)"
                  value={middleName}
                  onIonChange={(e) => setMiddleName(e.detail.value!)}
                  className="ion-margin-bottom"
                  maxlength={50}
                  counter={true}
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                </IonInput>
              </IonItem>
              <IonItemDivider>Last Name *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  placeholder="Enter your last name"
                  value={lastName}
                  onIonChange={(e) => setLastName(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                  maxlength={50}
                  counter={true}
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                </IonInput>
              </IonItem>
              <IonItemDivider>Suffix (Optional)</IonItemDivider>
              <IonItem>
                <IonSelect
                  fill="outline"
                  placeholder="e.g. Jr., Sr. (optional)"
                  value={suffix}
                  onIonChange={(e) => setSuffix(e.detail.value!)}
                  className="ion-margin-bottom"
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                  <IonSelectOption value="">None</IonSelectOption>
                  <IonSelectOption value="Jr.">Jr.</IonSelectOption>
                  <IonSelectOption value="Sr.">Sr.</IonSelectOption>
                  <IonSelectOption value="I">I</IonSelectOption>
                  <IonSelectOption value="II">II</IonSelectOption>
                  <IonSelectOption value="III">III</IonSelectOption>
                  <IonSelectOption value="IV">IV</IonSelectOption>
                  <IonSelectOption value="V">V</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 3 && (
          <IonCard>
            <br />
            <IonCardHeader>
              <IonCardTitle>
                Step 3: Personal Details
              </IonCardTitle>
              <IonCardSubtitle>
                  Please provide your birthdate and gender.
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <br />
              <IonItemDivider>Birthdate *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  type="date"
                  placeholder="Select your birthdate"
                  value={birthdate}
                  max={new Date().toISOString().split('T')[0]}
                  onIonChange={(e) => setBirthdate(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                />
                
              </IonItem>
              <IonItemDivider>Gender *</IonItemDivider>
              <IonItem>
                <IonSelect
                  fill="outline"
                  value={gender}
                  onIonChange={(e) => setGender(e.detail.value!)}
                  placeholder="Select Gender"
                  className="ion-margin-bottom"
                  required
                >
                  <IonIcon slot="start" icon={person}></IonIcon>
                  <IonSelectOption value="Male">Male</IonSelectOption>
                  <IonSelectOption value="Female">Female</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 4 && (
          <IonCard>
            <br />
            <IonCardHeader>
              <IonCardTitle>
                Step 4: Account Credentials
              </IonCardTitle>
              <IonCardSubtitle>
                  Please provide a valid email address and create a secure password.
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
                  helperText="Please enter a valid email address. We'll send a verification email to this address."
                >
                  <IonIcon slot="start" icon={mail}></IonIcon>
                </IonInput>
              </IonItem>
              <IonItemDivider>Password *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                  helperText="Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character."
                >

                  <IonIcon
                    icon={showPassword ? eyeOff : eye}
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer' }}
                  />
                </IonInput>
              </IonItem>
              <IonItemDivider>Confirm Password *</IonItemDivider>
              <IonItem>
                <IonInput
                  fill="outline"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                  className="ion-margin-bottom"
                  required
                  helperText="Re-enter your password to confirm."
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
              disabled={!termsAccepted}
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
                    disabled={!firstName.trim() || !lastName.trim()}
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
                    expand="block"
                    shape="round"
                    onClick={nextStep}
                    disabled={!birthdate || !gender}
                  >
                    <IonIcon slot="end" icon={arrowForward} />
                    <IonText className='ion-padding-vertical'>Next</IonText>
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}

          {currentStep === 4 && (
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
                    disabled={isLoading || !email.trim() || !password.trim() || !confirmPassword.trim()}
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
