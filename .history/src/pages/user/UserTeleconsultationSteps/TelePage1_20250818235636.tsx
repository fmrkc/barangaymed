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
    consultationType: '',
    preferredDate: '',
    preferredTime: '',
    symptoms: '',
    additionalNotes: '',
  });

  const handleNext = () => {
    if (!formData.consultationType || !formData.preferredDate || !formData.preferredTime || !formData.symptoms) {
      alert('Please fill in all required fields');
      return;
    }
    onNext(formData);
    history.push('/user/teleconsultation/step2');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/dashboard" />
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
                    <IonLabel position="stacked">Consultation Type *</IonLabel>
                    <IonSelect
                      value={formData.consultationType}
                      placeholder="Select consultation type"
                      onIonChange={(e) => setFormData({ ...formData, consultationType: e.detail.value })}
                    >
                      <IonSelectOption value="general">General Consultation</IonSelectOption>
                      <IonSelectOption value="specialist">Specialist Consultation</IonSelectOption>
                      <IonSelectOption value="follow-up">Follow-up Consultation</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Preferred Date *</IonLabel>
                    <IonDatetime
                      presentation="date"
                      value={formData.preferredDate}
                      onIonChange={(e) => setFormData({ ...formData, preferredDate: e.detail.value! })}
                      min={new Date().toISOString()}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Preferred Time *</IonLabel>
                    <IonSelect
                      value={formData.preferredTime}
                      placeholder="Select preferred time"
                      onIonChange={(e) => setFormData({ ...formData, preferredTime: e.detail.value })}
                    >
                      <IonSelectOption value="09:00">9:00 AM</IonSelectOption>
                      <IonSelectOption value="10:00">10:00 AM</IonSelectOption>
                      <IonSelectOption value="11:00">11:00 AM</IonSelectOption>
                      <IonSelectOption value="14:00">2:00 PM</IonSelectOption>
                      <IonSelectOption value="15:00">3:00 PM</IonSelectOption>
                      <IonSelectOption value="16:00">4:00 PM</IonSelectOption>
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
    </IonPage>
  );
};

export default TelePage1;
