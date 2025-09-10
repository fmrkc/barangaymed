import React, { useRef, useEffect } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonText } from '@ionic/react';
import { arrowForward, calendarNumber, chevronForward, lockClosed, person } from 'ionicons/icons';
import { Maskito } from '@maskito/core';
import { MaskitoOptions } from '@maskito/core';

interface Page1Props {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthdate: string;
  onChange: (field: string, value: string) => void;
  onNext?: () => void;
  error: string | null;
}

const Page1: React.FC<Page1Props> = ({ firstName, middleName, lastName, suffix, birthdate, onChange, error }) => {
  const inputRef = useRef<HTMLIonInputElement>(null);
  const maskitoRef = useRef<HTMLInputElement | null>(null);

  const dateMask: MaskitoOptions = {
    mask: [/\d/, /\d/, ' ', '/', ' ', /\d/, /\d/, ' ', '/', ' ', /\d/, /\d/, /\d/, /\d/],
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.getInputElement().then((el) => {
        maskitoRef.current = el;
        new Maskito(el, dateMask);
      });
    }
  }, []);

  return (
    <>
      <IonCardTitle className="ion-padding-vertical">
        Step 1: Enter your personal details.
      </IonCardTitle>

      <div className='ion-margin-top'>
        <IonCardSubtitle>First Name <IonText color={'danger'}>*</IonText></IonCardSubtitle>
        <IonInput
          placeholder="Juan"
          value={firstName}
          fill="outline"
          onIonChange={(e) => onChange("firstName", e.detail.value!)}
          className={`${!firstName.trim() && 'ion-invalid ion-touched'}`}
          errorText="First name is required"
          autocomplete="given-name"
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
          autocomplete="additional-name"
        >
          <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Last Name <IonText color={'danger'}>*</IonText></IonCardSubtitle>
        <IonInput
          placeholder="Cruz"
          fill="outline"
          value={lastName}
          onIonChange={(e) => onChange("lastName", e.detail.value!)}
          className={`${!lastName.trim() && 'ion-invalid ion-touched'}`}
          errorText="Last name is required"
          autocomplete="family-name"
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
          autocomplete="honorific-suffix"
        >
          <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonLabel>Birthdate <IonText color={'danger'}>*</IonText></IonLabel>
        
        <IonInput
          ref={inputRef}
          placeholder="MM / DD / YYYY"
          value={birthdate}
          fill="outline"
          onIonChange={(e) => onChange("birthdate", e.detail.value!)}
          className={`${!birthdate.trim() && 'ion-invalid ion-touched'}`}
          errorText="Birthdate is required"
          autocomplete="bday"
        >
          <IonIcon slot="start" icon={calendarNumber} aria-hidden="true"></IonIcon>
        </IonInput>

      </div>
    </>
  );
};

export default Page1;
