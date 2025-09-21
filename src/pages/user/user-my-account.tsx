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
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonAvatar,
  IonButtons,
  IonLabel,
  IonText,
  IonAlert,
  IonItemDivider,
  IonChip,
  IonBadge,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logOut, create, person, pencil, call, checkmarkDoneOutline, close, home, mail, lockClosed, logIn, medical, document, checkmark, warning, time } from "ionicons/icons";
import { updateProfile, updateEmail } from "firebase/auth";
import { auth, db, login } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { logEvent } from "../../utils/logger";
import { MaskitoOptions } from '@maskito/core';
import { useMaskito } from '@maskito/react';
import FullRegistrationModal from "./user-register-steps/full-registration-modal";
import { getBarangayNameByCode } from "../../services/addressService";

const Account: React.FC = () => {
  const { logout, currentUser, verificationStatus, refreshUserClaims } = useAuth();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Separate name components
  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editSuffix, setEditSuffix] = useState("");
  const [FullName, setFullName] = useState("");
  const [editGender, setEditGender] = useState(""); // New state for gender
  
  const [editEmail, setEditEmail] = useState(currentUser?.email || "");
  const [editBarangay, setEditBarangay] = useState("");
  const [barangayName, setBarangayName] = useState(""); // New state for barangay name
  const [editAddress, setEditAddress] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [showFullRegistrationModal, setShowFullRegistrationModal] = useState(false);

  const phoneMaskOptions: MaskitoOptions = {
    mask: ['+', '(', '6', '3', ')', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/],
  };
  const phoneMask = useMaskito({ options: phoneMaskOptions });

  // Fetch user data including separate name components
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Set individual name components
          setEditFirstName(userData.firstName || "");
          setEditMiddleName(userData.middleName || "");
          setEditLastName(userData.lastName || "");
          setEditSuffix(userData.suffix || "");
          setEditGender(userData.gender || ""); // Fetch gender
          setEditEmail(userData.email || currentUser.email || "");
          setFullName([userData.firstName, userData.middleName, userData.lastName, userData.suffix].filter(Boolean).join(' '));
          
          setEditBarangay(userData.barangayId || "");
          if (userData.barangayId) {
            const name = await getBarangayNameByCode(userData.barangayId);
            setBarangayName(name || "Not specified");
          } else {
            setBarangayName("Not specified");
          }
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
      // Update email
      if (editEmail !== currentUser.email) {
        await updateEmail(currentUser, editEmail);
      }

      // Update Firestore with only editable fields
      await updateDoc(doc(db, "users", currentUser.uid), {
        email: editEmail,
        contactNumber: editContactNumber,
        gender: editGender,
      });

      logEvent("info", "User profile updated", {
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
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
    setError(null);
    setShowEditModal(true);
  };

  const resetFormData = () => {
    if (!currentUser) return;
    
    // Fetch fresh user data to reset form
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Reset all form fields to original values
          setEditFirstName(userData.firstName || "");
          setEditMiddleName(userData.middleName || "");
          setEditLastName(userData.lastName || "");
          setEditSuffix(userData.suffix || "");
          setEditGender(userData.gender || ""); // Reset gender
          setEditEmail(userData.email || currentUser.email || "");
          setEditBarangay(userData.barangayId || "");
          setEditAddress(userData.address || "");
          setEditContactNumber(userData.contactNumber || "");
        }
      } catch (error) {
        console.error("Error resetting form data:", error);
      }
    };

    fetchUserData();
  };

  const handleModalDismiss = () => {
    resetFormData();
    setShowEditModal(false);
    setError(null);
  };

  const isVerified = verificationStatus === 'verified';

  return (
    <>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>My Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="with-tab-padding">
        <IonCard>
          <IonCard>
            <IonCardContent className="ion-padding-vertical">
              <div style={{ display: "flex", alignItems: "center" }}>
                <div>
                  <IonAvatar style={{ height: "100%", padding: "5px" }}>
                    <IonIcon icon={person} style={{ fontSize: "50px" }} />
                  </IonAvatar>
                </div>
                <div>
                  <IonCardTitle>
                    <div style={{ fontWeight: "bold" }}>
                      {FullName || "No Name Provided"}
                    </div>
                  </IonCardTitle>
                  <IonCardSubtitle>
                    <div style={{ color: "#666" }}>
                      Resident of Barangay {barangayName || "Not specified"}
                    </div>
                  </IonCardSubtitle>
                  <IonChip color={verificationStatus === 'verified' ? 'success' : verificationStatus === 'pending' ? 'warning' : 'warning'}>
                    <IonIcon icon={verificationStatus === 'verified' ? checkmark : verificationStatus === 'pending' ? time : warning} />
                    <IonLabel>{verificationStatus || "Unverified"}</IonLabel>
                  </IonChip>
                </div>
              </div>
            </IonCardContent>
            <IonButton expand="block" fill="outline" onClick={openEditModal}>
              <IonIcon slot="start" icon={pencil} />
              Edit Profile
            </IonButton>
          </IonCard>

          {/* Full Registration Card for Unverified Users */}
          {verificationStatus !== 'verified' && verificationStatus !== 'pending' && (
            <IonCard color={"warning"}>
              <IonCardContent className="ion-padding-vertical">
                <div style={{ textAlign: 'center' }}>
                  <IonIcon
                    icon={document}
                    style={{ fontSize: '48px', color: 'var(--ion-color-warning-contrast)', marginBottom: '20px' }}
                  />
                  <IonCardTitle style={{ color: 'var(--ion-color-warning-contrast)' }}>
                    Complete Your Registration
                  </IonCardTitle>
                  <IonText style={{ color: 'var(--ion-color-warning-contrast)' }}>
                    <p>To access all features, please complete your full registration with address details and document verification.</p>
                  </IonText>
                  <IonButton
                    expand="block"
                    shape="round"
                    color="light"
                    onClick={() => setShowFullRegistrationModal(true)}
                    className="ion-margin-top"
                  >
                    <IonIcon slot="start" icon={document} />
                    Full Registration
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Pending Verification Card */}
          {verificationStatus === 'pending' && (
            <IonCard color="secondary">
              <IonCardContent className="ion-padding-vertical">
                <div style={{ textAlign: 'center' }}>
                  <IonIcon
                    icon={checkmarkDoneOutline}
                    style={{ fontSize: '48px', color: 'var(--ion-color-secondary-contrast)', marginBottom: '20px' }}
                  />
                  <IonCardTitle style={{ color: 'var(--ion-color-secondary-contrast)' }}>
                    Registration Submitted
                  </IonCardTitle>
                  <IonText style={{ color: 'var(--ion-color-secondary-contrast)' }}>
                    <p>Your full registration has been submitted and is pending admin verification. You will receive a notification once it's approved.</p>
                  </IonText>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          <IonCardContent>
             <IonItemDivider>
              <IonLabel>Account Settings</IonLabel>
            </IonItemDivider>
            <IonItem detail={false} button={isVerified}>
              <IonIcon color={isVerified ? 'dark' : 'medium'} slot="start" icon={medical} />
              <IonLabel color={isVerified ? 'primary' : 'medium'}>Create My Medical Record</IonLabel>
            </IonItem>
             <IonItem detail={false} button>
              <IonIcon slot="start" icon={person} />
              <IonLabel>Personal Info</IonLabel>
            </IonItem>
            <IonItem detail={false} button>
              <IonIcon slot="start" icon={mail} />
              <IonLabel>Account Info</IonLabel>
            </IonItem>
            <IonItemDivider>
              <IonLabel>Security</IonLabel>
            </IonItemDivider>
            <IonItem detail={false} button>
              <IonIcon slot="start" icon={logIn} />
              <IonLabel>Recent Logins</IonLabel>
            </IonItem>
            {/* <IonItem detail={false} button>
              <IonIcon slot="start" icon={lockClosed} />
              <IonLabel>Account Info</IonLabel>
            </IonItem> */}
            <IonItem detail={false} button id="user-logout">
              <IonIcon slot="start"  icon={logOut} />
              Logout
            </IonItem>
          </IonCardContent>
        </IonCard>

         <IonAlert
         trigger="user-logout"
         backdropDismiss={false}
                header="Are you sure?"
                message="Do you really want to log out?"
                buttons={[
                  {
                    text: "Cancel",
                    role: "cancel",
                    handler: () => {
                      console.log("Alert canceled");
                    },
                  },
                  {
                    text: "OK",
                    role: "confirm",
                    handler: () => {
                      handleLogout();
                    },
                  },
                ]}
                onDidDismiss={({ detail }) =>
                  console.log(`Dismissed with role: ${detail.role}`)
                }
              ></IonAlert>

        {/* Edit Profile Modal with separate name components */}
        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => handleModalDismiss()}
        >
          <IonToolbar>
            <IonCardTitle className="ion-padding" style={{ fontWeight: "bold" }}>
              Edit Profile
            </IonCardTitle>
            <IonButtons slot="end">
              <IonButton shape="round" onClick={() => handleModalDismiss()}>
                <IonIcon icon={close} slot="end"  />
              </IonButton>
            </IonButtons>
          </IonToolbar>

          <IonContent className="ion-padding">
            
            <IonInput
              fill="outline"
              label="First Name"
              labelPlacement="floating"
              value={editFirstName}
              onIonChange={(e) => setEditFirstName(e.detail.value!)}
              placeholder="Enter first name"
              className="ion-margin-bottom"
              readonly={true}
            >
              <IonIcon slot="start" icon={person}></IonIcon>
            </IonInput>
            
            
            <IonInput
              fill="outline"
              label="Middle Name"
              labelPlacement="floating"
              value={editMiddleName}
              onIonChange={(e) => setEditMiddleName(e.detail.value!)}
              placeholder="Enter middle name"
              className="ion-margin-bottom"
              readonly={true}
               >
              <IonIcon slot="start" icon={person}></IonIcon>
            </IonInput>
            <IonInput
              fill="outline"
              label="Last Name"
              labelPlacement="floating"
              value={editLastName}
              onIonChange={(e) => setEditLastName(e.detail.value!)}
              placeholder="Enter last name"
              className="ion-margin-bottom"
              readonly={true}
               >
              <IonIcon slot="start" icon={person}></IonIcon>
            </IonInput>
            <IonInput
              fill="outline"
              label="Suffix"
              labelPlacement="floating"
              value={editSuffix}
              onIonChange={(e) => setEditSuffix(e.detail.value!)}
              placeholder="Enter suffix (optional)"
              className="ion-margin-bottom"
              readonly={true}
               >
              <IonIcon slot="start" icon={person}></IonIcon>
            </IonInput>
            <IonSelect
              fill="outline"
              label="Gender"
              labelPlacement="floating"
              value={editGender}
              onIonChange={(e: CustomEvent) => setEditGender(e.detail.value)}
              placeholder="Select gender"
              className="ion-margin-bottom"
            >
              <IonSelectOption value="Male">Male</IonSelectOption>
              <IonSelectOption value="Female">Female</IonSelectOption>
            </IonSelect>
            <IonInput
              fill="outline"
              label="Email"
              labelPlacement="floating"
              type="email"
              value={editEmail}
              onIonChange={(e) => setEditEmail(e.detail.value!)}
              placeholder="Enter your email"
              className="ion-margin-bottom"
               >
              <IonIcon slot="start" icon={mail}></IonIcon>
            </IonInput>
            <IonInput
              fill="outline"
              label="Address"
              labelPlacement="floating"
              value={editAddress}
              onIonChange={(e) => setEditAddress(e.detail.value!)}
              placeholder="Enter your address"
              className="ion-margin-bottom"
              readonly={true}
               >
              <IonIcon slot="start" icon={home}></IonIcon>
            </IonInput>
            <IonInput
              fill="outline"
              label="Contact Number"
              labelPlacement="floating"
              value={editContactNumber}
              onIonChange={(e) => setEditContactNumber(e.detail.value!)}
              placeholder="+(63) 123-456-7890"
              className="ion-margin-bottom"
               >
              <IonIcon slot="start" icon={call}></IonIcon>
            </IonInput>

            <IonButton
              shape="round"
              expand="block"
              className="ion-padding-vertical"
              onClick={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonLoading isOpen={isUpdating} message="Updating profile..." />
        <IonLoading isOpen={showLoading} message="Logging out..." />
        <IonToast isOpen={!!error} message={error || ""} duration={3000} color="danger" />
        <IonToast isOpen={!!successMessage} message={successMessage || ""} duration={3000} color="success" />

        {/* Full Registration Modal */}
        <FullRegistrationModal
          isOpen={showFullRegistrationModal}
          onDidDismiss={() => {
            setShowFullRegistrationModal(false);
            refreshUserClaims();
          }}
        />
      </IonContent>
    </>
  );
};

export default Account;
