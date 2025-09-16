import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonTextarea, IonButton, IonDatetime, IonToast, IonModal, IonFab, IonFabButton, IonIcon, IonList, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import { add } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { Medicine } from '../../types/medicine';

const Med_Inventory: React.FC = () => {
  useAuth();

  const [medicineName, setMedicineName] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [strength, setStrength] = useState('');
  const [category, setCategory] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [description, setDescription] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [unitName, setUnitName] = useState('');
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [conversionFactor, setConversionFactor] = useState<number | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const resetForm = () => {
    setMedicineName('');
    setDosageForm('');
    setStrength('');
    setCategory('');
    setRequiresPrescription(false);
    setDescription('');
    setExpirationDate('');
    setUnitName('');
    setQuantity(undefined);
    setConversionFactor(undefined);
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!medicineName || !dosageForm || !strength || !category || !unitName || conversionFactor === undefined || quantity === undefined || !expirationDate) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    if (conversionFactor < 0 || conversionFactor > 15) {
      setToastMessage('Conversion factor must be between 0 and 15.');
      setShowToast(true);
      return;
    }

    try {
      await addDoc(collection(db, 'medicine'), {
        medicine_name: medicineName,
        dosage_form: dosageForm,
        strength: strength,
        category: category,
        requires_prescription: requiresPrescription,
        description: description || null,
        created_at: serverTimestamp(),
        expiration_date: new Date(expirationDate),
        unit_name: unitName,
        conversion_factor: conversionFactor,
        quantity: quantity,
      });
      setToastMessage('Medicine added successfully.');
      setShowToast(true);
      setShowModal(false);
      resetForm();
      fetchMedicines(); // Refresh list
    } catch (error) {
      setToastMessage('Failed to add medicine. Please try again.');
      setShowToast(true);
      console.error('Error adding medicine:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'medicine'));
      const meds: Medicine[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        meds.push({
          ...data,
          created_at: data.created_at.toDate(),
          expiration_date: data.expiration_date.toDate(),
        } as Medicine);
      });
      setMedicines(meds);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const getDisplayQuantity = (med: Medicine) => {
    if (med.unit_name.toUpperCase() === 'BANIG' && (med.dosage_form === 'capsule' || med.dosage_form === 'tablet')) {
      const pieces = med.quantity * med.conversion_factor;
      return `${pieces} pieces`;
    }
    return `${med.quantity} ${med.unit_name}`;
  };

  const dosageFormOptions = ['tablet', 'syrup', 'injection', 'capsule', 'cream', 'ointment'];
  const strengthOptions = ['500mg', '250mg', '100mg', '5ml/100mg', '10ml/200mg', '1g', '2g'];
  const categoryOptions = ['antibiotic', 'analgesic', 'supplement', 'antihistamine', 'antacid', 'diuretic'];
  const unitNameOptions = ['BANIG', 'SINGLE CAPSULE', 'BOX', 'BOTTLE', 'VIAL', 'TUBE'];

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Super Admin - Medicine Inventory</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonList>
          {medicines.map((med, index) => (
            <IonCard key={index}>
              <IonCardHeader>
                <IonCardTitle>{med.medicine_name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p><strong>Strength:</strong> {med.strength}</p>
                <p><strong>Quantity:</strong> {getDisplayQuantity(med)}</p>
                <p><strong>Expiration Date:</strong> {med.expiration_date.toLocaleDateString()}</p>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonContent scrollY={true} className="ion-padding">
            <form onSubmit={handleAddMedicine}>
            <IonItem>
              <IonLabel position="stacked">Medicine Name (Generic/Brand)</IonLabel>
              <IonInput value={medicineName} onIonChange={e => setMedicineName(e.detail.value!)} required />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Dosage Form</IonLabel>
              <IonSelect value={dosageForm} placeholder="Select Dosage Form" onIonChange={e => setDosageForm(e.detail.value)}>
                {dosageFormOptions.map(option => (
                  <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Strength</IonLabel>
              <IonSelect value={strength} placeholder="Select Strength" onIonChange={e => setStrength(e.detail.value)}>
                {strengthOptions.map(option => (
                  <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect value={category} placeholder="Select Category" onIonChange={e => setCategory(e.detail.value)}>
                {categoryOptions.map(option => (
                  <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>Requires Prescription</IonLabel>
              <IonToggle checked={requiresPrescription} onIonChange={e => setRequiresPrescription(e.detail.checked)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Description (Optional)</IonLabel>
              <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Expiration Date</IonLabel>
              <IonDatetime presentation="date" value={expirationDate} onIonChange={e => setExpirationDate(e.detail.value as string)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Unit Name</IonLabel>
              <IonSelect value={unitName} placeholder="Select Unit Name" onIonChange={e => setUnitName(e.detail.value)}>
                {unitNameOptions.map(option => (
                  <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Quantity</IonLabel>
              <IonInput type="number" min="0" value={quantity !== undefined ? quantity : ''} onIonChange={e => setQuantity(parseInt(e.detail.value!))} required />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Conversion Factor (0-15)</IonLabel>
              <IonInput type="number" min="0" max="15" value={conversionFactor !== undefined ? conversionFactor : ''} onIonChange={e => setConversionFactor(parseFloat(e.detail.value!))} required />
            </IonItem>
            <IonButton type="submit" expand="block" className="ion-margin-top">Add Medicine</IonButton>
            <IonButton expand="block" color="medium" onClick={() => setShowModal(false)}>Cancel</IonButton>
          </form>
          </IonContent>
        </IonModal>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} />
      </IonContent>
    </IonPage>
  );
};

export default Med_Inventory;
