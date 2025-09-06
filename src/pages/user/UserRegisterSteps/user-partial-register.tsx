import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonPage, IonRouterLink, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, useIonToast, IonText, IonProgressBar } from '@ionic/react';
import { checkmarkDoneOutline, chevronBack, chevronForward, close } from 'ionicons/icons';
import React, { useEffect } from 'react';

import { registerUserWithFullData } from '../../../firebaseConfig';
import { sendEmailVerification } from 'firebase/auth';

import PartialRegistrationStep1 from './PartialRegistrationStep1';
import PartialRegistrationStep2 from './PartialRegistrationStep2';
import FullRegistrationStep1 from './FullRegistrationStep1';
import FullRegistrationStep2 from './FullRegistrationStep2';
import RegistrationReview from './RegistrationReview';
import { LogService } from '../../../services/logService';

const UserRegister: React.FC = () => {
  const router = useIonRouter();
  const [present, dismiss] = useIonLoading();
  const [presentToast] = useIonToast();

  const [step, setStep] = React.useState(1);
  const [registrationPhase, setRegistrationPhase] = React.useState<'partial' | 'full'>('partial');

  const [firstName, setFirstName] = React.useState('');
  const [middleName, setMiddleName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [suffix, setSuffix] = React.useState('');
  const [birthdate, setBirthdate] = React.useState(new Date().toISOString());
  const [lotBlkHouseNo, setLotBlkHouseNo] = React.useState('');
  const [streetName, setStreetName] = React.useState('');
  const [subdivisionVillageZonePurok, setSubdivisionVillageZonePurok] = React.useState('');
  const [zipCode, setZipCode] = React.useState('');
  const [contactNumber, setContactNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role] = React.useState('user'); // fixed role
  const [barangayId, setBarangay] = React.useState(''); // new state for barangay
  const [selectedRegion, setSelectedRegion] = React.useState('');
  const [selectedProvince, setSelectedProvince] = React.useState('');
  const [selectedCityMunicipality, setSelectedCityMunicipality] = React.useState('');
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
      case 'lotBlkHouseNo':
        setLotBlkHouseNo(sanitizedValue);
        break;
      case 'streetName':
        setStreetName(sanitizedValue);
        break;
      case 'subdivisionVillageZonePurok':
        setSubdivisionVillageZonePurok(sanitizedValue);
        break;
      case 'contactNumber':
        // Allow the formatted phone number from maskito
        setContactNumber(sanitizedValue);
        break;
      case 'birthdate':
        setBirthdate(sanitizedValue);
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
      case 'selectedRegion':
        setSelectedRegion(sanitizedValue);
        setSelectedProvince(''); // Reset province and city/municipality when region changes
        setSelectedCityMunicipality('');
        break;
      case 'selectedProvince':
        setSelectedProvince(sanitizedValue);
        setSelectedCityMunicipality(''); // Reset city/municipality when province changes
        break;
      case 'selectedCityMunicipality':
        setSelectedCityMunicipality(sanitizedValue);
        break;
      default:
        break;
    }
  };

  const onAddressChange = (brgyCode: string, zip: string) => {
    setBarangay(brgyCode);
    setZipCode(zip);
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
        birthdate,
        lotBlkHouseNo,
        streetName,
        subdivisionVillageZonePurok,
        zipCode,
        contactNumber,
        barangayId, // include barangay in registration data
        selectedRegion,
        selectedProvince,
        selectedCityMunicipality,
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

  const isValidZipCode = (zip: string) => {
    // Basic check: non-empty and 4 digits
    return /^\d{4}$/.test(zip);
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
        if (!birthdate.trim()) return 'Birthdate is required.';
        break;
      case 2:
        if (!selectedRegion) return 'Region is required.';
        if (!selectedProvince) return 'Province is required.';
        if (!selectedCityMunicipality) return 'City/Municipality is required.';
        if (!streetName.trim()) return 'Street Name is required.';
        if (!contactNumber.trim()) return 'Contact number is required.';
        if (!isValidContactNumber(contactNumber)) return 'Please enter a valid Philippine contact number.';
        break;
      case 3:
        if (!barangayId.trim()) return 'Barangay is required.';
        if (!zipCode.trim()) return 'Zip Code is required.';
        if (!isValidZipCode(zipCode)) return 'Zip Code must be 4 digits.';
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
    console.log(`First Name: ${firstName}, Last Name: ${lastName}, Lot/Blk/House No.: ${lotBlkHouseNo}, Street Name: ${streetName}, Subdivision/Village/Zone/Purok: ${subdivisionVillageZonePurok}, Zip Code: ${zipCode}, Contact Number: ${contactNumber}, Email: ${email}`); // Log field values
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

    // For partial registration, skip steps 2 and 3, go directly from step 1 to step 4
    if (registrationPhase === 'partial') {
      if (step === 1) {
        setStep(4); // Skip to step 4 (account details)
      } else if (step === 4) {
        // Stay on step 4 for registration
      }
    }
    else if (registrationPhase === 'full') {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const onBack = () => {
    if (registrationPhase === 'partial') {
      if (step === 4) {
        setStep(1); // Go back to step 1 from step 4
      }
    } else {
      setStep(prev => Math.max(prev - 1, 1));
    }
  };



  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="end">
            <IonButton routerLink="/user/login" routerDirection="back">
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
        <IonProgressBar value={step / 5}></IonProgressBar>
      </IonHeader>

      <IonContent scrollY={false}>
        <IonGrid fixed>
          <IonRow className="ion-justify-content-center">
            <IonCol >
              <IonCard>
                <IonCardContent>
                  {step === 1 && (
                    <PartialRegistrationStep1
                      firstName={firstName}
                      middleName={middleName}
                      lastName={lastName}
                      suffix={suffix}
                      birthdate={birthdate}
                      onChange={onChange}
                    />
                  )}
                  {step === 2 && (
                    <FullRegistrationStep1
                      lotBlkHouseNo={lotBlkHouseNo}
                      streetName={streetName}
                      subdivisionVillageZonePurok={subdivisionVillageZonePurok}
                      contactNumber={contactNumber}
                      selectedRegion={selectedRegion}
                      selectedProvince={selectedProvince}
                      selectedCityMunicipality={selectedCityMunicipality}
                      onChange={onChange}
                    />
                  )}
                  {step === 3 && (
                    <FullRegistrationStep2
                      barangayId={barangayId}
                      selectedCityMunicipality={selectedCityMunicipality}
                      onAddressChange={onAddressChange}
                    />
                  )}
                  {step === 4 && (
                    <PartialRegistrationStep2
                      email={email}
                      password={password}
                      confirmPassword={confirmPassword}
                      onChange={onChange}
                    />
                  )}
                  {step === 5 && (
                    <RegistrationReview
                      firstName={firstName}
                      middleName={middleName}
                      lastName={lastName}
                      suffix={suffix}
                      birthdate={birthdate}
                      lotBlkHouseNo={lotBlkHouseNo}
                      streetName={streetName}
                      subdivisionVillageZonePurok={subdivisionVillageZonePurok}
                      zipCode={zipCode}
                      contactNumber={contactNumber}
                      email={email}
                      password={password}
                      barangayId={barangayId} // pass barangay to summary page
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
      <IonFooter>
        <IonToolbar>
          <IonGrid>
            <IonRow className="ion-justify-content-between">
              <IonCol size="auto">
                {((registrationPhase === 'partial' && step === 4) || (registrationPhase === 'full' && step > 1)) && (
                  <IonButton
                  fill="outline"
                  shape='round'
                  onClick={onBack}
                  >
                    <IonText className='ion-padding-vertical'>Back</IonText>
                    <IonIcon slot="start" icon={chevronBack} />
                  </IonButton>
                )}
              </IonCol>
              <IonCol size="auto">
                {registrationPhase === 'partial' && step === 1 && (
                  <IonButton
                  shape='round'
                  onClick={onNext}
                  >
                    <IonText className='ion-padding-vertical' color={'light'} >Next</IonText>
                    <IonIcon slot="end" icon={chevronForward} color='light' />
                  </IonButton>
                )}
                {registrationPhase === 'partial' && step === 4 && (
                  <IonButton
                  onClick={doRegister}
                  shape='round'
                  color='success'
                  >
                    <IonText className='ion-padding-vertical'>Create Account</IonText>
                    <IonIcon slot="end" icon={checkmarkDoneOutline} />
                  </IonButton>
                )}
                {registrationPhase === 'full' && step < 5 && (
                  <IonButton
                  shape='round'
                  onClick={onNext}
                  >
                    <IonText className='ion-padding-vertical' color={'light'} >Next</IonText>
                    <IonIcon slot="end" icon={chevronForward} color='light' />
                  </IonButton>
                )}
                {registrationPhase === 'full' && step === 5 && (
                  <IonButton
                  onClick={doRegister}
                  shape='round'
                  color='success'
                  >
                    <IonText className='ion-padding-vertical' color={'light'}>Register</IonText>
                    <IonIcon slot="end" icon={checkmarkDoneOutline} />
                  </IonButton>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default UserRegister;
