
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
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
  useIonToast,
  useIonLoading,
  IonFooter,
  IonText,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { arrowForward, checkmarkDoneOutline, close, eye, eyeOff, person } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const UserRegister: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const [present, dismiss] = useIonLoading();

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
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    present('Creating account...');
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

      dismiss();
      presentToast({
        message: 'Registration successful! A verification email has been sent.',
        duration: 3000,
        color: 'success',
      });
      history.push('/user/verify-email');
    } catch (error: any) {
      dismiss();
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use.');
      } else {
        setError('An error occurred during registration.');
      }
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
      </IonHeader>
      <IonContent>
        <IonGrid fixed>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" size-md="8" size-lg="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Sign Up</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="floating">First Name</IonLabel>
                    <IonInput
                      value={firstName}
                      onIonChange={(e) => setFirstName(e.detail.value!)}
                      required
                    >
                      <IonIcon slot="start" icon={person}></IonIcon>
                    </IonInput>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Last Name</IonLabel>
                    <IonInput
                      value={lastName}
                      onIonChange={(e) => setLastName(e.detail.value!)}
                      required
                    >
                      <IonIcon slot="start" icon={person}></IonIcon>
                    </IonInput>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Middle Name (Optional)</IonLabel>
                    <IonInput
                      value={middleName}
                      onIonChange={(e) => setMiddleName(e.detail.value!)}
                    >
                      <IonIcon slot="start" icon={person}></IonIcon>
                    </IonInput>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Suffix (Optional)</IonLabel>
                    <IonInput
                      value={suffix}
                      onIonChange={(e) => setSuffix(e.detail.value!)}
                    >
                      <IonIcon slot="start" icon={person}></IonIcon>
                    </IonInput>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Birthdate</IonLabel>
                    <IonInput
                      type="date"
                      value={birthdate}
                      onIonChange={(e) => setBirthdate(e.detail.value!)}
                      required
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Gender</IonLabel>
                    <IonSelect
                      value={gender}
                      onIonChange={(e) => setGender(e.detail.value!)}
                      placeholder="Select Gender"
                      required
                    >
                      <IonSelectOption value="Male">Male</IonSelectOption>
                      <IonSelectOption value="Female">Female</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Email</IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      onIonChange={(e) => setEmail(e.detail.value!)}
                      required
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="floating">Password</IonLabel>
                    <IonInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onIonChange={(e) => setPassword(e.detail.value!)}
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
                    <IonLabel position="floating">Confirm Password</IonLabel>
                    <IonInput
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onIonChange={(e) => setConfirmPassword(e.detail.value!)}
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
                  {error && <p style={{ color: 'red' }}>{error}</p>}
                  
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
      <IonFooter>
        <IonToolbar>
            <IonButton
                expand="block"
                shape="round"
                onClick={handleRegister}
                className="ion-margin"
                disabled={!firstName || !lastName || !email || !password || !confirmPassword || !birthdate || !gender}
            >
                <IonIcon slot="end" icon={arrowForward} />
                <IonText className='ion-padding-vertical'>Register</IonText>
            </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default UserRegister;
