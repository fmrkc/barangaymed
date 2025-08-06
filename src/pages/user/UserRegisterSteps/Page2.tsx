import React from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText } from '@ionic/react';

interface Page2Props {
  address: string;
  contactNumber: string;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const Page2: React.FC<Page2Props> = ({ address, contactNumber, onChange, onNext, onBack }) => {
  return (
    <>
      <IonText>Step 2: Enter your address & contact number.</IonText>
      <IonInput
      className='ion-margin-top'
        fill="outline"
        label="Address"
        labelPlacement="floating"
        value={address}
        onIonChange={e => onChange('address', e.detail.value!)}
      />
      <IonInput
        fill="outline"
        label="Contact Number"
        labelPlacement="floating"
        value={contactNumber}
        onIonChange={e => onChange('contactNumber', e.detail.value!)}
        className="ion-margin-top"
      />
      <IonRow className="ion-justify-content-between ion-margin-top">
        <IonCol size="5">
          <IonButton expand="block" onClick={onBack}>Back</IonButton>
        </IonCol>
        <IonCol size="5">
          <IonButton expand="block" onClick={onNext}>Next</IonButton>
        </IonCol>
      </IonRow>
    </>
  );
};

export default Page2;
