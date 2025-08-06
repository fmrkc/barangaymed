
import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonPage, IonRouterLink, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, useIonToast } from '@ionic/react';
import { checkmarkDoneOutline } from 'ionicons/icons';
import React from 'react';

import { registerUserWithFullData, db } from '../../firebaseConfig';

import Page1 from './UserRegisterSteps/Page1';
import Page2 from './UserRegisterSteps/Page2';
import Page3 from './UserRegisterSteps/Page3';
import Page4 from './UserRegisterSteps/Page4';
import Page5 from './UserRegisterSteps/Page5';
import { addDoc, collection } from 'firebase/firestore';

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
  const [role] = React.useState('user'); // fixed role
  const [barangay, setBarangay] = React.useState(''); // new state for barangay
  const [error, setError] = React.useState<string | null>(null);

  const onChange = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        setFirstName(value);
        break;
      case 'middleName':
        setMiddleName(value);
        break;
      case 'lastName':
        setLastName(value);
        break;
      case 'suffix':
        setSuffix(value);
        break;
      case 'address':
        setAddress(value);
        break;
      case 'contactNumber':
        // Allow empty string or digits only
        if (value === '' || /^\d+$/.test(value)) {
          setContactNumber(value);
        }
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
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
      const user = await registerUserWithFullData(email, password, fullName, role, {
        firstName,
        middleName,
        lastName,
        suffix,
        address,
        contactNumber,
        barangay // include barangay in registration data
      });

      // Log registration event in Firestore
    await addDoc(collection(db, 'logs'), {
      event: "UserRegistration",
      status: "success",
      email,
      fullName,
      role,
      barangay,
      timestamp: new Date()
    });

      console.log(JSON.stringify({
        event: "UserRegistration",
        status: "success",
        email,
        fullName,
        role,
        timestamp: new Date().toISOString()
      }));
      dismiss();
      presentToast({
        message: 'Account created successfully! Please login with your credentials.',
        duration: 2000,
        color: 'success',
        icon: checkmarkDoneOutline,
        position: 'top'
      });
      router.push('/user/login', 'forward');
    } catch (err) {
      console.log(JSON.stringify({
        event: "UserRegistration",
        status: "failure",
        email,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      }));
      dismiss();
      setError('Registration failed. Please try again.');
    }
  };

  // Validation functions
  const isValidContactNumber = (number: string) => {
    // Validate that the contact number is exactly 11 digits
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(number);
  };

  const isValidAddress = (addr: string) => {
    // Basic check: non-empty and at least 5 characters
    return addr.trim().length >= 5;
  };

  const isValidBarangay = (brgy: string) => {
    // Basic check: non-empty and only letters, numbers, spaces allowed
    const barangayRegex = /^[a-zA-Z0-9\\s]+$/;
    return barangayRegex.test(brgy) && brgy.trim().length > 0;
  };

  const validateStep = (currentStep: number): string | null => {
    switch (currentStep) {
      case 1:
        if (!firstName.trim()) return 'First name is required.';
        if (!lastName.trim()) return 'Last name is required.';
        // middleName and suffix are optional
        break;
      case 2:
        if (!address.trim()) return 'Address is required.';
        if (!isValidAddress(address)) return 'Address format is invalid.';
        if (!contactNumber.trim()) return 'Contact number is required.';
        if (!isValidContactNumber(contactNumber)) return 'Contact number format is invalid.';
        break;
      case 3:
        if (!barangay.trim()) return 'Barangay is required.';
        if (!isValidBarangay(barangay)) return 'Barangay format is invalid.';
        break;
      case 4:
        if (!email.trim()) return 'Email is required.';
        if (!password.trim()) return 'Password is required.';
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
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={false}>
        <IonGrid fixed>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
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