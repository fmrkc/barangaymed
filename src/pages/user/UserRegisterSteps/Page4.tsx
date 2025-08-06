import React, { useState } from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText } from '@ionic/react';

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
      <IonText>Step 4: Enter your account details.</IonText>
      <IonInput
        className='ion-margin-top'
        fill="outline"
        label="Email"
        labelPlacement="floating"
        type="email"
        value={email}
        onIonChange={e => onChange('email', e.detail.value!)}
      />
      <IonInput
        fill="outline"
        label="Password"
        labelPlacement="floating"
        type="password"
        value={password}
        onIonChange={e => onChange('password', e.detail.value!)}
        className="ion-margin-top"
      />
      <IonInput
        fill="outline"
        label="Confirm Password"
        labelPlacement="floating"
        type="password"
        value={confirmPassword}
        onIonChange={e => setConfirmPassword(e.detail.value!)}
        className="ion-margin-top"
      />
      {error && (
        <IonText color="danger" className="ion-padding-start">
          {error}
        </IonText>
      )}
      <IonRow className="ion-justify-content-between ion-margin-top">
        <IonCol size="5">
          <IonButton expand="block" onClick={onBack}>Back</IonButton>
        </IonCol>
        <IonCol size="5">
          <IonButton expand="block" onClick={handleNext}>Next</IonButton>
        </IonCol>
      </IonRow>
    </>
  );
};

export default Page4;
