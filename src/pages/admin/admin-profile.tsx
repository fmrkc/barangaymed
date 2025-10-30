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
  IonLoading,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonAvatar,
  IonLabel,
  IonAlert,
  IonItemDivider,
  IonChip,
  IonModal,
  IonInput,
  IonButtons,
  IonMenuButton,
  IonPage,
  IonToast, // Added
  useIonToast,
  IonText, // Added
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logOut, create, person, logIn, medical, document, checkmark, warning, time, mail, home, heartCircle, ellipse, arrowBack, close, lockClosed } from "ionicons/icons";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { getBarangayNameByCode, getZipCodeByBarangay, getRegionNameByCode, getProvinceNameByCode, getCityMunNameByCode } from "../../services/addressService";

const Profile: React.FC = () => {
  const { logout, currentUser, verificationStatus, rejectionReason } = useAuth();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState(false);
  const [FullName, setFullName] = useState("");
  const [FullLocation, setFullLocation] = useState("");
  const [barangayName, setBarangayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Change Password States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Close Alert States
  const [showClosePasswordAlert, setShowClosePasswordAlert] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      setIsLoadingUserData(true);
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFullName([userData.firstName, userData.middleName, userData.lastName, userData.suffix].filter(Boolean).join(' '));
          setBirthdate(userData.birthdate || "Not specified");
          setGender(userData.gender || "Not specified");

          let barangayNameTemp = "Not specified";
          let regionName = "Not specified";
          let provinceName = "Not specified";
          let cityMunName = "Not specified";
          let zipCode = userData.zipCode || "Not specified";

          if (userData.barangayId) {
            const name = await getBarangayNameByCode(userData.barangayId);
            barangayNameTemp = name || "Not specified";
          }
          if (userData.selectedRegion) {
            const name = await getRegionNameByCode(userData.selectedRegion);
            regionName = name || "Not specified";
          }
          if (userData.selectedProvince) {
            const name = await getProvinceNameByCode(userData.selectedProvince);
            provinceName = name || "Not specified";
          }
          if (userData.selectedCityMunicipality) {
            const name = await getCityMunNameByCode(userData.selectedCityMunicipality);
            cityMunName = name || "Not specified";
          }
          if (userData.barangayId) {
            const zip = await getZipCodeByBarangay(userData.barangayId);
            zipCode = zip || zipCode;
          }

          setBarangayName(barangayNameTemp);
          setFullLocation([regionName, provinceName, cityMunName, barangayNameTemp, zipCode].filter(Boolean).join(', '));
          setAddress([userData.lotBlkHouseNo, userData.streetName, userData.subdivisionVillageZonePurok].filter(Boolean).join(', ') || userData.address || "Not specified");
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [currentUser, verificationStatus, rejectionReason]);

  const handleLogout = async () => {
    setShowLoading(true);
    try {
      await logout();
      router.push("/admin", "forward");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLoading(false);
    }
  };

  const [present] = useIonToast(); // Initialize useIonToast here

  const handleChangePassword = async () => {
    console.log("handleChangePassword called");
    if (!currentUser || !currentPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError("All fields are required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("New passwords do not match.");
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    try {
      console.log("Re-authenticating user...");
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      console.log("User re-authenticated. Updating password...");
      await updatePassword(currentUser, newPassword);
      console.log("Password updated successfully.");

      // Create a notification for the password change
      if (currentUser) {
        await addDoc(collection(db, "notifications"), {
          userId: currentUser.uid,
          title: "Password Changed",
          message: "Your password was successfully changed.",
          type: "password_changed",
          timestamp: new Date(),
          read: false,
          isShown: true,
        });
      }

      present({
        message: 'Password changed successfully!',
        duration: 2000,
        color: 'success',
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "An unknown error occurred.";
      switch (error.code) {
        case "auth/wrong-password":
          errorMessage = "The current password you entered is incorrect.";
          break;
        case "auth/requires-recent-login":
          errorMessage = "For security, please log out and log back in before changing your password.";
          break;
        case "auth/weak-password":
          errorMessage = "The new password is too weak. Please choose a stronger password.";
          break;
        default:
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          break;
      }
      setChangePasswordError(errorMessage);
    } finally {
      setChangePasswordLoading(false);
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  };

  const isVerified = verificationStatus === 'verified';

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>My Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="with-tab-padding">
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
                      Admin
                    </div>
                  </IonCardSubtitle>
                  <IonChip color={verificationStatus === 'verified' ? 'success' : verificationStatus === 'pending_approval' ? 'warning' : verificationStatus === 'not_submitted' ? 'medium' : 'danger'}>
                    <IonIcon icon={verificationStatus === 'verified' ? checkmark : verificationStatus === 'pending_approval' ? time : verificationStatus === 'not_submitted' ? document : warning} />
                    <IonLabel>{verificationStatus ? (verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)).replace('_', ' ') : "Unverified"}</IonLabel>
                  </IonChip>
                </div>
              </div>
        
             <IonItemDivider>
              <IonLabel>Account Settings</IonLabel>
            </IonItemDivider>
            
            <IonItem detail={false} button onClick={() => setShowPersonalModal(true)}>
              <IonIcon slot="start" icon={person} />
              <IonLabel>Personal Info</IonLabel>
            </IonItem>
            <IonItem detail={false} button onClick={() => setShowLocationModal(true)}>
              <IonIcon slot="start" icon={home} />
              <IonLabel>Location Info</IonLabel>
            </IonItem>
            <IonItem detail={false} button onClick={() => setShowAccountModal(true)}>
              <IonIcon slot="start" icon={mail} />
              <IonLabel>Account Info</IonLabel>
            </IonItem>
          
          </IonCardContent>
        </IonCard>

       
        
         

        <IonModal isOpen={showPersonalModal} onDidDismiss={() => setShowPersonalModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Personal Info</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowPersonalModal(false)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
           <IonCard>
            <IonCardContent>
              <IonItemDivider className="ion-margin-top">Full Name:</IonItemDivider>
            <IonItem>
              <IonLabel style={{ fontWeight: 'bold'}}>
                {FullName || "No Name Provided"}
              </IonLabel>
            </IonItem>
            <IonItemDivider className="ion-margin-top">Birthdate:</IonItemDivider>
            <IonItem>
              <IonLabel style={{ fontWeight: 'bold'}}>
                {birthdate || "Not specified"}
              </IonLabel>
            </IonItem>
            <IonItemDivider className="ion-margin-top">Gender:</IonItemDivider>
            <IonItem>
              <IonLabel style={{ fontWeight: 'bold'}}>
                {gender || "Not specified"}
              </IonLabel>
            </IonItem>
            </IonCardContent>
           </IonCard>
          </IonContent>
        </IonModal>

        <IonModal isOpen={showLocationModal} onDidDismiss={() => setShowLocationModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Location Info</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowLocationModal(false)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonCard>
              <IonCardContent>
                <IonItemDivider className="ion-margin-top">Full Location:</IonItemDivider>
                <IonItem>
                  <IonLabel style={{ fontWeight: 'bold' }}>
                    {FullLocation || "Not specified"}
                  </IonLabel>
                </IonItem>
                <IonItemDivider className="ion-margin-top">Address:</IonItemDivider>
                <IonItem>
                  <IonLabel style={{ fontWeight: 'bold' }}>
                    {address || "Not specified"}
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>
          </IonContent>
        </IonModal>

        <IonModal isOpen={showAccountModal} onDidDismiss={() => setShowAccountModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Account Info</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowAccountModal(false)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonCard>
              <IonCardContent>
                <IonItemDivider className="ion-margin-top">Email:</IonItemDivider>
                <IonItem>
                  <IonLabel style={{ fontWeight: 'bold' }}>
                    {currentUser?.email || "Not specified"}
                  </IonLabel>
                </IonItem>
                 <IonItemDivider className="ion-margin-top">Password:</IonItemDivider>
                
                <IonButton className="ion-padding-vertical" expand="block" onClick={() => setShowChangePasswordModal(true)}>
                  Change Password
                  <IonIcon icon={lockClosed} slot="end" />
                </IonButton>
              
              </IonCardContent>
            </IonCard>
            
          
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showClosePasswordAlert}
          onDidDismiss={() => setShowClosePasswordAlert(false)}
          backdropDismiss={false}
          header="Discard Changes?"
          message="Are you sure you want to close without saving your password changes?"
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Discard",
              role: "confirm",
              handler: () => {
                setShowChangePasswordModal(false);
                setShowClosePasswordAlert(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
                setChangePasswordError(null);
              },
            },
          ]}
        ></IonAlert>

        {/* Change Password Modal */}
        <IonModal isOpen={showChangePasswordModal} onDidDismiss={() => setShowChangePasswordModal(false)} backdropDismiss={false}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Change Password</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowClosePasswordAlert(true)}>
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonCard>
              <IonCardContent>
                <IonItemDivider className="ion-margin-top">Current Password:</IonItemDivider>
                <IonItem lines="none">
                  <IonInput className="ion-margin-bottom" fill="outline" placeholder="Enter old password here" type="password" value={currentPassword} onIonChange={(e) => setCurrentPassword(e.detail.value!)} />
                </IonItem>
                <IonItemDivider className="ion-margin-top">New Password:</IonItemDivider>                
                <IonItem lines="none">
                  <IonInput className="ion-margin-bottom" fill="outline" placeholder="Enter new password here" type="password" value={newPassword} onIonChange={(e) => setNewPassword(e.detail.value!)} />
                </IonItem>
                <IonItemDivider className="ion-margin-top">Confirm New Password:</IonItemDivider>
                <IonItem lines="none">
                  <IonInput className="ion-margin-bottom" fill="outline" placeholder="Enter new password here" type="password" value={confirmNewPassword} onIonChange={(e) => setConfirmNewPassword(e.detail.value!)} />
                </IonItem>

              
                {changePasswordError && <IonText color="danger"><p>{changePasswordError}</p></IonText>}
                <IonButton className="ion-padding-vertical ion-margin-top" shape="round" expand="block" onClick={handleChangePassword} disabled={changePasswordLoading}>
                  {changePasswordLoading ? <IonLoading isOpen={changePasswordLoading} message={'Updating...'} /> : "Update Password"}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonContent>
        </IonModal>

        <IonLoading isOpen={showLoading} message="Logging out..." />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
