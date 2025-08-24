import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonItem,
  IonLabel,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonChip,
  IonBadge,
  IonText,
  IonLoading,
  IonToast,
  IonDatetimeButton,
  IonPopover,
  IonActionSheet
} from '@ionic/react';
import { add, search, close, create, trash, pencil, notifications } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineService } from '../../services/medicineService'; // Import MedicineService
import { LogService } from '../../services/logService'; // Import LogService
import { BARANGAYS } from '../../constants/barangays';
import { Medicine } from '../../types/medicineRequests'; // Import Medicine interface
import { Notification } from '../../types/notifications'; // Import Notification interface
import RHUMedicineModal from '../../components/RHUMedicineModal'; // Import RHU Medicine Modal

const medicineService = MedicineService.getInstance();
const logService = LogService.getInstance();

const OTC_MEDICINES = [
  'Paracetamol',
  'Ibuprofen',
  'Aspirin',
  'Acetaminophen',
  'Antacid',
  'Cough Syrup',
  'Vitamin C',
  'Multivitamins',
  'Vitamin D',
  'Vitamin B Complex',
  'Zinc',
  'Iron',
  'Calcium',
  'Magnesium',
  'Probiotics',
  'Antihistamine',
  'Loperamide',
  'ORS',
  'Betadine',
  'Hydrogen Peroxide',
  'Alcohol',
  'Bandage',
  'Cotton',
  'Gauze',
  'Medical Tape'
];

