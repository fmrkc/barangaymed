import React, { useState, useEffect } from 'react';
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
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../../../services/userService';

interface TelePage2Props {
  onNext: (data: any) => void;
  onBack: () => void;
}

const TelePage2: React.FC<TelePage2Props> = ({ onNext, onBack }) => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    barangay: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userService = UserService.getInstance();
        const userData = await userService.getUserData(currentUser.uid);
        
        // Construct full name from individual components
        const fullName = [userData.firstName, userData.middleName, userData.lastName, userData.suffix]
          .filter(Boolean)
          .join(' ');
        
        setFormData({
          fullName: fullName,
          email: userData.email,
          phone: userData.contactNumber,
          address: userData.address,
          barangay: userData.barangay,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your information. Please fill in the form manually.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

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
                  
                  {loading ? (
                    <div className="ion-text-center ion-padding">
                      <IonSpinner />
                      <p>Loading your information...</p>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <IonText color="warning" className="ion-padding">
                          <p>{error}</p>
                        </IonText>
                      )}
                      
                      <IonItem>
                        <IonLabel position="stacked">Full Name *</IonLabel>
                        <IonInput
                          value={formData.fullName}
                          onIonChange={(e) => setFormData({ ...formData, fullName: e.detail.value! })}
                          placeholder="Enter your full name"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Email Address *</极onLabel>
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
                          placeholder极Enter your complete address"
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
                    </>
                  )}

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
