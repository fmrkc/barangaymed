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
  IonToast
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineService } from '../../services/medicineService';
import { Medicine } from '../../types/medicineRequests';
import { medkit, warning, checkmarkCircle, closeCircle } from 'ionicons/icons';
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

  const handleRefresh = () => {
    loadMedicines();
    setToastMessage('Medicine list refreshed');
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Barangay {userBarangay} Inventory</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
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
                    <IonCard>
                      <IonCardHeader>
                        <IonCardTitle>{medicine.name}</IonCardTitle>
                        <IonCardSubtitle>Type: {medicine.type}</IonCardSubtitle>
                      </IonCardHeader>
                      
                      <IonCardContent>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="6">
                              <IonText color="medium">
                                <small>Quantity</small>
                              </IonText>
                              <div>
                                <strong>{medicine.quantity}</strong>
                                <IonBadge 
                                  color={quantityStatus.color} 
                                  style={{ marginLeft: '8px' }}
                                >
                                  {quantityStatus.text}
                                </IonBadge>
                              </div>
                            </IonCol>
                            
                            <IonCol size="6">
                              <IonText color="medium">
                                <small>Location</small>
                              </IonText>
                              <div>
                                <strong>{medicine.location}</strong>
                              </div>
                            </IonCol>
                          </IonRow>
                          
                          <IonRow className="ion-margin-top">
                            <IonCol size="12">
                              <IonText color="medium">
                                <small>Expiry Date</small>
                              </IonText>
                              <div>
                                <IonIcon 
                                  icon={expiryStatus.icon} 
                                  color={expiryStatus.color}
                                  style={{ marginRight: '4px' }}
                                />
                                <strong>{new Date(medicine.expiryDate).toLocaleDateString()}</strong>
                                <IonBadge 
                                  color={expiryStatus.color}
                                  style={{ marginLeft: '8px' }}
                                >
                                  {expiryStatus.text}
                                </IonBadge>
                              </div>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                );
              })}
            </IonRow>
          </IonGrid>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={handleRefresh}>
            <IonIcon icon="refresh" />
          </IonFabButton>
        </IonFab>

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
