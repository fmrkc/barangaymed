import React from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonText } from '@ionic/react';
import { arrowForward, chevronForward, lockClosed, person } from 'ionicons/icons';

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
      <IonCardTitle className="ion-padding-vertical">
        Step 1: Enter your personal information.
      </IonCardTitle>

      <div className='ion-margin-top'>
        <IonCardSubtitle>First Name *</IonCardSubtitle>
        <IonInput
          placeholder="Juan"
          value={firstName}
          fill="outline"
          onIonChange={(e) => onChange("firstName", e.detail.value!)}
        >
          <IonIcon slot="start" icon={person}></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Middle Name</IonCardSubtitle>
        <IonInput
          fill="outline"
          placeholder="Dela"
          value={middleName}
          onIonChange={(e) => onChange("middleName", e.detail.value!)}
        >
          <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Last Name *</IonCardSubtitle>
        <IonInput
          placeholder="Cruz"
          fill="outline"
          value={lastName}
          onIonChange={(e) => onChange("lastName", e.detail.value!)}
        >
          <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
        </IonInput>
      </div>
      <div className="ion-margin-top">
        <IonCardSubtitle>Suffix (optional)</IonCardSubtitle>
        <IonInput
          placeholder="Jr, Sr, III"
          fill="outline"
          value={suffix}
          onIonChange={(e) => onChange("suffix", e.detail.value!)}
        >
          <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
        </IonInput>
      </div>

      <IonButton expand="block" className="ion-padding-vertical ion-margin-top" shape='round' onClick={onNext}>
        Next
        <IonIcon icon={arrowForward} slot="end" />
      </IonButton>
    </>
  );
};

export default Page1;
