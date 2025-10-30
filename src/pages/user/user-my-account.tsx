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
  IonText,
  IonToast,
  useIonToast,
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logOut, person, medical, document, checkmark, warning, time, mail, home, close, lockClosed } from "ionicons/icons";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getBarangayNameByCode, getZipCodeByBarangay, getRegionNameByCode, getProvinceNameByCode, getCityMunNameByCode } from "../../services/addressService";
import CreateMedicalRecord from "./medical-record/create-medical-record";
import ViewMedicalRecord from "./medical-record/view-medical-record";
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth";

const Account: React.FC = () => {
  const { logout, currentUser, verificationStatus, rejectionReason } = useAuth();
  const router = useIonRouter();
  const [present] = useIonToast();
  const [showLoading, setShowLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [fullLocation, setFullLocation] = useState("");
  const [barangayName, setBarangayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [hasMedicalRecord, setHasMedicalRecord] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState("");
  const [verifiedAt, setVerifiedAt] = useState("");

  // Change Email States
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);

  // Change Password States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Close Alert States
  const [showCloseEmailAlert, setShowCloseEmailAlert] = useState(false);
  const [showClosePasswordAlert, setShowClosePasswordAlert] = useState(false);


  const fetchMedicalRecordStatus = async () => {
    if (!currentUser) return;
    const medicalRecordDoc = await getDoc(doc(db, "medicalRecords", currentUser.uid));
    setHasMedicalRecord(medicalRecordDoc.exists());
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      setIsLoadingUserData(true);
      try {
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

          if (userData.barangayName) {
            barangayNameTemp = userData.barangayName;
          } else if (userData.barangayId) {
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
          setVerifiedBy(userData.verifiedBy || "N/A");
          setVerifiedAt(userData.verifiedAt ? new Date(userData.verifiedAt.toDate()).toLocaleString() : "N/A");
        }

        fetchMedicalRecordStatus();

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
      router.push("/user", "forward");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!currentUser || !newEmail || !currentPasswordForEmail) {
      setChangeEmailError("All fields are required.");
      return;
    }
    setChangeEmailLoading(true);
    setChangeEmailError(null);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPasswordForEmail);
      await reauthenticateWithCredential(currentUser, credential);
      await updateEmail(currentUser, newEmail);
      setShowChangeEmailModal(false);
      // Optionally, show a success message
    } catch (error: unknown) {
      if (error instanceof Error) {
        setChangeEmailError(error.message);
      } else {
        setChangeEmailError("An unknown error occurred.");
      }
    } finally {
      setChangeEmailLoading(false);
      setShowChangeEmailModal(false);
      setCurrentPasswordForEmail("");
      setNewEmail("");
    }
  };

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
      present({
        message: 'Password changed successfully!',
        duration: 2000,
        color: 'success',
      });
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      if (error instanceof Error) {
        setChangePasswordError(error.message);
      } else {
        setChangePasswordError("An unknown error occurred.");
      }
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
    <>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>My Account</IonTitle>
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
                      {fullName || "No Name Provided"}
                    </div>
                  </IonCardTitle>
                  <IonCardSubtitle>
                    <div style={{ color: "#666" }}>
                      Resident of Barangay {barangayName || "Not specified"}
                    </div>
                  </IonCardSubtitle>
                  <IonChip color={verificationStatus === 'verified' ? 'success' : verificationStatus === 'pending_approval' ? 'warning' : verificationStatus === 'not_submitted' ? 'medium' : 'danger'}>
                    <IonIcon icon={verificationStatus === 'verified' ? checkmark : verificationStatus === 'pending_approval' ? time : verificationStatus === 'not_submitted' ? document : warning} />
                    <IonLabel>{verificationStatus ? (verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)).replace('_', ' ') : "Unverified"}</IonLabel>
                  </IonChip>
                </div>
              </div>
        
             <IonItemDivider>
              <IonLabel>BarangayMed+ Features</IonLabel>
            </IonItemDivider>
            <IonItem 
              detail={false} 
              button={isVerified}
              onClick={() => {
                if (isVerified) {
                  setShowMedicalRecordModal(true);
                }
              }}
            >
              <IonIcon slot="start" icon={medical} />
              <IonLabel>{hasMedicalRecord ? 'View/Edit My Medical Record' : 'Create My Medical Record'}</IonLabel>
            </IonItem>
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
            <IonItemDivider>
              <IonLabel>Security</IonLabel>
            </IonItemDivider>

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
            },
            {
              text: "OK",
              role: "confirm",
              handler: handleLogout,
            },
          ]}
        ></IonAlert>

        <IonAlert
          isOpen={showCloseEmailAlert}
          onDidDismiss={() => setShowCloseEmailAlert(false)}
          backdropDismiss={false}
          header="Discard Changes?"
          message="Are you sure you want to close without saving your email changes?"
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Discard",
              role: "confirm",
              handler: () => {
                setShowChangeEmailModal(false);
                setShowCloseEmailAlert(false);
                setNewEmail("");
                setCurrentPasswordForEmail("");
                setChangeEmailError(null);
              },
            },
          ]}
        ></IonAlert>

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
        
        {hasMedicalRecord ? (
          <ViewMedicalRecord 
            isOpen={showMedicalRecordModal} 
            onDidDismiss={() => {
              setShowMedicalRecordModal(false);
              fetchMedicalRecordStatus();
            }} 
          />
        ) : (
          <CreateMedicalRecord 
            isOpen={showMedicalRecordModal} 
            onDidDismiss={() => {
              setShowMedicalRecordModal(false);
              fetchMedicalRecordStatus();
            }} 
          />
        )}

        <IonModal isOpen={showPersonalModal} onDidDismiss={() => setShowPersonalModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Personal Info</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowPersonalModal(false)}>
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
           <IonCard>
            <IonCardContent>
              <IonItemDivider className="ion-margin-top">Full Name:</IonItemDivider>
            <IonItem>
              <IonLabel style={{ fontWeight: 'bold'}}>
                {fullName || "No Name Provided"}
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
              <IonButton slot="end" fill="clear" onClick={() => setShowLocationModal(false)}>
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonCard>
              <IonCardContent>
                <IonItemDivider className="ion-margin-top">Full Location:</IonItemDivider>
                <IonItem>
                  <IonLabel style={{ fontWeight: 'bold' }}>
                    {fullLocation || "Not specified"}
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
              <IonButton slot="end" fill="clear" onClick={() => setShowAccountModal(false)}>
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
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
                <IonButton className="ion-padding-vertical" expand="block" onClick={() => setShowChangeEmailModal(true)}>
                  Change Email
                  <IonIcon icon={mail} slot="end" />
                </IonButton>
                 <IonItemDivider className="ion-margin-top">Password:</IonItemDivider>
                
                <IonButton className="ion-padding-vertical" expand="block" onClick={() => setShowChangePasswordModal(true)}>
                  Change Password
                  <IonIcon icon={lockClosed} slot="end" />
                </IonButton>

                {verificationStatus === 'verified' && (
                  <>
                    <IonItemDivider className="ion-margin-top">Verification Details:</IonItemDivider>
                    <IonItem>
                      <IonLabel>Verified By:</IonLabel>
                      <IonText slot="end" style={{ fontWeight: 'bold' }}>{verifiedBy}</IonText>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Verified At:</IonLabel>
                      <IonText slot="end" style={{ fontWeight: 'bold' }}>{verifiedAt}</IonText>
                    </IonItem>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </IonContent>
        </IonModal>

        {/* Change Email Modal */}
        <IonModal isOpen={showChangeEmailModal} onDidDismiss={() => setShowChangeEmailModal(false)} backdropDismiss={false}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>Change Email</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowCloseEmailAlert(true)}>
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonCard>
              <IonCardContent>
                <IonItemDivider className="ion-margin-top">New Email:</IonItemDivider>
                <IonItem>
                  <IonInput fill="outline" type="email" value={newEmail} onIonChange={(e) => setNewEmail(e.detail.value!)} />
                </IonItem>
                <IonItemDivider className="ion-margin-top">Current Password:</IonItemDivider>
                <IonItem>
                  <IonInput fill="outline" type="password" value={currentPasswordForEmail} onIonChange={(e) => setCurrentPasswordForEmail(e.detail.value!)} />
                </IonItem>


                {changeEmailError && <IonText color="danger"><p>{changeEmailError}</p></IonText>}
                <IonButton className="ion-padding-vertical ion-margin-top" shape="round" expand="block" onClick={handleChangeEmail} disabled={changeEmailLoading}>
                  {changeEmailLoading ? <IonLoading isOpen={changeEmailLoading} message={'Updating...'} /> : "Update Email"}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonContent>
        </IonModal>

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
    </>
  );
};

export default Account;