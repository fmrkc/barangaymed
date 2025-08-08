import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, useIonToast } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

import Page1 from './UserMedRequestSteps/Page1';
import Page2 from './UserMedRequestSteps/Page2';
import Page3 from './UserMedRequestSteps/Page3';

const UserMedRequest: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useIonRouter();
  const [present, dismiss] = useIonLoading();
  const [presentToast] = useIonToast();

  const [step, setStep] = useState(1);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [pickupDate, setPickupDate] = useState('');
  const [userDetails, setUserDetails] = useState({
    name: '',
    address: '',
    barangay: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchUserDetails();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && userDetails.barangay) {
      fetchMedicines();
    }
  }, [currentUser, userDetails.barangay]);

  const fetchMedicines = async () => {
    try {
      const userBarangay = userDetails.barangay;
      
      const q = query(
        collection(db, 'medicines'),
        where('barangay', '==', userBarangay)
      );
      const querySnapshot = await getDocs(q);
      const medicineData: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        medicineData.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          quantity: data.quantity,
          expiryDate: data.expiryDate.toDate(),
          location: data.location,
          barangay: data.barangay
        });
      });
      setMedicines(medicineData);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchUserDetails = async () => {
    // This would typically fetch from user profile
    // For now, we'll use basic info from auth and set barangay to Apalit
    setUserDetails({
      name: currentUser?.displayName || currentUser?.email || '',
      address: '',
      barangay: 'Apalit' // Set to Apalit since your user is from Apalit
    });
  };

  const onNext = () => {
    if (step === 1 && !selectedMedicine) {
      presentToast({
        message: 'Please select a medicine',
        duration: 3000,
        color: 'danger'
      });
      return;
    }
    if (step === 2 && (!quantity || quantity < 1)) {
      presentToast({
        message: 'Please enter a valid quantity',
        duration: 3000,
        color: 'danger'
      });
      return;
    }
    if (step === 2 && !pickupDate) {
      presentToast({
        message: 'Please select a pickup date',
        duration: 3000,
        color: 'danger'
      });
      return;
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const onBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const submitRequest = async () => {
    if (!selectedMedicine || !currentUser) return;

    await present('Submitting request...');
    try {
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

      dismiss();
      presentToast({
        message: 'Medicine request submitted successfully!',
        duration: 3000,
        color: 'success'
      });
      router.push('/user/requests', 'forward');
    } catch (error) {
      dismiss();
      presentToast({
        message: 'Error submitting request',
        duration: 3000,
        color: 'danger'
      });
    }
  };

  return (
    <>
    
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/dashboard/home" />
          </IonButtons>
          <IonTitle>Medicine Request</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonGrid fixed>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              <IonCard>
                <IonCardContent>
                  {step === 1 && (
                    <Page1
                      medicines={medicines}
                      selectedMedicine={selectedMedicine}
                      onMedicineSelect={setSelectedMedicine}
                      onNext={onNext}
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
    
    </>
  );
};

export default UserMedRequest;
