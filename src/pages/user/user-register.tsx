import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonPage, IonRouterLink, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, useIonToast } from '@ionic/react';
import { checkmarkDoneOutline } from 'ionicons/icons';
import React from 'react';

import { registerUserWithFullData } from '../../firebaseConfig';
import { sendEmailVerification } from 'firebase/auth';

import Page1 from './UserRegisterSteps/Page1';
import Page2 from './UserRegisterSteps/Page2';
import Page3 from './UserRegisterSteps/Page3';
import Page4 from './UserRegisterSteps/Page4';
import Page5 from './UserRegisterSteps/Page5';
import { LogService } from '../../services/logService';
import { BARANGAYS } from '../../constants/barangays';

const UserRegister: React.FC = () => {
  const router = useIonRouter();
  const [present, dismiss] = useIonLoading();
  const [presentToast] = useIonToast();

  const [step, setStep] = React.useState(1);

  const [firstName, setFirstName] = React.useState('');
  const [middleName, setMiddleName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [suffix, setSuffix] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [contactNumber, setContactNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role] = React.useState('user'); // fixed role
  const [barangay, setBarangay] = React.useState(''); // new state for barangay
  const [error, setError] = React.useState<string | null>(null);

  const onChange = (field: string, value: string) => {
    // Basic XSS protection
    const sanitizedValue = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    switch (field) {
      case 'firstName':
        setFirstName(sanitizedValue);
        break;
      case 'middleName':
        setMiddleName(sanitizedValue);
        break;
      case 'lastName':
        setLastName(sanitizedValue);
        break;
      case 'suffix':
        setSuffix(sanitizedValue);
        break;
      case 'address':
        setAddress(sanitizedValue);
        break;
      case 'contactNumber':
        // Allow the formatted phone number from maskito
        setContactNumber(sanitizedValue);
        break;
      case 'email':
        setEmail(sanitizedValue);
        break;
      case 'password':
        setPassword(value); // Don't sanitize password to allow special characters
        break;
      case 'confirmPassword':
        setConfirmPassword(value); // Don't sanitize password
        break;
      default:
        break;
    }
  };

  const doRegister = async () => {
    setError(null);
    const errorMsg = validateStep(step);
    if (errorMsg) {
      setError(errorMsg);
      presentToast({
        message: errorMsg,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      return;
    }
    await present('Creating account...');
    try {
      const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ');
      const userCredential = await registerUserWithFullData(email, password, fullName, 'user', {
        firstName,
        middleName,
        lastName,
        suffix,
        address,
        contactNumber,
        barangay // include barangay in registration data
      });

      await sendEmailVerification(userCredential);

      console.log(JSON.stringify({
        event: "UserRegistration",
        status: "success",
        email,
        fullName,
        role: 'user',
        timestamp: new Date().toISOString()
      }));
      dismiss();
      // Redirect to login page after successful registration and logging
      presentToast({
        message: 'Account created! Please check your email to verify your account and then login.',
        duration: 5000,
        color: 'success',
        icon: checkmarkDoneOutline,
        position: 'top'
      });
      router.push('/user/verify-email', 'forward');
    } catch (err: any) {
      console.log(JSON.stringify({
        event: "UserRegistration",
        status: "failure",
        email,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      }));
      dismiss();
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use. Please use a different email.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  // Validation functions
  const isValidContactNumber = (number: string) => {
    const digitsOnly = number.replace(/\D/g, '');
    if (digitsOnly.startsWith('63')) {
      return /^\d{12}$/.test(digitsOnly);
    }
    if (digitsOnly.startsWith('0')) {
        return /^\d{11}$/.test(digitsOnly);
    }
    return /^\d{10}$/.test(digitsOnly);
  };

  const isValidAddress = (addr: string) => {
    // Basic check: non-empty and at least 5 characters
    return addr.trim().length >= 5;
  };

  const isValidBarangay = (brgy: string) => {
    return BARANGAYS.includes(brgy as any);
  };

  const isStrongPassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
  };

  const validateStep = (currentStep: number): string | null => {
    switch (currentStep) {
      case 1:
        if (!firstName.trim()) return 'First name is required.';
        if (!lastName.trim()) return 'Last name is required.';
        break;
      case 2:
        if (!address.trim()) return 'Address is required.';
        if (!isValidAddress(address)) return 'Address must be at least 5 characters long.';
        if (!contactNumber.trim()) return 'Contact number is required.';
        if (!isValidContactNumber(contactNumber)) return 'Please enter a valid Philippine contact number.';
        break;
      case 3:
        if (!barangay.trim()) return 'Barangay is required.';
        if (!isValidBarangay(barangay)) return 'Please select a valid barangay from the list.';
        break;
      case 4:
        if (!email.trim()) return 'Email is required.';
        if (!password) return 'Password is required.';
        if (!isStrongPassword(password)) return 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.';
        if (password !== confirmPassword) return 'Passwords do not match.';
        break;
      case 5:
        // Final step, no additional validation here
        break;
      default:
        break;
    }
    return null;
  };

    const onNext = () => {
    const errorMsg = validateStep(step);
    console.log(`Current Step: ${step}`); // Debugging log
    console.log(`First Name: ${firstName}, Last Name: ${lastName}, Address: ${address}, Contact Number: ${contactNumber}, Email: ${email}`); // Log field values
    console.log(`Validation Error: ${errorMsg}`); // Log validation error
    if (errorMsg) {
      setError(errorMsg);
      presentToast({
        message: errorMsg,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      return;
    }
    setError(null);
    setStep(prev => Math.min(prev + 1, 5));
  };

  const onBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" color={'primary'}  />
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={false}>
        <IonGrid fixed>
          <IonRow className="ion-justify-content-center">
            <IonCol >
              <IonCard>
                <IonCardContent>
                  {step === 1 && (
                    <Page1
                      firstName={firstName}
                      middleName={middleName}
                      lastName={lastName}
                      suffix={suffix}
                      onChange={onChange}
                      onNext={onNext}
                    />
                  )}
                  {step === 2 && (
                    <Page2
                      address={address}
                      contactNumber={contactNumber}
                      onChange={onChange}
                      onNext={onNext}
                      onBack={onBack}
                    />
                  )}
                  {step === 3 && (
                    <Page3
                      barangay={barangay}
                      onBarangayChange={setBarangay}
                      onNext={onNext}
                      onBack={onBack}
                    />
                  )}
                  {step === 4 && (
                    <Page4
                      email={email}
                      password={password}
                      confirmPassword={confirmPassword}
                      onChange={onChange}
                      onNext={onNext}
                      onBack={onBack}
                    />
                  )}
                  {step === 5 && (
                    <Page5
                      firstName={firstName}
                      middleName={middleName}
                      lastName={lastName}
                      suffix={suffix}
                      address={address}
                      contactNumber={contactNumber}
                      email={email}
                      password={password}
                      barangay={barangay} // pass barangay to summary page
                      onBack={onBack}
                      onSubmit={doRegister}
                      error={error} loading={false}                    />
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default UserRegister;
