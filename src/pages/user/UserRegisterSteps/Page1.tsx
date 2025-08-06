import React from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonText } from '@ionic/react';

interface Page1Props {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
}

const Page1: React.FC<Page1Props> = ({ firstName, middleName, lastName, suffix, onChange, onNext }) => {
  return (
    <>
    
      <IonText>Step 1: Enter your personal information.</IonText>
      <IonInput
        className='ion-margin-top'
        fill="outline"
        label="First Name"
        labelPlacement="floating"
        value={firstName}
        onIonChange={e => onChange('firstName', e.detail.value!)}
      />
      <IonInput
        fill="outline"
        label="Middle Name"
        labelPlacement="floating"
        value={middleName}
        onIonChange={e => onChange('middleName', e.detail.value!)}
        className="ion-margin-top"
      />
      <IonInput
        fill="outline"
        label="Last Name"
        labelPlacement="floating"
        value={lastName}
        onIonChange={e => onChange('lastName', e.detail.value!)}
        className="ion-margin-top"
      />
      <IonInput
        fill="outline"
        label="Suffix (optional)"
        labelPlacement="floating"
        value={suffix}
        onIonChange={e => onChange('suffix', e.detail.value!)}
        className="ion-margin-top"
      />
      <IonButton expand="block" className="ion-margin-top" onClick={onNext}>Next</IonButton>
    </>
  );
};

export default Page1;
