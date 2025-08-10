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
  IonButtons,
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logOut, create, person, camera, image, close, pencil } from "ionicons/icons";
import { updateProfile, updateEmail } from "firebase/auth";
import { auth, db, storage } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { logEvent } from "../../utils/logger";


const Account: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser?.displayName || "");
  const [editEmail, setEditEmail] = useState(currentUser?.email || "");
  const [editBarangay, setEditBarangay] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");



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
          if (!currentUser.displayName && userData.name) {
            setEditName(userData.name);
          }
          setEditBarangay(userData.barangay || "");
          
          setEditAddress(userData.address || "");
          setEditContactNumber(userData.contactNumber || "");
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

      // Update address
      if (editAddress !== "") {
        await updateDoc(doc(db, "users", currentUser.uid), {
          address: editAddress,
        });
        updates.address = editAddress;
      }

      // Update contact number
      if (editContactNumber !== "") {
        await updateDoc(doc(db, "users", currentUser.uid), {
          contactNumber: editContactNumber,
        });
        updates.contactNumber = editContactNumber;
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
          <IonCard>
            <IonCardContent className="ion-padding-vertical">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div>
                  <IonAvatar style={{ height: "100%", padding: "10px" }}>
                    
                      <IonIcon icon={person} style={{ fontSize: "40px" }} />
                   
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
            </IonCardContent>
            <IonButton expand="block" fill="outline" onClick={openEditModal}>
              <IonIcon slot="start" icon={pencil} />
              Edit Profile
            </IonButton>
          </IonCard>
          <IonCardContent>
         
            

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
          <IonToolbar>
            <IonCardTitle
              className="ion-padding"
              style={{ fontWeight: "bold" }}
            >
              Edit Profile
            </IonCardTitle>
            <IonButtons slot="end">
              <IonButton
                expand="block"
                onClick={() => setShowEditModal(false)}
                className="ion-margin-top"
              >
                <IonIcon slot="icon-only" icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>

          <IonContent className="ion-padding">
            <IonInput
              fill="outline"
              label="Name"
              labelPlacement="floating"
              value={editName}
              onIonChange={(e) => setEditName(e.detail.value!)}
              placeholder="Enter your name"
              className="ion-margin-bottom"
            />
            <IonInput
              fill="outline"
              label="Email"
              labelPlacement="floating"
              type="email"
              value={editEmail}
              onIonChange={(e) => setEditEmail(e.detail.value!)}
              placeholder="Enter your email"
              className="ion-margin-bottom"
            />
            <IonInput
              fill="outline"
              label="Address"
              labelPlacement="floating"
              value={editAddress}
              onIonChange={(e) => setEditAddress(e.detail.value!)}
              placeholder="Enter your address"
              className="ion-margin-bottom"
            />
            <IonInput
              fill="outline"
              label="Contact Number"
              labelPlacement="floating"
              type="tel"
              value={editContactNumber}
              onIonChange={(e) => setEditContactNumber(e.detail.value!)}
              placeholder="Enter your contact number"
              className="ion-margin-bottom"
            />

            <IonButton
              expand="block"
              onClick={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Save Changes"}
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
