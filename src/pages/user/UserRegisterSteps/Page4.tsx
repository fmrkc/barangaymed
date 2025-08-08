import React, { useState } from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText, IonCardSubtitle, IonCardTitle, IonIcon } from '@ionic/react';
import { arrowBack, arrowForward, lockClosed, mail } from 'ionicons/icons';

interface Page4Props {
  email: string;
  password: string;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const Page4: React.FC<Page4Props> = ({ email, password, onChange, onNext, onBack }) => {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <>
    <IonCardTitle className="ion-padding-vertical">
        Step 4: Enter your account details.
      </IonCardTitle>
      
      <div className="ion-margin-top">
        <IonCardSubtitle>Email *</IonCardSubtitle>
        <IonInput
          fill="outline"
          placeholder="juandelacruz@example.com"
          type="email"
          value={email}
          onIonChange={e => onChange('email', e.detail.value!)}
        >
          <IonIcon slot="start" icon={mail}></IonIcon>
        </IonInput>
      </div>
      
      <div className="ion-margin-top">
        <IonCardSubtitle>Password *</IonCardSubtitle>
        <IonInput
          fill="outline"
          type="password"
          placeholder="Enter your password"
          value={password}
          onIonChange={e => onChange('password', e.detail.value!)}
        >
          <IonIcon slot="start" icon={lockClosed}></IonIcon>
        </IonInput>
      </div>

      <div className='ion-margin-top'>
        <IonCardSubtitle>Confirm Password *</IonCardSubtitle>
        <IonInput
          fill="outline"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onIonChange={e => setConfirmPassword(e.detail.value!)}
        >
          <IonIcon slot="start" icon={lockClosed}></IonIcon>
        </IonInput>
      </div>
     
      {error && (
        <IonText color="danger" className="ion-padding-start">
          {error}
        </IonText>
      )}
      <IonRow className="ion-justify-content-between ion-margin-top">
        <IonCol size="5">
          <IonButton expand="block" onClick={onBack} shape='round' className='ion-padding-vertical'>
            Back
            <IonIcon icon={arrowBack} slot="start" />
          </IonButton>
        </IonCol>
        <IonCol size="5">
          <IonButton expand="block" onClick={onNext} shape='round' className='ion-padding-vertical'>
            Next
            <IonIcon icon={arrowForward} slot="end" />
          </IonButton>
        </IonCol>
      </IonRow>
    </>
  );
};

export default Page4;
