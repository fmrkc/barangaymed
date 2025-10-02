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
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logOut, create, person, logIn, medical, document, checkmark, warning, time, mail, home } from "ionicons/icons";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getBarangayNameByCode } from "../../services/addressService";

const Account: React.FC = () => {
  const { logout, currentUser, verificationStatus, rejectionReason } = useAuth();
  const router = useIonRouter();
  const [showLoading, setShowLoading] = useState(false);
  const [FullName, setFullName] = useState("");
  const [barangayName, setBarangayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

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
          setAddress(userData.address || "Not specified");

          if (userData.barangayId) {
            const name = await getBarangayNameByCode(userData.barangayId);
            setBarangayName(name || "Not specified");
          } else {
            setBarangayName("Not specified");
          }
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
      router.push("/user", "forward");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLoading(false);
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
                      {FullName || "No Name Provided"}
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
            <IonItem detail={false} button={isVerified}>
              <IonIcon slot="start" icon={medical} />
              <IonLabel>Create My Medical Record</IonLabel>
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
            <IonItem detail={false} button>
              <IonIcon slot="start" icon={logIn} />
              <IonLabel>Recent Logins</IonLabel>
            </IonItem>
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

        <IonModal isOpen={showPersonalModal} onDidDismiss={() => setShowPersonalModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Personal Info</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowPersonalModal(false)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonItem>
              <IonLabel>Name: {FullName}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Birthdate: {birthdate}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Gender: {gender}</IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonModal isOpen={showLocationModal} onDidDismiss={() => setShowLocationModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Location Info</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowLocationModal(false)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonItem>
              <IonLabel>Location: {barangayName}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Address: {address}</IonLabel>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonModal isOpen={showAccountModal} onDidDismiss={() => setShowAccountModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Account Info</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowAccountModal(false)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonItem>
              <IonLabel>Email: {currentUser?.email}</IonLabel>
            </IonItem>
            <IonItem>
              <IonButton expand="block">Change Email</IonButton>
            </IonItem>
            <IonItem>
              <IonButton expand="block">Change Password</IonButton>
            </IonItem>
          </IonContent>
        </IonModal>

        <IonLoading isOpen={showLoading} message="Logging out..." />
      </IonContent>
    </>
  );
};

export default Account;