const Medicine_Inventory: React.FC = () => {
  const [expiryNotifications, setExpiryNotifications] = useState<Notification[]>([]); // New state for notifications
  const { currentUser } = useAuth();
  const [selectedSegment, setSelectedSegment] = useState('rhu');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedLocationBeforeModal, setSelectedLocationBeforeModal] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRHUModal, setShowRHUModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false); // New state for notifications modal
  const [searchText, setSearchText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Form states
  const [medicineName, setMedicineName] = useState('');
  const [medicineType, setMedicineType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const medicineTypes = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Ointment',
    'Cream',
    'Drops',
    'Inhaler',
    'Suppository',
    'Other'
  ];

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchText, selectedSegment]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const medicineData = await medicineService.getAllMedicines();
      setMedicines(medicineData);
      
      if (currentUser) {
        await logService.logActivity({
          action: 'view_medicine_inventory',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'unknown@email.com',
          role: 'superadmin',
          details: {
            message: 'Fetched medicine inventory',
            count: medicineData.length,
            location: selectedSegment
          }
        });
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setToastMessage('Error loading medicines');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filterMedicines = () => {
    let filtered = medicines;
    
    if (selectedSegment !== 'all') {
      if (selectedSegment === 'rhu') {
        filtered = filtered.filter(med => med.location === 'rhu');
      } else {
        filtered = filtered.filter(med => med.barangay === selectedSegment);
      }
    }

    if (searchText) {
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(searchText.toLowerCase()) ||
        med.type.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredMedicines(filtered);
  };

  const validateOTCMedicine = (name: string): boolean => {
    const normalizedName = name.toLowerCase().trim();
    return OTC_MEDICINES.some(otc => 
      normalizedName.includes(otc.toLowerCase()) || 
      otc.toLowerCase().includes(normalizedName)
    );
  };

  const handleAddMedicine = async () => {
    if (!medicineName || !medicineType || !quantity || !expiryDate) {
      setToastMessage('Please fill all required fields');
      setShowToast(true);
      return;
    }

    if (!validateOTCMedicine(medicineName)) {
      setToastMessage('This system only accepts over-the-counter (OTC) medicines. Please check the medicine name.');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const newMedicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'> = {
        name: medicineName,
        type: medicineType,
        quantity: parseInt(quantity),
        expiryDate: new Date(expiryDate),
        location: selectedLocation,
        barangay: selectedLocation === 'barangay' ? selectedBarangay : undefined,
      };

      const medicineId = await medicineService.addMedicine(newMedicine);

      if (currentUser) {
        await logService.logActivity({
          action: 'add_medicine',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'unknown@email.com',
          role: 'superadmin',
          details: {
            medicineId: medicineId,
            medicineName: newMedicine.name,
            type: newMedicine.type,
            quantity: newMedicine.quantity,
            location: newMedicine.location,
            barangay: newMedicine.barangay,
            message: `Added ${newMedicine.quantity} units of ${newMedicine.name} to inventory.`
          }
        });
      }

      setToastMessage('Medicine added successfully');
      setShowToast(true);
      resetForm();
      setShowModal(false);
      fetchMedicines();
    } catch (error) {
      console.error('Error adding medicine:', error);
      setToastMessage('Error adding medicine');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRHUMedicine = async () => {
    if (!medicineName || !medicineType || !quantity || !expiryDate) {
      setToastMessage('Please fill all required fields');
      setShowToast(true);
      return;
    }

    if (!validateOTCMedicine(medicineName)) {
      setToastMessage('This system only accepts over-the-counter (OTC) medicines. Please check the medicine name.');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const newMedicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'> = {
        name: medicineName,
        type: medicineType,
        quantity: parseInt(quantity),
        expiryDate: new Date(expiryDate),
        location: 'rhu',
        barangay: undefined,
      };

      const medicineId = await medicineService.addMedicine(newMedicine);

      if (currentUser) {
        await logService.logActivity({
          action: 'add_medicine',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'unknown@email.com',
          role: 'superadmin',
          details: {
            medicineId: medicineId,
            medicineName: newMedicine.name,
            type: newMedicine.type,
            quantity: newMedicine.quantity,
            location: 'rhu',
            message: `Added ${newMedicine.quantity} units of ${newMedicine.name} to RHU inventory.`
          }
        });
      }

      setToastMessage('Medicine added to RHU successfully');
      setShowToast(true);
      resetForm();
      setShowRHUModal(false);
      fetchMedicines();
    } catch (error) {
      console.error('Error adding RHU medicine:', error);
      setToastMessage('Error adding medicine to RHU');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMedicineName('');
    setMedicineType('');
    setQuantity('');
    setExpiryDate('');
    setSelectedLocation('rhu');
    setSelectedBarangay('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: 'danger', text: 'Expired' };
    if (diffDays <= 30) return { color: 'warning', text: 'Expiring Soon' };
    return { color: 'success', text: 'Valid' };
  };

  const fetchExpirationNotifications = () => {
    const newNotifications: Notification[] = [];
    // Only check RHU medicines for notifications
    const rhuMedicines = medicines.filter(med => med.location === 'rhu');
    
    rhuMedicines.forEach(medicine => {
      const expiryStatus = getExpiryStatus(medicine.expiryDate);
      if (expiryStatus.color === 'danger' || expiryStatus.color === 'warning') {
        newNotifications.push({
          id: medicine.id,
          userId: currentUser?.uid || '',
          userEmail: currentUser?.email || 'unknown@email.com',
          type: 'system',
          title: `Medicine Expiry Alert`,
          message: `${medicine.name} is ${expiryStatus.text.toLowerCase()} - expires on ${formatDate(medicine.expiryDate)}`,
          timestamp: new Date(),
          read: false,
          metadata: {
            medicineName: medicine.name,
            // Removed expiryDate as it is not part of the Notification interface
          }
        });
      }
    });
    setExpiryNotifications(newNotifications);
  };

  const handleNotificationButtonClick = () => {
    fetchExpirationNotifications();
    setShowNotificationsModal(true);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Medicine Inventory Management</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleNotificationButtonClick} shape='round'>
              <IonIcon icon={notifications} slot="start" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonLoading isOpen={loading} message="Loading..." />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        {/* Notifications Modal */}
        <IonModal isOpen={showNotificationsModal} onDidDismiss={() => setShowNotificationsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Medicine Inventory Notifications</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowNotificationsModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {expiryNotifications.length === 0 ? (
              <IonText color="medium">
                <p className="ion-text-center">No expiry notifications at this time.</p>
              </IonText>
            ) : (
              <IonList>
                {expiryNotifications.map((notification) => (
                  <IonItem key={notification.id}>
                    <IonLabel>
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                      <p>
                        <small>
                          {notification.timestamp.toLocaleDateString()} at{' '}
                          {notification.timestamp.toLocaleTimeString()}
                        </small>
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonContent>
        </IonModal>

        <IonItem>
          <IonLabel position="stacked">Select Inventory Location</IonLabel>
          <IonSelect 
            value={selectedSegment} 
            onIonChange={(e) => setSelectedSegment(String(e.detail.value))}
            placeholder="Choose a location"
          >
            <IonSelectOption value="rhu">RHU Inventory</IonSelectOption>
            <IonSelectOption value="all">All Barangays</IonSelectOption>
            {BARANGAYS.map(barangay => (
              <IonSelectOption key={barangay} value={barangay}>{barangay}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value!)}
          placeholder="Search medicines"
          className="ion-margin-top"
        />

        

        <IonGrid>
          <IonRow>
            {filteredMedicines.map((medicine) => {
              const expiryStatus = getExpiryStatus(medicine.expiryDate);
              return (
                <IonCol size="12" size-md="6" size-lg="4" key={medicine.id}>
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>
                        <IonText color={'primary'}>
                          {medicine.name} 
                        </IonText> ({medicine.type})
                        </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        
                        <IonItem className='ion-no-padding'>
                          <IonLabel position="stacked">Quantity</IonLabel>
                          <IonChip color={expiryStatus.color as any}>
                            {medicine.quantity} units
                          </IonChip>
                        </IonItem>
                        <IonItem className='ion-no-padding'>
                          <IonLabel position="stacked">Expiry Date</IonLabel>
                          <IonChip color={expiryStatus.color as any}>
                        {expiryStatus.text}
                      </IonChip>
                        </IonItem>
                     
                      
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              );
            })}
          </IonRow>
          
          {filteredMedicines.length === 0 && (
            <IonRow>
              <IonCol>
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonText color="medium">
                      <p>No medicines found for the selected location.</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}
        </IonGrid>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowActionSheet(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Where will this medicine record be stored?"
          buttons={[
            {
              text: 'RHU Inventory',
              handler: () => {
                setShowRHUModal(true);
              }
            },
            {
              text: 'Specific Barangay Inventory',
              handler: () => {
                setSelectedLocationBeforeModal('barangay');
                setSelectedLocation('barangay');
                setShowModal(true);
              }
            },
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                setShowActionSheet(false);
              }
            }
          ]}
        />

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>New Medicine Record</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Medicine Name *</IonLabel>
                <IonInput 
                  value={medicineName}
                  onIonChange={(e) => setMedicineName(e.detail.value!)}
                  placeholder="Enter OTC medicine name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Type *</IonLabel>
                <IonSelect 
                  value={medicineType} // Changed from setSelectedMedicine to setMedicineType
                  onIonChange={(e) => setMedicineType(e.detail.value)}
                  placeholder="Select type"
                >
                  {medicineTypes.map(type => (
                    <IonSelectOption key={type} value={type}>{type}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Quantity *</IonLabel>
                <IonInput 
                  type="number"
                  value={quantity}
                  onIonChange={(e) => setQuantity(e.detail.value!)}
                  placeholder="Enter quantity"
                />
              </IonItem>

              <IonItem>
                <IonLabel className='ion-padding-bottom' position="stacked">Expiry Date *</IonLabel>
                <IonDatetime
                  className='ion-padding-bottom'
                  presentation="month-year"
                  min={new Date().toISOString()}
                  max={new Date(new Date().getFullYear() + 10, 11, 31).toISOString()}
                  value={expiryDate}
                  onIonChange={(e) => {
                    const value = e.detail.value;
                    if (typeof value === 'string') {
                      setExpiryDate(value);
                    } else if (Array.isArray(value) && value.length > 0) {
                      setExpiryDate(value[0]);
                    } else {
                      setExpiryDate('');
                    }
                  }}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Location *</IonLabel>
                <IonSelect 
                  value={selectedLocation}
                  onIonChange={(e) => setSelectedLocation(e.detail.value)}
                >
                  <IonSelectOption value="rhu">RHU (Default)</IonSelectOption>
                  <IonSelectOption value="barangay">Specific Barangay</IonSelectOption>
                </IonSelect>
              </IonItem>

              {selectedLocation === 'barangay' && (
                <IonItem>
                  <IonLabel position="stacked">Select Barangay *</IonLabel>
                  <IonSelect 
                    value={selectedBarangay}
                    onIonChange={(e) => setSelectedBarangay(e.detail.value)}
                    placeholder="Choose barangay"
                  >
                    {BARANGAYS.map(barangay => (
                      <IonSelectOption key={barangay} value={barangay}>{barangay}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              )}
            </IonList>

            

            <IonButton 
              expand="block" 
              onClick={handleAddMedicine}
              className="ion-margin-top"
            >
              <IonIcon icon={create} slot="start" />
              Add Medicine
            </IonButton>
          </IonContent>
        </IonModal>

        <RHUMedicineModal 
          isOpen={showRHUModal} 
          onClose={() => setShowRHUModal(false)} 
          onMedicineAdded={fetchMedicines} 
          setLoading={setLoading} 
          currentUser={currentUser} 
        />
      </IonContent>
    </IonPage>
  );
};

export default Medicine_Inventory;
