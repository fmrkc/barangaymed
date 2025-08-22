import { 
  IonButtons, 
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonIcon,
  IonAlert,
  IonFab,
  IonFabButton,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineService } from '../../services/medicineService';
import { Medicine } from '../../types/medicineRequests';
import { medkit, warning, checkmarkCircle, closeCircle, notifications, notificationsCircle, notificationsOff, barbell, alertCircle, ellipsisVertical, open } from 'ionicons/icons';
import './admin-med-inventory.css';

const Admin_Med_Inventory: React.FC = () => {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userBarangay, setUserBarangay] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [notifications, setNotifications] = useState<Array<{
    type: 'expiry' | 'lowStock';
    message: string;
    medicineName: string;
  }>>([]);

  const medicineService = MedicineService.getInstance();

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      
      // Get user barangay from user profile
      if (currentUser) {
        const userDoc = await medicineService.getUserBarangay(currentUser.uid);
        if (userDoc) {
          setUserBarangay(userDoc.barangay || '');
          const medicinesData = await medicineService.getMedicinesByBarangay(userDoc.barangay);
          setMedicines(medicinesData);
          setFilteredMedicines(medicinesData);
        }
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
      setAlertMessage('Failed to load medicines. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Add method to get user barangay to MedicineService
  const getUserBarangay = async (uid: string) => {
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../../firebaseConfig');
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.data() || {};
  };

  // Extend MedicineService with getUserBarangay method
  useEffect(() => {
    const extendedService = MedicineService.getInstance() as any;
    extendedService.getUserBarangay = getUserBarangay;
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [searchTerm, medicines]);

  const filterMedicines = () => {
    if (!searchTerm.trim()) {
      setFilteredMedicines(medicines);
      return;
    }

    const filtered = medicines.filter(medicine => {
      const searchLower = searchTerm.toLowerCase();
      return (
        medicine.name.toLowerCase().includes(searchLower) ||
        medicine.type.toLowerCase().includes(searchLower)
      );
    });
    setFilteredMedicines(filtered);
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: 'danger', text: 'Expired', icon: closeCircle };
    } else if (diffDays <= 30) {
      return { color: 'warning', text: `${diffDays} days left`, icon: warning };
    } else {
      return { color: 'success', text: 'Valid', icon: checkmarkCircle };
    }
  };

  const getQuantityStatus = (quantity: number) => {
    if (quantity <= 5) {
      return { color: 'danger', text: 'Low Stock' };
    } else if (quantity <= 20) {
      return { color: 'warning', text: 'Medium Stock' };
    } else {
      return { color: 'success', text: 'Good Stock' };
    }
  };

  const checkForNotifications = () => {
    const newNotifications: Array<{
      type: 'expiry' | 'lowStock';
      message: string;
      medicineName: string;
    }> = [];

    medicines.forEach(medicine => {
      // Check for expiry notifications
      const expiryStatus = getExpiryStatus(medicine.expiryDate);
      if (expiryStatus.color === 'warning' || expiryStatus.color === 'danger') {
        newNotifications.push({
          type: 'expiry',
          message: `${expiryStatus.text} - expires ${new Date(medicine.expiryDate).toLocaleDateString()}`,
          medicineName: medicine.name
        });
      }

      // Check for low stock notifications
      if (medicine.quantity <= 5) {
        newNotifications.push({
          type: 'lowStock',
          message: `Low stock - only ${medicine.quantity} units remaining`,
          medicineName: medicine.name
        });
      }
    });

    setNotifications(newNotifications);
  };

  const handleRequestMedicine = async (medicine: Medicine) => {
    try {
      const { db } = await import('../../firebaseConfig');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const requestData = {
        adminId: currentUser?.uid,
        adminEmail: currentUser?.email,
        barangay: userBarangay,
        medicineId: medicine.id,
        medicineName: medicine.name,
        medicineType: medicine.type,
        currentQuantity: medicine.quantity,
        status: 'pending',
        requestDate: serverTimestamp(),
        requestType: 'shortage_notification',
        notes: `Barangay ${userBarangay} has a shortage of ${medicine.name} (${medicine.type}). Current stock: ${medicine.quantity} units.`
      };

      await addDoc(collection(db, 'adminMedicineRequests'), requestData);
      
      setToastMessage(`Request sent to Super Admin for ${medicine.name}`);
      setShowToast(true);
    } catch (error) {
      console.error('Error sending request:', error);
      setAlertMessage('Failed to send request. Please try again.');
      setShowAlert(true);
    }
  };

  const handleRefresh = () => {
    loadMedicines();
    setToastMessage('Medicine list refreshed');
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot='start'>
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Barangay {userBarangay} Inventory</IonTitle>
          <IonButtons slot='end'>
            <IonButton shape='round'>
              <IonIcon icon='notifications' slot="start" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <IonSearchbar
          value={searchTerm}
          onIonChange={(e) => setSearchTerm(e.detail.value!)}
          placeholder="Search by name or type..."
          debounce={300}
          animated
        />

        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Loading medicines...</p>
            </IonText>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="ion-text-center ion-padding">
            <IonIcon icon={medkit} style={{ fontSize: '48px', color: 'var(--ion-color-medium)' }} />
            <IonText color="medium">
              <h3>No medicines found</h3>
              <p>{searchTerm ? 'No medicines match your search criteria.' : 'No medicines registered for this barangay.'}</p>
            </IonText>
          </div>
        ) : (
          <IonGrid>
            <IonRow>
              {filteredMedicines.map((medicine) => {
                const expiryStatus = getExpiryStatus(medicine.expiryDate);
                const quantityStatus = getQuantityStatus(medicine.quantity);
                
                return (
                  <IonCol size="12" size-md="6" size-lg="4" key={medicine.id}>
                    <IonCard button>
                      <IonCardHeader>
                        <IonCardTitle>
                          <IonText color={"primary"}>{medicine.name}</IonText>
                        </IonCardTitle>
                        <IonCardSubtitle>Type: {medicine.type}</IonCardSubtitle>
                      </IonCardHeader>

                      <IonCardContent>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="6">
                              <IonItem>
                                <IonLabel>
                                  <small>In stock:</small>
                                  <br /> {medicine.quantity}
                                </IonLabel>
                                <IonBadge color={quantityStatus.color}>
                                  {quantityStatus.text}
                                </IonBadge>
                              </IonItem>
                            </IonCol>
                            <IonCol size="6">
                              <IonItem>
                                <IonLabel>
                                  <small>Expiry Date:</small>
                                  <br />
                                  {new Date(
                                    medicine.expiryDate
                                  ).toLocaleDateString()}
                                </IonLabel>
                                <IonBadge color={expiryStatus.color}>
                                  <IonIcon
                                    icon={expiryStatus.icon}
                                    slot="start"
                                  />
                                  {expiryStatus.text}
                                </IonBadge>
                              </IonItem>
                            </IonCol>
                          </IonRow>
                        </IonGrid>

                        

                        {(medicine.quantity <= 10 ||
                          getExpiryStatus(medicine.expiryDate).color ===
                            "warning" ||
                          getExpiryStatus(medicine.expiryDate).color ===
                            "danger") && (
                          <IonButton
                            expand="block"
                            color="primary"
                            onClick={() => handleRequestMedicine(medicine)}
                            className="ion-margin-top"
                          >
                            Request from Super Admin
                            <IonIcon icon={alertCircle} slot="end" />
                          </IonButton>
                        )}
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                );
              })}
            </IonRow>
          </IonGrid>
        )}

    

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Error"
          message={alertMessage}
          buttons={['OK']}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Admin_Med_Inventory;
