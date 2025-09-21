import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonToast, IonCard, IonCardContent } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { TeleconsultationRequestService } from '../../services/teleconsultationRequestService';
import TeleconsultationRequestForm from './TeleconsultationRequestSteps/TeleconsultationRequestForm';
import { logEvent } from '../../utils/logger';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; contactNumber?: string; email?: string } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState<boolean | null>(null);
  const [verificationCheckLoading, setVerificationCheckLoading] = useState(false);

  useEffect(() => {
    const fetchUserDataAndCheckVerification = async () => {
      if (currentUser?.uid) {
        setVerificationCheckLoading(true);

        try {
          // Fetch user data
          const service = UserService.getInstance();
          const data = await service.getUserData(currentUser.uid);
          setUserData({
            firstName: data.firstName,
            lastName: data.lastName,
            contactNumber: data.contactNumber,
            email: data.email,
          });

          // Check user verification status
          const teleconsultationService = TeleconsultationRequestService.getInstance();
          const verified = await teleconsultationService.checkUserVerification(currentUser.uid);
          setIsUserVerified(verified);

          logEvent('info', `[TELECONSULTATION_MODAL] User verification check completed`, {
            userId: currentUser.uid,
            isVerified: verified
          });
        } catch (error) {
          logEvent('error', `[TELECONSULTATION_MODAL] Error checking verification`, {
            userId: currentUser.uid,
            error
          });
          setIsUserVerified(false);
        } finally {
          setVerificationCheckLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchUserDataAndCheckVerification();
    } else {
      // Reset states when modal closes
      setUserData(null);
      setIsUserVerified(null);
      setVerificationCheckLoading(false);
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

          {verificationCheckLoading && (
            <IonCard>
              <IonCardContent>
                <IonText>
                  <p>Checking verification status...</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          {!verificationCheckLoading && isUserVerified === false && (
            <IonCard color="warning">
              <IonCardContent>
                <IonText>
                  <h3>Verification Required</h3>
                  <p>Your account needs to be verified before you can submit teleconsultation requests.</p>
                  <p>Please complete your registration verification first. Contact your barangay administrator if you need assistance.</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          {!verificationCheckLoading && isUserVerified === true && userData && currentUser && (
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
