import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonToast } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import TeleconsultationRequestForm from './TeleconsultationRequestSteps/TeleconsultationRequestForm';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; contactNumber?: string; email?: string } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        const service = UserService.getInstance();
        const data = await service.getUserData(currentUser.uid);
        setUserData({
          firstName: data.firstName,
          lastName: data.lastName,
          contactNumber: data.contactNumber,
          email: data.email,
        });
      }
    };
    if (isOpen) {
      fetchUserData();
    }
  }, [currentUser, isOpen]);

  const handleRequestSent = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      onDidDismiss();
    }, 2000);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Teleconsultation Request</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText>
            <h2>Teleconsultation Request Form</h2>
            <p>Please provide the reason for your teleconsultation request.</p>
          </IonText>
          {userData && currentUser && (
            <TeleconsultationRequestForm
              userId={currentUser.uid}
              userData={userData}
              onRequestSent={handleRequestSent}
            />
          )}
          <IonButton expand="full" fill="outline" onClick={onDidDismiss} className="ion-margin-top">
            Cancel
          </IonButton>
        </IonContent>
      </IonModal>
      <IonToast
        isOpen={showSuccessToast}
        onDidDismiss={() => setShowSuccessToast(false)}
        message="Teleconsultation request sent successfully!"
        duration={2000}
        color="success"
      />
    </>
  );
};

export default UserTeleRequest;
