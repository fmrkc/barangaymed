import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonModal, IonRow, IonTitle, IonToolbar, useIonLoading, useIonToast } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MedicineService } from '../../services/medicineService';
import { LogService } from '../../services/logService';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Medicine } from '../../types/medicineRequests';

import Page1 from './UserMedRequestSteps/Page1';
import Page2 from './UserMedRequestSteps/Page2';
import Page3 from './UserMedRequestSteps/Page3';
import { close, closeOutline } from 'ionicons/icons';

const medicineService = MedicineService.getInstance();
const logService = LogService.getInstance();

interface UserMedRequestModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserMedRequestModal: React.FC<UserMedRequestModalProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser } = useAuth();
  const [present, dismiss] = useIonLoading();
  const [presentToast] = useIonToast();

  const [step, setStep] = useState(1);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pickupDate, setPickupDate] = useState('');
  const [userDetails, setUserDetails] = useState({
    name: '',
    address: '',
    barangay: ''
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [hasTooManyPendingRequests, setHasTooManyPendingRequests] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchUserDetails();
      checkPendingRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && userDetails.barangay) {
      fetchMedicines();
    }
  }, [currentUser, userDetails.barangay]);

  const checkPendingRequests = async () => {
    if (!currentUser) return;
    
    try {
      const count = await medicineService.getPendingRequestsCount(currentUser.uid);
      setPendingRequestsCount(count);
      setHasTooManyPendingRequests(count >= 3);
    } catch (error) {
      console.error('Error checking pending requests:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const userBarangay = userDetails.barangay;
      const medicineData = await medicineService.getMedicinesByBarangay(userBarangay);
      setMedicines(medicineData);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchUserDetails = async () => {
    setUserDetails({
      name: currentUser?.displayName || currentUser?.email || '',
      address: '',
      barangay: 'Apalit'
    });
  };

  const onNext = () => {
    if (step === 1) {
      if (!selectedMedicine) {
        presentToast({
          message: 'Please select a medicine',
          duration: 3000,
          color: 'danger'
        });
        return;
      }
      // Check if selected medicine has enough quantity
      if (selectedMedicine.quantity <= 0) {
        presentToast({
          message: 'Selected medicine is out of stock.',
          duration: 3000,
          color: 'danger'
        });
        return;
      }
    }
    if (step === 2) {
      if (!quantity || quantity < 1) {
        presentToast({
          message: 'Please enter a valid quantity',
          duration: 3000,
          color: 'danger'
        });
        return;
      }
      if (selectedMedicine && quantity > selectedMedicine.quantity) {
        presentToast({
          message: `Requested quantity (${quantity}) exceeds available stock (${selectedMedicine.quantity}).`,
          duration: 3000,
          color: 'danger'
        });
        return;
      }
      if (!pickupDate) {
        presentToast({
          message: 'Please select a pickup date',
          duration: 3000,
          color: 'danger'
        });
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const onBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const resetForm = () => {
    setStep(1);
    setSelectedMedicine(null);
    setQuantity(1);
    setPickupDate('');
  };

  const submitRequest = async () => {
    if (!selectedMedicine || !currentUser) return;

    // Check if user has too many pending requests
    if (hasTooManyPendingRequests) {
      presentToast({
        message: `You have ${pendingRequestsCount} pending requests. Please wait until they are fulfilled before making new requests.`,
        duration: 3000,
        color: 'danger'
      });
      return;
    }

    await present('Submitting request...');
    try {
      // Check quantity again before final submission to prevent race conditions
      const latestMedicine = await medicineService.getMedicineById(selectedMedicine.id!);
      if (!latestMedicine || quantity > latestMedicine.quantity) {
        dismiss();
        presentToast({
          message: 'Not enough stock available. Please check the quantity.',
          duration: 3000,
          color: 'danger'
        });
        return;
      }

      const requestData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userDetails.name,
        userAddress: userDetails.address,
        userBarangay: userDetails.barangay,
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.name,
        medicineType: selectedMedicine.type,
        quantity: quantity,
        pickupDate: new Date(pickupDate),
        status: 'pending',
        requestDate: serverTimestamp(),
        notes: ''
      };

      await addDoc(collection(db, 'medicineRequests'), requestData);

      // Decrement medicine quantity
      await medicineService.decrementMedicineQuantity(selectedMedicine.id!, quantity);

      // Log inventory change
      await logService.logActivity({
        action: 'medicine_inventory_update',
        userId: currentUser.uid,
        userEmail: currentUser.email || 'unknown@email.com',
        userName: userDetails.name,
        role: 'user',
        details: {
          medicineId: selectedMedicine.id,
          medicineName: selectedMedicine.name,
          quantityChange: -quantity,
          reason: 'request_fulfilled',
          requestId: requestData.medicineId, // Link to the request
          newQuantity: latestMedicine.quantity - quantity // This will be the quantity after decrement
        }
      });

      dismiss();
      presentToast({
        message: 'Medicine request submitted successfully!',
        duration: 3000,
        color: 'success'
      });
      
      // Close modal and reset form
      onDidDismiss();
      resetForm();
    } catch (error) {
      dismiss();
      presentToast({
        message: 'Error submitting request',
        duration: 3000,
        color: 'danger'
      });
      console.error('Error submitting request:', error);
    }
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onDidDismiss}
      className="medicine-request-modal"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Medicine Request</IonTitle>
         <IonButtons slot="end">
                <IonButton onClick={onDidDismiss} shape='round'>
                  <IonIcon icon={close} color='primary' />
                </IonButton>
              </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonGrid fixed>
          <IonRow className="ion-justify-content-center">
            <IonCol>
              <IonCard>
                <IonCardContent>
                  {step === 1 && (
                    <Page1
                      medicines={medicines}
                      selectedMedicine={selectedMedicine}
                      onMedicineSelect={setSelectedMedicine}
                      onNext={onNext}
                      hasTooManyPendingRequests={hasTooManyPendingRequests}
                      pendingRequestsCount={pendingRequestsCount}
                    />
                  )}
                  {step === 2 && (
                    <Page2
                      selectedMedicine={selectedMedicine}
                      quantity={quantity}
                      onQuantityChange={setQuantity}
                      pickupDate={pickupDate}
                      onPickupDateChange={setPickupDate}
                      onNext={onNext}
                      onBack={onBack}
                    />
                  )}
                  {step === 3 && (
                    <Page3
                      userDetails={userDetails}
                      selectedMedicine={selectedMedicine}
                      quantity={quantity}
                      pickupDate={pickupDate}
                      onBack={onBack}
                      onSubmit={submitRequest}
                    />
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default UserMedRequestModal;
