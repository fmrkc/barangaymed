import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonText
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verification Rejected</IonTitle>
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

              <IonButton expand="block" fill="clear" onClick={logout} className="ion-margin-top">
                <IonIcon slot="start" icon={logOutOutline} />
                Logout
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RejectedVerification;
