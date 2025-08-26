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
  IonToast,
  IonAlert
} from '@ionic/react';
import { calendar, person, location, open, close } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { LogService } from '../../services/logService';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import { BARANGAYS } from '../../constants/barangays';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
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
    const fetchUserDataAndCheckPending = async () => {
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

        // Check for existing pending teleconsultation requests
        const q = query(
          collection(db, 'teleconsultationRequests'),
          where('userId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.size >= 1) {
          setHasPendingRequest(true);
        }
      } catch (err) {
        console.error('Error fetching user data or checking pending requests:', err);
      }
    };

    fetchUserDataAndCheckPending();
  }, [currentUser]);



  const validateStep1 = () => {
    return (
      formData.symptoms.trim()
    );
  };

  const validateStep2 = () => {
    return (
      formData.preferredDate &&
      formData.preferredTime
    );
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

      await addDoc(collection(db, 'teleconsultationRequests'), teleconsultationData);

      // Log the activity
      const logService = LogService.getInstance();
      await logService.logActivity({
        action: 'teleconsultation_request',
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        details: {
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          symptoms: formData.symptoms,
        },
      });

      setShowToast(true);
      setToastMessage('Teleconsultation request submitted successfully!');
      onDidDismiss();
      history.push('/user/dashboard');
    } catch (error) {
      console.error('Error submitting teleconsultation request:', error);
      alert('Failed to submit teleconsultation request. Please try again.');
    }
  };

  return (

    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="end">
                      <IonButton onClick={onDidDismiss} shape='round'>
                        <IonIcon icon={close} color='primary' />
                      </IonButton>
                    </IonButtons>
          <IonTitle>Book Teleconsultation</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>


          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Step {currentStep} of 3</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {hasPendingRequest ? (
                    <div style={{ height: '85vh', justifyContent: 'center', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                      <p>You currently have a pending request. Please check your current pending request for more information!</p>
                      <IonButton className='ion-padding-vertical' shape='round' expand='block' onClick={() => history.push('/user/dashboard/requests/requests_teleconsultation')}>
                        View My Pending Request
                        <IonIcon slot="end" icon={open} />
                      </IonButton>
                    </div>
                  ) : currentStep === 1 ? (
                    <div>
                      <h3>Consultation Details</h3>

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
                  ) : currentStep === 2 ? (
                    <div>
                      <h3>Schedule Details</h3>

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

                      <div className="ion-margin-top">
                        <IonButton expand="block" onClick={() => setCurrentStep(1)} fill="outline" className="ion-margin-bottom">
                          Back
                        </IonButton>
                        <IonButton expand="block" onClick={() => setCurrentStep(3)} disabled={!validateStep2()}>
                          Next
                        </IonButton>
                      </div>
                    </div>
                  ) : currentStep === 3 ? (
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
                  ) : null}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </IonModal>
  );
};


export default UserTeleRequest;
