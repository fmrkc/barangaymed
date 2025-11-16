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
  IonPage,
  IonMenuButton,
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { logOut, create, person, logIn, medical, document, checkmark, warning, time, mail, home, heartCircle, ellipse, arrowBack, close } from "ionicons/icons";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
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
      router.push("/superadmin", "forward");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setShowLoading(false);
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
                      Super Admin
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
                
                <IonButton className="ion-padding-vertical" expand="block">Change Password</IonButton>
              
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
