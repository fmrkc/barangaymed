
import React from 'react';
import { IonButton, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonLabel, IonText, IonCardSubtitle, IonCardTitle, IonIcon } from '@ionic/react';
import { BARANGAYS } from '../../../constants/barangays';
import { arrowBack, arrowForward, cloudUpload } from 'ionicons/icons';

interface Page3Props {
  onNext: () => void;
  onBack: () => void;
  barangay: string;
  onBarangayChange: (value: string) => void;
}

const Page3: React.FC<Page3Props> = ({ onNext, onBack, barangay, onBarangayChange }) => {
  return (
    <>
    <IonCardTitle className="ion-padding-vertical">
        Step 3: Enter your Municipality and Barangay.
      </IonCardTitle>
    
    
      <IonGrid>
        <IonRow className="ion-justify-content-center ion-margin-top">
          <IonCol size="12" sizeMd="6" className="ion-text-center">
            <IonSelect label='Municipality' placeholder="Floridablanca" disabled>
            </IonSelect>
          </IonCol>
        </IonRow>
        <IonRow className="ion-justify-content-center ion-margin-bottom">
          <IonCol size="12" sizeMd="6" className="ion-text-center">
            <IonSelect
            label='Barangay'
              value={barangay}
              placeholder="Select Barangay"
              onIonChange={e => onBarangayChange(e.detail.value)}
              className="ion-margin-top"
            >
              {BARANGAYS.map((brgy) => (
                <IonSelectOption key={brgy} value={brgy}>
                  {brgy}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonCol>
        </IonRow>
        <IonRow className="ion-justify-content-center ion-margin-bottom">
          <IonCol size="12" sizeMd="6" className="ion-text-center">
            <IonButton shape='round' expand="block">
              <IonIcon icon={cloudUpload} slot="start" />
              Barangay I.D.
            </IonButton>
          </IonCol>
        </IonRow>
       
        <IonRow className="ion-justify-content-center ion-margin-bottom">
          <IonCol size="12" sizeMd="6" className="ion-text-center">
            <IonButton shape='round' expand="block">
              <IonIcon icon={cloudUpload} slot="start" />
              Barangay Certificate
            </IonButton>
          </IonCol>
        </IonRow>

        <IonRow className="ion-justify-content-between ion-margin-top">
                <IonCol size="5">
                  <IonButton fill='outline' expand="block" onClick={onBack} shape='round' className='ion-padding-vertical'>
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
      </IonGrid>
    </>
  );
};

export default Page3;
