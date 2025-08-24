import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonBackButton,
  IonButtons,
  IonLoading,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../contexts/AuthContext';
import { TeleconsultationRequest } from '../../../types/teleconsultationRequests';

interface TelePage3Props {
  step1Data: any;
  step2Data: any;
}

const TelePage3: React.FC<TelePage3Props> = ({ step1Data, step2Data }) => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentUser) {
      alert('Please login to book a teleconsultation');
      return;
    }

    setLoading(true);

    try {
      const teleconsultationData: Omit<TeleconsultationRequest, 'id'> = {
        userId: currentUser.uid,
        userEmail: step2Data.email,
        userName: step2Data.fullName,
        userPhone: step2Data.phone,
        userAddress: step2Data.address,
        userBarangay: step2Data.barangay,
        preferredDate: new Date(step1Data.preferredDate),
        preferredTime: step1Data.preferredTime,
        symptoms: step1Data.symptoms,
        additionalNotes: step1Data.additionalNotes || '',
        status: 'pending',
        requestDate: new Date(),
      };

      await addDoc(collection(db, 'teleconsultationRequests'), {
        ...teleconsultationData,
        preferredDate: serverTimestamp(),
      });

      alert('Teleconsultation request submitted successfully!');
      history.push('/user/dashboard');
    } catch (error) {
      console.error('Error submitting teleconsultation request:', error);
      alert('Failed to submit teleconsultation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    history.push('/user/teleconsultation/step2');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/teleconsultation/step2" />
          </IonButtons>
          <IonTitle>Book Teleconsultation - Step 3</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Review Your Booking</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h3>Consultation Details</h3>
                  <IonText>
                    <p><strong>Preferred Date:</strong> {new Date(step1Data.preferredDate).toLocaleDateString()}</p>
                    <p><strong>Preferred Time:</strong> {step1Data.preferredTime}</p>
                    <p><strong>Symptoms:</strong> {step1Data.symptoms}</p>
                    {step1Data.additionalNotes && (
                      <p><strong>Additional Notes:</strong> {step1Data.additionalNotes}</p>
                    )}
                  </IonText>

                  <h3 className="ion-margin-top">Personal Information</h3>
                  <IonText>
                    <p><strong>Name:</strong> {step2Data.fullName}</p>
                    <p><strong>Email:</strong> {step2Data.email}</p>
                    <p><strong>Phone:</strong> {step2Data.phone}</p>
                    <p><strong>Address:</strong> {step2Data.address}</p>
                    <p><strong>Barangay:</strong> {step2Data.barangay}</p>
                  </IonText>

                  <div className="ion-margin-top">
                    <IonButton expand="block" onClick={handleBack} fill="outline" className="ion-margin-bottom">
                      Back
                    </IonButton>
                    <IonButton expand="block" onClick={handleSubmit}>
                      Confirm Booking
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonLoading
          isOpen={loading}
          message="Submitting your teleconsultation request..."
        />
      </IonContent>
    </IonPage>
  );
};

export default TelePage3;
