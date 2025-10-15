import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonTextarea, IonButton, IonDatetime, IonToast, IonModal, IonFab, IonFabButton, IonIcon, IonList, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonFooter, IonLoading, IonItemDivider, IonActionSheet, IonAlert } from '@ionic/react';
import { add, albums } from 'ionicons/icons';
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
  const [isLoading, setIsLoading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [customQuantity, setCustomQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [conversionFactorError, setConversionFactorError] = useState('');

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
    setQuantityError('');
    setConversionFactorError('');
  };

  const handleAddMedicine = async () => {
    let hasError = false;
    setQuantityError('');
    setConversionFactorError('');

    if (!medicineName || !dosageForm || !strength || !category || !unitName || conversionFactor === undefined || quantity === undefined || !expirationDate) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    if (quantity === undefined || quantity <= 0) {
      setQuantityError('Quantity must be greater than 0.');
      hasError = true;
    }

    if (conversionFactor === undefined || conversionFactor < 0 || conversionFactor > 15) {
      setConversionFactorError('Conversion factor must be between 0 and 15.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);

    try {
      await addDoc(collection(db, 'medicine'), {
        medicine_name: medicineName,
        dosage_form: dosageForm,
        strength: strength,
        category: category,
        requires_prescription: requiresPrescription,
        description: description || null,
        created_at: serverTimestamp(),
        expiration_date: new Date(expirationDate + "-01"),
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
    } finally {
      setIsLoading(false);
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

  const dosageFormOptions = ['Tablet', 'Syrup', 'Injection', 'Capsule', 'Cream', 'Ointment'];
  const strengthOptions = ['500mg', '250mg', '100mg', '5ml/100mg', '10ml/200mg', '1g', '2g'];
  const categoryOptions = ['Antibiotic', 'Analgesic', 'Supplement', 'Antihistamine', 'Antacid', 'Diuretic'];
  const unitNameOptions = ['Banig (Blister Pack)', 'Single Capsule', 'Box', 'Bottle', 'Vial', 'Tube'];

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Medicine Inventory</IonTitle>
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
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Add New Medicine</IonTitle>
              <IonButtons slot='end'>
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent scrollY={true}>
            <IonCard>
              <IonCardContent>
            <IonItem>
              <IonInput
              label="Medicine Name"
              fill="outline"
              value={medicineName}
              onIonChange={e => setMedicineName(e.detail.value!)}
              required
              className="ion-margin-bottom"
            />
            </IonItem>
           <IonItem>
             <IonSelect
              label="Category"
              fill="outline"
              value={category}
              placeholder="Select Category"
              onIonChange={e => setCategory(e.detail.value)}
              interface="alert"
              className="ion-margin-bottom"
            >
              {categoryOptions.map(option => (
                <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
              ))}
            </IonSelect>
           </IonItem>
            <IonItem>
              <IonSelect
              label="Dosage Form"
              fill="outline"
              value={dosageForm}
              placeholder="Select Dosage Form"
              onIonChange={e => setDosageForm(e.detail.value)}
              interface="alert"
              className="ion-margin-bottom"
            >
              {dosageFormOptions.map(option => (
                <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
              ))}
            </IonSelect>
            </IonItem>
           <IonItem>
             <IonSelect
              label="Strength"
              fill="outline"
              value={strength}
              placeholder="Select Strength"
              onIonChange={e => setStrength(e.detail.value)}
              interface="alert"
              className="ion-margin-bottom"
            >
              {strengthOptions.map(option => (
                <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
              ))}
            </IonSelect>
           </IonItem>

            <IonItem lines="none" className="ion-margin-bottom">
              <IonLabel>Requires Prescription?</IonLabel>
              <IonToggle slot='end' checked={requiresPrescription} onIonChange={e => setRequiresPrescription(e.detail.checked)} />
            </IonItem>
            <IonItemDivider className='ion-margin-top'>Description (Optional)</IonItemDivider>
            <IonItem>
              <IonTextarea
              rows={4}
              fill="outline"
              value={description}
              onIonChange={e => setDescription(e.detail.value!)}
              className="ion-margin-bottom"
            />
            </IonItem>
            <IonItemDivider>Expiration Date *</IonItemDivider>
            <IonItem>
              <IonInput
                fill="outline"
                type="month"
                placeholder="Select expiration month and year"
                value={expirationDate}
                min={new Date().toISOString().slice(0, 7)}
                onIonChange={(e) => setExpirationDate(e.detail.value!)}
                className="ion-margin-bottom"
                required
              />
            </IonItem>
           <IonItem>
             <IonSelect
              label="Unit Name"
              fill="outline"
              value={unitName}
              placeholder="Select Unit Name"
              onIonChange={e => setUnitName(e.detail.value)}
              interface="alert"
              className="ion-margin-bottom"
            >
              {unitNameOptions.map(option => (
                <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
              ))}
            </IonSelect>
           </IonItem>
           <IonItemDivider className='ion-margin-top'>Quantity *</IonItemDivider>
           <IonItem>
             <IonInput
               fill="outline"
               type="number"
               min="0"
               value={quantity !== undefined ? quantity : ''}
               onIonChange={e => setQuantity(parseInt(e.detail.value!) || 0)}
               required
               className="ion-margin-bottom"
               readonly
               color={quantityError ? "danger" : undefined}
               errorText={quantityError}
             />
             <IonButton shape='round' slot="end" className='ion-padding' onClick={() => setShowActionSheet(true)}>
               Select Quantity
               <IonIcon slot="end" icon={albums} />
             </IonButton>
           </IonItem>
           <IonItemDivider className='ion-margin-top'>Conversion Factor*</IonItemDivider>
           <IonItem>
             <IonInput
              placeholder="(0-15)"
              fill="outline"
              type="number"
              min="0"
              max="15"
              value={conversionFactor !== undefined ? conversionFactor : ''}
              onIonChange={e => {
                const val = e.detail.value!;
                setConversionFactor(val ? parseFloat(val) : undefined);
                if (!val.trim()) {
                  setConversionFactorError('Conversion factor is required.');
                } else {
                  const num = parseFloat(val);
                  if (isNaN(num) || num < 0 || num > 15) {
                    setConversionFactorError('Conversion factor must be between 0 and 15.');
                  } else {
                    setConversionFactorError('');
                  }
                }
              }}
              required
              className="ion-margin-bottom"
              color={conversionFactorError ? "danger" : undefined}
              errorText={conversionFactorError}
            />
           </IonItem>
              </IonCardContent>
            </IonCard>
          </IonContent>
          <IonFooter>
            <IonToolbar>
               <IonButton shape='round' color={'success'} expand="block" className="ion-padding-vertical" disabled={isLoading} onClick={handleAddMedicine}>
                {isLoading ? 'Adding...' : 'Add Medicine'}
                <IonIcon slot="end" icon={add} />
               </IonButton>

            </IonToolbar>
          </IonFooter>
        </IonModal>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} />
        <IonLoading isOpen={isLoading} message="Adding medicine..." />

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Select Quantity"
          buttons={[
            {
              text: '1',
              handler: () => setQuantity(1),
            },
            {
              text: '5',
              handler: () => setQuantity(5),
            },
            {
              text: '10',
              handler: () => setQuantity(10),
            },
            {
              text: '20',
              handler: () => setQuantity(20),
            },
            {
              text: '50',
              handler: () => setQuantity(50),
            },
            {
              text: '100',
              handler: () => setQuantity(100),
            },
            {
              text: 'Custom',
              handler: () => setShowAlert(true),
            },
            {
              text: 'Cancel',
              role: 'cancel',
            },
          ]}
        />

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Enter Custom Quantity"
          inputs={[
            {
              name: 'quantity',
              type: 'number',
              placeholder: 'Quantity',
              min: 0,
            },
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'OK',
              handler: (data) => {
                const qty = parseInt(data.quantity);
                if (qty > 0) {
                  setQuantity(qty);
                }
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Med_Inventory;
