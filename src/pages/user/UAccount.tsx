import { 
  IonButton, 
  IonCard, 
  IonCardContent, 
  IonContent, 
  IonHeader, 
  IonIcon, 
  IonItem, 
  IonTitle, 
  IonToolbar, 
  useIonRouter,
  IonModal,
  IonInput,
  IonToast,
  IonLoading,
  IonSelect,
  IonSelectOption,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import LogoutButton from '../../components/LogoutButton';
import { useAuth } from '../../contexts/AuthContext';
import { logOut, create, person } from 'ionicons/icons';
import { updateProfile, updateEmail } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BARANGAYS } from '../../constants/barangays';
import { logEvent } from '../../utils/logger';

const Account: React.FC = () => {
    const { logout, currentUser } = useAuth();
    const router = useIonRouter();
    const [showLoading, setShowLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(currentUser?.displayName || '');
    const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);

    const handleLogout = async () => {
      setShowLoading(true);
      try {
        await logout();
        router.push('/admin', 'forward');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setShowLoading(false);
      }
    };

    const handleUpdateProfile = async () => {
      if (!currentUser) return;
      
      setIsUpdating(true);
      setError(null);
      setSuccessMessage(null);

      try {
        // Update display name
        if (editName.trim() && editName !== currentUser.displayName) {
          await updateProfile(currentUser, { displayName: editName });
        }

        // Update email
        if (editEmail.trim() && editEmail !== currentUser.email) {
          await updateEmail(currentUser, editEmail);
        }

        setSuccessMessage('Profile updated successfully!');
        setShowEditModal(false);
      } catch (error: any) {
        console.error('Update error:', error);
        setError(error.message || 'Failed to update profile');
      } finally {
        setIsUpdating(false);
      }
    };

    const openEditModal = () => {
      setEditName(currentUser?.displayName || '');
      setEditEmail(currentUser?.email || '');
      setError(null);
      setShowEditModal(true);
    };

    return (
      <>
        <IonHeader>
          <IonToolbar>
            <IonTitle>My Account</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonCard>
            <IonCardContent>
              <IonCardHeader>
                <IonCardTitle>
                  
                  {currentUser?.displayName || 'User Profile'}
                </IonCardTitle>
                <IonCardSubtitle>
                  {currentUser?.email || 'No email provided'}
                </IonCardSubtitle>
              </IonCardHeader>
              
              
              <IonButton expand="block" onClick={openEditModal} className="ion-margin-vertical">
                <IonIcon slot="start" icon={create} />
                Edit Profile
              </IonButton>

              <IonItem detail={false} button onClick={handleLogout}>
                <IonIcon slot="start" icon={logOut} />
                Logout
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Edit Profile Modal */}
          <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Edit Profile</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonInput
                label="Name"
                labelPlacement="floating"
                value={editName}
                onIonChange={(e) => setEditName(e.detail.value!)}
                placeholder="Enter your name"
                className="ion-margin-bottom"
              />
              <IonInput
                label="Email"
                labelPlacement="floating"
                type="email"
                value={editEmail}
                onIonChange={(e) => setEditEmail(e.detail.value!)}
                placeholder="Enter your email"
                className="ion-margin-bottom"
              />
              <IonButton expand="block" onClick={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </IonButton>
              <IonButton expand="block" fill="outline" onClick={() => setShowEditModal(false)} className="ion-margin-top">
                Cancel
              </IonButton>
            </IonContent>
          </IonModal>

          {/* Loading overlay */}
          <IonLoading
            isOpen={isUpdating}
            message="Updating profile..."
          />

          {/* Toast notifications */}
          <IonToast
            isOpen={!!error}
            message={error || ''}
            duration={3000}
            color="danger"
            onDidDismiss={() => setError(null)}
          />
          <IonToast
            isOpen={!!successMessage}
            message={successMessage || ''}
            duration={3000}
            color="success"
            onDidDismiss={() => setSuccessMessage(null)}
          />
        </IonContent>
      </>
    );
};

export default Account;
