import React, { useState, useEffect } from 'react';
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
import { UserService } from '../../services/userService';
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        return;
      }

      try {
        const userService = UserService.getInstance();
        const userData = await userService.getUserData(currentUser.uid);
        
        // Construct full name from individual components
        const fullName = [userData.firstName, userData.middleName, userData.lastName, userData.suffix]
          .filter(Boolean)
          .join(' ');
        
        setFormData(prev => ({
          ...prev,
          fullName: fullName,
          email: userData.email,
          phone: userData.contactNumber,
          address: userData.address,
          barangay: userData.barangay,
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleStep1Next = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handlePhoneNumberChange = (e: CustomEvent) => {
    const value = e.detail.value!;
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, phone: numericValue });
  };

  const validateStep1 = () => {
    return (
      formData.preferredDate &&
      formData.preferredTime &&
      formData.symptoms.trim()
    );
  };

  const validateStep2 = () => {
    return (
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.barangay
    );
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

      await addDoc(collection(db, 'teleconsultationRequests'), {
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
                          onIonChange={(e) => {
                            const value = e.detail.value;
                            if (typeof value === 'string') {
                              setFormData({ ...formData, preferredDate: value });
                            } else {
                              setFormData({ ...formData, preferredDate: '' });
                            }
                          }}
                          min={new Date().toISOString()}
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Preferred Time Period *</IonLabel>
                        <IonSelect
                          value={formData.preferredTime}
                          placeholder="Select AM or PM"
                          onIonChange={(e) => {
                            const value = e.detail.value;
                            if (Array.isArray(value)) {
                              setFormData({ ...formData, preferredTime: value[0] || '' });
                            } else if (typeof value === 'string') {
                              setFormData({ ...formData, preferredTime: value });
                            } else {
                              setFormData({ ...formData, preferredTime: '' });
                            }
                          }}
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

                      <IonButton expand="block" onClick={() => setCurrentStep(2)} className="ion-margin-top" disabled={!validateStep1()}>
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
                          disabled
                          placeholder="Your full name"
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
                          onIonChange={handlePhoneNumberChange}
                          placeholder="Enter your phone number"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Address *</IonLabel>
                        <IonInput
                          value={formData.address}
                          disabled
                          placeholder="Your complete address"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Barangay *</IonLabel>
                        <IonSelect
                          value={formData.barangay}
                          placeholder="Select your barangay"
                          onIonChange={(e) => {
                            const value = e.detail.value;
                            if (Array.isArray(value)) {
                              setFormData({ ...formData, barangay: value[0] || '' });
                            } else if (typeof value === 'string') {
                              setFormData({ ...formData, barangay: value });
                            } else {
                              setFormData({ ...formData, barangay: '' });
                            }
                          }}
                        >
                          <IonSelectOption value="Anon">Anon</IonSelectOption>
                          <IonSelectOption value="Apalit">Apalit</IonSelectOption>
                          <IonSelectOption value="Basa Air Base">Basa Air Base</IonSelectOption>
                          <IonSelectOption value="Benedicto">Benedicto</IonSelectOption>
                          <IonSelectOption value="Bodega">Bodega</IonSelectOption>
                          <IonSelectOption value="Cabangcalan">Cabangcalan</IonSelectOption>
                          <IonSelectOption value="Calantas">Calantas</IonSelectOption>
                          <IonSelectOption value="Carmencita">Carmencita</IonSelectOption>
                          <IonSelectOption value="Consuelo">Consuelo</IonSelectOption>
                          <IonSelectOption value="Dampe">Dampe</IonSelectOption>
                          <IonSelectOption value="Del Carmen">Del Carmen</IonSelectOption>
                          <IonSelectOption value="Gutad">Gutad</IonSelectOption>
                          <IonSelectOption value="Mabical">Mabical</IonSelectOption>
                          <IonSelectOption value="Maligaya">Maligaya</IonSelectOption>
                          <IonSelectOption value="Maquiapo">Maquiapo</IonSelectOption>
                          <IonSelectOption value="Nabuclod">Nabuclod</IonSelectOption>
                          <IonSelectOption value="Pabanlag">Pabanlag</IonSelectOption>
                          <IonSelectOption value="Paguiruan">Paguiruan</IonSelectOption>
                          <IonSelectOption value="Palmayo">Palmayo</IonSelectOption>
                          <IonSelectOption value="Pandaguirig">Pandaguirig</IonSelectOption>
                          <IonSelectOption value="Poblacion">Poblacion</IonSelectOption>
                          <IonSelectOption value="San Antonio">San Antonio</IonSelectOption>
                          <IonSelectOption value="San Isidro">San Isidro</IonSelectOption>
                          <IonSelectOption value="San Jose">San Jose</IonSelectOption>
                          <IonSelectOption value="San Nicolas">San Nicolas</IonSelectOption>
                          <IonSelectOption value="San Pedro">San Pedro</IonSelectOption>
                          <IonSelectOption value="San Roque">San Roque</IonSelectOption>
                          <IonSelectOption value="Santa Monica">Santa Monica</IonSelectOption>
                          <IonSelectOption value="Santo Cristo">Santo Cristo</IonSelectOption>
                          <IonSelectOption value="Solib">Solib</IonSelectOption>
                          <IonSelectOption value="Valdez">Valdez</IonSelectOption>
                        </IonSelect>
                      </IonItem>

                      <div className="ion-margin-top">
                        <IonButton expand="block" onClick={() => setCurrentStep(1)} fill="outline" className="ion-margin-bottom">
                          Back
                        </IonButton>
                        <IonButton expand="block" onClick={() => setCurrentStep(3)} disabled={!validateStep2()}>
                          Next
                        </IonButton>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div>
                      <h3>Review Your Booking</h3>
                      <IonText>
                        <p><strong>Preferred Date:</strong> {new Date(formData.preferredDate).toLocaleDateString()}</p>
                        <p><strong>Preferred Time:</strong> {formData.preferredTime}</p>
                        <p><strong>Symptoms:</strong> {formData.symptoms}</p>
                        {formData.additionalNotes && (
                          <p><strong>Additional Notes:</strong> {formData.additionalNotes}</p>
                        )}
                      </IonText>

                      <h3 className="ion-margin-top">Personal Information</h3>
                      <IonText>
                        <p><strong>Name:</strong> {formData.fullName}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Phone:</strong> {formData.phone}</p>
                        <p><strong>Address:</strong> {formData.address}</p>
                        <p><strong>Barangay:</strong> {formData.barangay}</p>
                      </IonText>

                      <div className="ion-margin-top">
                        <IonButton expand="block" onClick={() => setCurrentStep(2)} fill="outline" className="ion-margin-bottom">
                          Back
                        </IonButton>
                        <IonButton expand="block" onClick={handleSubmit}>
                          Confirm Booking
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
