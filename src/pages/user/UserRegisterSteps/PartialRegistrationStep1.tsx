import React from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonText, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/react';
import { arrowForward, chevronForward, lockClosed, person } from 'ionicons/icons';

interface Page1Props {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthdate: string; // Added birthdate
  onChange: (field: string, value: string) => void;
  onNext?: () => void;
  error: string | null;
}

const Page1: React.FC<Page1Props> = ({ firstName, middleName, lastName, suffix, birthdate, onChange, error }) => {
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
          className={`${!firstName.trim() && 'ion-invalid ion-touched'}`}
          errorText="First name is required"
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
          className={`${!lastName.trim() && 'ion-invalid ion-touched'}`}
          errorText="Last name is required"
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

      <div className="ion-margin-top">
        <IonCardSubtitle>Birthdate *</IonCardSubtitle>
        <IonDatetimeButton datetime="birthdate"></IonDatetimeButton>
        <IonModal keepContentsMounted={true}>
          <IonDatetime
            id="birthdate"
            presentation="date"
            value={birthdate}
            onIonChange={(e) => onChange("birthdate", e.detail.value ? String(e.detail.value) : '')}
            className={`${!birthdate.trim() && 'ion-invalid ion-touched'}`}
          ></IonDatetime>
        </IonModal>
        <br />
      </div>
    </>
  );
};

export default Page1;
