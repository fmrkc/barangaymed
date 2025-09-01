import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonToast,
} from '@ionic/react';
import { MedicineService } from '../services/medicineService'; // Import MedicineService
import { LogService } from '../services/logService'; // Import LogService
import { Notification } from '../types/notifications'; // Import Notification interface
import { User as FirebaseUser } from 'firebase/auth'; // Import Firebase User type

const medicineService = MedicineService.getInstance();
const logService = LogService.getInstance();

const RHUMedicineModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onMedicineAdded: () => void;
  setLoading: (loading: boolean) => void;
  currentUser: FirebaseUser | null;
}> = ({ isOpen, onClose, onMedicineAdded, setLoading, currentUser }) => {
  const [medicineName, setMedicineName] = useState('');
  const [medicineType, setMedicineType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleAddRHUMedicine = async () => {
    if (!medicineName || !medicineType || !quantity || !expiryDate) {
      setToastMessage('Please fill all required fields');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const newMedicine = {
        name: medicineName,
        type: medicineType,
        quantity: parseInt(quantity),
        expiryDate: new Date(expiryDate),
        location: 'rhu',
        barangayId: 'rhu',
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
            location: "RHU",
            message: `Added ${newMedicine.quantity} units of ${newMedicine.name} to RHU inventory.`,
          },
        });
      }

      setToastMessage('Medicine added to RHU successfully');
      setShowToast(true);
      resetForm();
      onMedicineAdded();
      onClose();
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
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add RHU Medicine</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
            value={medicineType}
            onIonChange={(e) => setMedicineType(e.detail.value)}
            placeholder="Select type"
          >
            <IonSelectOption value="Tablet">Tablet</IonSelectOption>
            <IonSelectOption value="Capsule">Capsule</IonSelectOption>
            <IonSelectOption value="Syrup">Syrup</IonSelectOption>
            <IonSelectOption value="Injection">Injection</IonSelectOption>
            <IonSelectOption value="Ointment">Ointment</IonSelectOption>
            <IonSelectOption value="Cream">Cream</IonSelectOption>
            <IonSelectOption value="Drops">Drops</IonSelectOption>
            <IonSelectOption value="Inhaler">Inhaler</IonSelectOption>
            <IonSelectOption value="Suppository">Suppository</IonSelectOption>
            <IonSelectOption value="Other">Other</IonSelectOption>
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
          <IonLabel position="stacked">Expiry Date *</IonLabel>
          <IonDatetime
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
        <IonButton expand="block" onClick={handleAddRHUMedicine}>
          Add Medicine
        </IonButton>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />
      </IonContent>
    </IonModal>
  );
};

export default RHUMedicineModal;
