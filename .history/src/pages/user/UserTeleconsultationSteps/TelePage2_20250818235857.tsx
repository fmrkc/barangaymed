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
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

interface TelePage2Props {
  onNext: (data: any) => void;
  onBack: () => void;
}

const TelePage2: React.FC<TelePage2Props> = ({ onNext, onBack }) => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    barangay: '',
  });

  const handleNext = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.barangay) {
      alert('Please fill in all required fields');
      return;
    }
    onNext(formData);
    history.push('/user/teleconsultation/step3');
  };

  const handleBack = () => {
    onBack();
    history.push('/user/teleconsultation/step1');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/teleconsultation/step1" />
          </IonButtons>
          <IonTitle>Book Teleconsultation - Step 2</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonCard>
                <IonCardContent>
                  <h2>Personal Information</h2>
                  
                  <IonItem>
                    <IonLabel position="stacked">Full Name *</IonLabel>
                    <IonInput
                      value={formData.fullName}
                      onIonChange={(e) => setFormData({ ...formData, fullName: e.detail.value! })}
                      placeholder="Enter your full name"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Email Address *</IonLabel>
                    <IonInput
                      type="email"
                      value={formData.email}
                      onIonChange={(e) => setFormData({ ...formData, email: e.detail.value! })}
                      placeholder="Enter your email address"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Phone Number *</IonLabel>
                    <IonInput
                      type="tel"
                      value={formData.phone}
                      onIonChange={(e) => setFormData({ ...formData, phone: e.detail.value! })}
                      placeholder="Enter your phone number"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Address *</IonLabel>
                    <IonInput
                      value={formData.address}
                      onIonChange={(e) => setFormData({ ...formData, address: e.detail.value! })}
                      placeholder="Enter your complete address"
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Barangay *</IonLabel>
                    <IonInput
                      value={formData.barangay}
                      onIonChange={(e) => setFormData({ ...formData, barangay: e.detail.value! })}
                      placeholder="Enter your barangay"
                    />
                  </IonItem>

                  <div className="ion-margin-top">
                    <IonButton expand="block" onClick={handleBack} fill="outline" className="ion-margin-bottom">
                      Back
                    </IonButton>
                    <IonButton expand="block" onClick={handleNext}>
                      Next
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default TelePage2;
