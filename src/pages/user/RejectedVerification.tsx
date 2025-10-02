import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonText, IonAlert, IonButtons
} from '@ionic/react';
import { logOutOutline, createOutline } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useHistory } from 'react-router-dom';

const RejectedVerification: React.FC = () => {
  const { currentUser, logout, refreshUserClaims } = useAuth();
  const [rejectionReason, setRejectionReason] = useState('');
  const history = useHistory();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const fetchRejectionReason = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setRejectionReason(userDoc.data().rejectionReason || 'No reason provided.');
        }
      }
    };
    fetchRejectionReason();
  }, [currentUser]);

  const handleResubmit = async () => {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        verificationStatus: 'unverified',
        rejectionReason: null,
      });
      await refreshUserClaims();
    }
    history.push('/user/complete-profile');
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verification Rejected</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowAlert(true)}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" fullscreen>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonCard style={{ maxWidth: '450px', textAlign: 'center' }}>
            <IonCardHeader>
              <IonCardTitle>Your Registration Was Rejected</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Unfortunately, your registration could not be verified by your barangay admin.</p>
              <IonText color="danger">
                <p style={{ fontWeight: 'bold' }}>Reason:</p>
                <p>{rejectionReason}</p>
              </IonText>
              <p className="ion-margin-top">Please review the reason and prepare the correct information or documents.</p>

              <IonButton expand="block" onClick={handleResubmit} className="ion-margin-top">
                <IonIcon slot="start" icon={createOutline} />
                Resubmit Application
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Confirm Logout'}
          message={'Are you sure you want to log out?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
            },
            {
              text: 'Logout',
              handler: handleLogout,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default RejectedVerification;