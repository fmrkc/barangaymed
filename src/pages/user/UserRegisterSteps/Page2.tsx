import React, { useState } from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText, IonCardTitle, IonSelect, IonSelectOption, IonCardSubtitle, IonIcon } from '@ionic/react';
import { arrowBack, arrowForward, call, chevronBack, chevronBackCircle, chevronForward, home, phoneLandscape } from 'ionicons/icons';
import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import { useMaskito } from '@maskito/react';

interface Page2Props {
  address: string;
  contactNumber: string;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const Page2: React.FC<Page2Props> = ({ address, contactNumber, onChange, onNext, onBack }) => {
  const phoneMaskOptions: MaskitoOptions = {
    mask: ['+', '(', '6', '3', ')', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/],
  };
  const phoneMask = useMaskito({ options: phoneMaskOptions });
  // Simple input formatting function for phone number


  return (
    <>
      <IonCardTitle className="ion-padding-vertical">
        Step 2: Enter your barangay, address, and contact number.
      </IonCardTitle>

      <div className="ion-margin-top">
        <IonCardSubtitle>Address *</IonCardSubtitle>
        <IonInput
          placeholder="123 Street, Barangay"
          fill="outline"
          value={address}
          onIonChange={(e) => onChange("address", e.detail.value!)}
        >
          <IonIcon slot="start" icon={home}></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Contact Number *</IonCardSubtitle>
        <IonInput
          ref={(phoneInput) => {
            if (phoneInput) {
              phoneInput.getInputElement().then((input) => {
                phoneMask(input);
              });
            }
          }}
          fill="outline"
          value={contactNumber}
          onIonInput={(e) => onChange("contactNumber", e.detail.value || "")}
          placeholder="+(63) 123-456-7890"
        >
          <IonIcon slot="start" icon={call}></IonIcon>
        </IonInput>
      </div>

      <IonRow className="ion-justify-content-between ion-margin-top">
        <IonCol size="5">
          <IonButton
            expand="block"
            onClick={onBack}
            shape="round"
            className="ion-padding-vertical"
          >
            Back
            <IonIcon icon={arrowBack} slot="start" />
          </IonButton>
        </IonCol>
        <IonCol size="5">
          <IonButton
            expand="block"
            onClick={onNext}
            shape="round"
            className="ion-padding-vertical"
          >
            Next
            <IonIcon icon={arrowForward} slot="end" />
          </IonButton>
        </IonCol>
      </IonRow>
    </>
  );
};

export default Page2;
