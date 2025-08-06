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
  IonCardSubtitle,
  IonAvatar,
  IonImg,
  IonFab,
  IonFabButton,
  IonProgressBar,
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import LogoutButton from "../../components/LogoutButton";
import { useAuth } from "../../contexts/AuthContext";
import { logOut, create, person, camera, image } from "ionicons/icons";
import { updateProfile, updateEmail } from "firebase/auth";
import { auth, db, storage } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { BARANGAYS } from "../../constants/barangays";
import { logEvent } from "../../utils/logger";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Account: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.displayName || "");
  const [editEmail, setEditEmail] = useState(currentUser?.email || "");
  const [editBarangay, setEditBarangay] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Fetch user data including barangay and profile picture
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEditBarangay(userData.barangay || "");
          setProfilePicture(userData.profilePicture || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    setShowLoading(true);
    try {
      await logout();
      router.push("/user", "forward");
    } catch (error) {
      console.error("Logout error:", error);
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
      const updates: any = {};

      // Update display name
      if (editName.trim() && editName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: editName });
        updates.displayName = editName;
      }

      // Update email
      if (editEmail.trim() && editEmail !== currentUser.email) {
        await updateEmail(currentUser, editEmail);
        updates.email = editEmail;
      }

      // Update barangay
      if (editBarangay !== "") {
        await updateDoc(doc(db, "users", currentUser.uid), {
          barangay: editBarangay,
        });
        updates.barangay = editBarangay;
      }

      // Log profile update
      logEvent("info", "User profile updated", {
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        metadata: {
          action: "profile_update",
          changes: updates,
        },
      });

      setSuccessMessage("Profile updated successfully!");
      setShowEditModal(false);
    } catch (error: any) {
      console.error("Update error:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);

      // Upload the file
      const uploadTask = uploadBytes(storageRef, file);

      // Wait for upload to complete
      await uploadTask;

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user document with new profile picture
      await updateDoc(doc(db, "users", currentUser.uid), {
        profilePicture: downloadURL,
      });

      setProfilePicture(downloadURL);

      // Log profile picture update
      logEvent("info", "Profile picture updated", {
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        metadata: {
          action: "profile_picture_update",
        },
      });

      setSuccessMessage("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openEditModal = () => {
    setEditName(currentUser?.displayName || "");
    setEditEmail(currentUser?.email || "");
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
            <div
              style={{
                display: "flex",
                alignItems: "center"
              }}
            >
              <div>
                <IonAvatar style={{ height: "100%", padding: "10px" }}>
                {profilePicture ? (
                  <IonImg src={profilePicture} alt="Profile" />
                ) : (
                  <IonIcon icon={person} style={{ fontSize: "40px" }} />
                )}
              </IonAvatar>
              </div>
              <div>
                <IonCardTitle>
                  <div style={{ fontWeight: "bold" }}>
                  {currentUser?.displayName || "User Profile"}
                </div>
                </IonCardTitle>
                <IonCardSubtitle>
                  <div style={{ color: "#666" }}>
                  Resident of Barangay {editBarangay || "Not specified"}
                </div>
                </IonCardSubtitle>
                
              </div>
            </div>

            {/* Profile Picture Upload Button (di pa pwede kase may bayad para magstore ng picture) */}
            {/* <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  style={{ display: 'none' }}
                  id="profile-picture-input"
                />
                <IonButton 
                  fill="clear" 
                  onClick={() => document.getElementById('profile-picture-input')?.click()}
                  disabled={isUploading}
                >
                  <IonIcon slot="start" icon={camera} />
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </IonButton>
                {isUploading && <IonProgressBar value={uploadProgress} />} */}

            {/* Barangay Display */}

            <IonButton
              expand="block"
              onClick={openEditModal}
              className="ion-margin-vertical"
            >
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
        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => setShowEditModal(false)}
        >
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

            <IonButton
              expand="block"
              onClick={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => setShowEditModal(false)}
              className="ion-margin-top"
            >
              Cancel
            </IonButton>
          </IonContent>
        </IonModal>

        {/* Loading overlay */}
        <IonLoading isOpen={isUpdating} message="Updating profile..." />

        {/* Logging out loading spinner */}
        <IonLoading
          isOpen={showLoading}
          message="Logging out..."
          onDidDismiss={() => setShowLoading(false)}
        />

        {/* Toast notifications */}
        <IonToast
          isOpen={!!error}
          message={error || ""}
          duration={3000}
          color="danger"
          onDidDismiss={() => setError(null)}
        />
        <IonToast
          isOpen={!!successMessage}
          message={successMessage || ""}
          duration={3000}
          color="success"
          onDidDismiss={() => setSuccessMessage(null)}
        />
      </IonContent>
    </>
  );
};

export default Account;
