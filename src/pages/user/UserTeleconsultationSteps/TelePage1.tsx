import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

interface TelePage1Props {
  onNext: (data: any) => void;
}

const TelePage1: React.FC<TelePage1Props> = ({ onNext }) => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    symptoms: '',
    additionalNotes: '',
  });

  const handleNext = () => {
    if (!formData.preferredDate || !formData.preferredTime || !formData.symptoms) {
      alert('Please fill in all required fields');
      return;
    }
    onNext(formData);
    history.push('/user/teleconsultation/step2');
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/dashboard/home" />
          </IonButtons>
          <IonTitle>Book Teleconsultation - Step 1</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonCard>
                <IonCardContent>
                  <h2>Consultation Details</h2>

                  <IonItem>
                    <IonLabel position="stacked">Preferred Date *</IonLabel>
                    <IonDatetime
                      presentation="date"
                      value={formData.preferredDate}
                      onIonChange={(e) => setFormData({ ...formData, preferredDate: Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value || '' })}
                      min={new Date().toISOString()}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Preferred Time Period *</IonLabel>
                    <IonSelect
                      value={formData.preferredTime}
                      placeholder="Select AM or PM"
                      onIonChange={(e) => setFormData({ ...formData, preferredTime: e.detail.value })}
                    >
                      <IonSelectOption value="AM">Morning (AM)</IonSelectOption>
                      <IonSelectOption value="PM">Afternoon (PM)</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Symptoms/Reason for Consultation *</IonLabel>
                    <IonTextarea
                      rows={4}
                      value={formData.symptoms}
                      onIonChange={(e) => setFormData({ ...formData, symptoms: e.detail.value! })}
                      placeholder="Please describe your symptoms or reason for consultation"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Additional Notes (Optional)</IonLabel>
                    <IonTextarea
                      rows={3}
                      value={formData.additionalNotes}
                      onIonChange={(e) => setFormData({ ...formData, additionalNotes: e.detail.value! })}
                      placeholder="Any additional information you'd like to share"
                    />
                  </IonItem>

                  <IonButton expand="block" onClick={handleNext} className="ion-margin-top">
                    Next
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </>
  );
};

export default TelePage1;
