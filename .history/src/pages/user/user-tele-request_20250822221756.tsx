import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonModal,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonBackButton,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonDatetime,
  IonItem,
  IonLabel,
} from '@ionic/react';
import { calendar, person, location } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    symptoms: '',
    additionalNotes: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    barangay: '',
  });

  const handleStep1Next = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('Please login to book a teleconsultation');
      return;
    }

    try {
      const teleconsultationData: Omit<TeleconsultationRequest, 'id'> = {
        userId: currentUser.uid,
        userEmail: formData.email,
        userName: formData.fullName,
        userPhone: formData.phone,
        userAddress: formData.address,
        userBarangay: formData.barangay,
        preferredDate: new Date(formData.preferredDate),
        preferredTime: formData.preferredTime,
        symptoms: formData.symptoms,
        additionalNotes: formData.additionalNotes || '',
        status: 'pending',
        requestDate: new Date(),
      };

      await addDoc(collection(db, 'teleconsultationRequest'), {
        ...teleconsultationData,
        preferredDate: serverTimestamp(),
      });

      alert('Teleconsultation request submitted successfully!');
      onDidDismiss();
      history.push('/user/dashboard');
    } catch (error) {
      console.error('Error submitting teleconsultation request:', error);
      alert('Failed to submit teleconsultation request. Please try again.');
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/dashboard" />
          </IonButtons>
          <IonTitle>Book Teleconsultation</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" className="ion-text-center">
              <h1>Book Your Teleconsultation</h1>
              <p>Complete the following steps to book your teleconsultation appointment</p>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Step {currentStep} of 3</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {currentStep === 1 && (
                    <div>
                      <h3>Consultation Details</h3>

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

                      <IonButton expand="block" onClick={() => setCurrentStep(2)} className="ion-margin-top">
                        Next
                      </IonButton>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div>
                      <h3>Personal Information</h3>
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
                        <IonButton expand="block" onClick={() => setCurrentStep(1)} fill="outline" className="极ion-margin-bottom">
                          Back
                        </IonButton>
                        <IonButton expand="block" onClick={handleSubmit}>
                          Submit Request
                        </IonButton>
                      </div>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default UserTeleRequest;
