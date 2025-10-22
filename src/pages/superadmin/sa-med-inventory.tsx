import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonTextarea, IonButton, IonToast, IonModal, IonFab, IonFabButton, IonIcon, IonList, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonFooter, IonLoading, IonItemDivider, IonActionSheet, IonAlert, IonSearchbar, IonRefresher, IonRefresherContent, RefresherCustomEvent, IonText, IonSegment, IonSegmentButton, IonCardSubtitle, IonChip, IonPopover } from '@ionic/react';
import { add, addCircle, albums, close, create, filter, pencil } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { FirestoreAuditTrailEntry, Medicine } from '../../types/medicine';

const Med_Inventory: React.FC = () => {
   const { currentUser } = useAuth();

  const [medicineName, setMedicineName] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [strength, setStrength] = useState('');
  const [category, setCategory] = useState('');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [description, setDescription] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [unitName, setUnitName] = useState('');
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [customQuantity, setCustomQuantity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState('details');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<Event | undefined>(undefined);

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
    setQuantityError('');
  };

  const handleAddMedicine = async () => {
    let hasError = false;
    setQuantityError('');

    if (!medicineName || !dosageForm || !strength || !category || !unitName || quantity === undefined || !expirationDate) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    if (quantity === undefined || quantity <= 0) {
      setQuantityError('Quantity must be greater than 0.');
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
        quantity: quantity,
        auditTrail: [{
          action: 'Medicine added',
          userId: currentUser?.uid,
          userEmail: currentUser?.email || 'unknown',
          userName: currentUser?.displayName || currentUser?.email || 'Super Admin',
          timestamp: new Date(),
        }],
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
          id: doc.id,
          ...data,
          created_at: data.created_at.toDate(),
          expiration_date: data.expiration_date.toDate(),
          auditTrail: data.auditTrail ? (data.auditTrail as FirestoreAuditTrailEntry[]).map((entry) => ({
            action: entry.action,
            userId: entry.userId,
            userEmail: entry.userEmail,
            userName: entry.userName,
            timestamp: entry.timestamp.toDate(),
          })) : [],
        } as Medicine);
      });
      setMedicines(meds);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await fetchMedicines();
    event.detail.complete();
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const getDisplayQuantity = (med: Medicine) => {
    return `${med.quantity} ${med.unit_name}`;
  };

  const handleViewDetails = (med: Medicine) => {
    setSelectedMedicine(med);
    setShowDetailsModal(true);
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
        <IonToolbar>                                                                                                                         
          <IonSearchbar value={searchQuery} onIonChange={e => setSearchQuery(e.detail.value!)} placeholder="Search by medicine name..." />
          <IonButton size='large' slot="end" onClick={() => setShowFilterModal(true)}>
            <IonIcon icon={filter} slot='icon-only' />
          </IonButton>
        </IonToolbar>    
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
      
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showFilterModal} onDidDismiss={() => setShowFilterModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Filter Medicines</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowFilterModal(false)}>
                  <IonIcon icon={close} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonCard>
              <IonCardContent className='ion-margin-vertical'>
                <IonItem lines='none' className='ion-margin-top'>
                  <IonSelect fill='outline' label='Placeholder Filter 1' placeholder="Select Category">
                    <IonSelectOption value="placeholder1">Placeholder Category 1</IonSelectOption>
                    <IonSelectOption value="placeholder2">Placeholder Category 2</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem lines='none' className='ion-margin-top'>
                  <IonSelect fill='outline' label='Placeholder Filter 2' placeholder="Select Category">
                    <IonSelectOption value="placeholder1">Placeholder Category 3</IonSelectOption>
                    <IonSelectOption value="placeholder2">Placeholder Category 4</IonSelectOption>
                  </IonSelect>
                </IonItem>
                  <IonItem lines='none' className='ion-margin-top'>
                  <IonSelect fill='outline' label='Placeholder Filter 3' placeholder="Select Category">
                    <IonSelectOption value="placeholder1">Placeholder Category 5</IonSelectOption>
                    <IonSelectOption value="placeholder2">Placeholder Category 6</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCardContent>
            </IonCard>
          </IonContent>
          <IonFooter>
            <IonToolbar>
               <IonButton className='ion-padding-vertical' shape='round' expand="block" onClick={() => setShowFilterModal(false)}>Apply Filters</IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

     

       
        {medicines.length === 0 && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
            <IonCard style={{ textAlign: 'center' }} className='ion-padding-vertical'>
              <IonCardHeader>
                <IonCardTitle>
                  <IonText color={'primary'}>
                    <strong>No Medicines Found</strong>
                  </IonText>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>There is currently no medicines stored in the system.</p>
                <p>To add a medicine record, click the <IonIcon icon={addCircle} color='primary' /> button below.</p>
              </IonCardContent>
            </IonCard>
          </div>
        )}
        
        <IonList style={{ backgroundColor: 'transparent' }} className='ion-margin-horizontal'>
          {medicines.filter(med => med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())).map((med) => (
            <IonCard button key={med.id} onClick={(e) => {
              setSelectedMedicine(med);
              setPopoverEvent(e.nativeEvent as Event);
              setShowPopover(true);
            }}>
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

           {/* Medicine Details Modal */}
        <IonModal isOpen={showDetailsModal} onDidDismiss={() => setShowDetailsModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Medicine Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDetailsModal(false)}>
                  <IonIcon icon={close} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedMedicine && (
              <>
                <IonSegment value={selectedSegment} onIonChange={e => setSelectedSegment(e.detail.value!.toString())}>
                  <IonSegmentButton value="details">
                    <IonLabel>Details</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="history">
                    <IonLabel>History</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="transactions">
                    <IonLabel>Transactions</IonLabel>
                  </IonSegmentButton>
                </IonSegment>

                {selectedSegment === 'details' && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>{selectedMedicine.medicine_name}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonItem>
                        <IonLabel>ID:</IonLabel>
                        <IonText slot="end">{selectedMedicine.id}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Dosage Form:</IonLabel>
                        <IonText slot="end">{selectedMedicine.dosage_form}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Strength:</IonLabel>
                        <IonText slot="end">{selectedMedicine.strength}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Category:</IonLabel>
                        <IonText slot="end">{selectedMedicine.category}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Requires Prescription:</IonLabel>
                        <IonText slot="end">{selectedMedicine.requires_prescription ? 'Yes' : 'No'}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Description:</IonLabel>
                        <IonText slot="end">{selectedMedicine.description || 'N/A'}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Expiration Date:</IonLabel>
                        <IonText slot="end">{selectedMedicine.expiration_date.toLocaleDateString()}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Unit Name:</IonLabel>
                        <IonText slot="end">{selectedMedicine.unit_name}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Conversion Factor:</IonLabel>
                        <IonText slot="end">{selectedMedicine.conversion_factor}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Quantity:</IonLabel>
                        <IonText slot="end">{selectedMedicine.quantity}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Display Quantity:</IonLabel>
                        <IonText slot="end">{getDisplayQuantity(selectedMedicine)}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Created At:</IonLabel>
                        <IonText slot="end">{selectedMedicine.created_at.toLocaleString()}</IonText>
                      </IonItem>
                    </IonCardContent>
                  </IonCard>
                )}

                {selectedSegment === 'history' && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>Audit Trail</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      {selectedMedicine.auditTrail && selectedMedicine.auditTrail.length > 0 ? (
                        selectedMedicine.auditTrail.map((entry, index) => (
                          <IonItem key={index}>
                            <IonLabel>
                              <h3>{entry.action}</h3>
                              <p>By: {entry.userName} ({entry.userEmail})</p>
                              <p>At: {entry.timestamp.toLocaleString()}</p>
                            </IonLabel>
                          </IonItem>
                        ))
                      ) : (
                        <IonItem>
                          <IonLabel>No audit trail available.</IonLabel>
                        </IonItem>
                      )}
                    </IonCardContent>
                  </IonCard>
                )}

                 {selectedSegment === 'transactions' && (
                  <>
                  <IonCard>
                    <IonCardHeader>
                      <IonCardSubtitle>This is where the transactions will be displayed. Currently a placeholder.</IonCardSubtitle>
                    </IonCardHeader>
                  </IonCard>
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Juan Dela Cruz
                            <IonChip>
                              Quantity: 100
                            </IonChip>
                          </div>
                      </IonCardTitle>
                      <IonCardSubtitle>
                        juan@example.com • 2 days ago
                      </IonCardSubtitle>
                    </IonCardHeader>
                  </IonCard>
                  </>
                )}
              </>
            )}
          </IonContent>
        </IonModal>
       
        

        {/* Medicine Popover */}
        <IonPopover
          isOpen={showPopover}
          event={popoverEvent}
          onDidDismiss={() => setShowPopover(false)}
          side="bottom"
          alignment="end"
        >
          <IonList>
            <IonItem button onClick={() => {
              setShowPopover(false);
              if (selectedMedicine) handleViewDetails(selectedMedicine);
            }}>
              <IonLabel>View Details</IonLabel>
            </IonItem>
            <IonItem button onClick={() => {
              setShowPopover(false);
              // Placeholder for edit functionality
              console.log('Edit clicked for:', selectedMedicine?.medicine_name);
            }}>
              <IonLabel>
                Edit (Placeholder)
              </IonLabel>
            </IonItem>
            <IonItem button onClick={() => {
              setShowPopover(false);
              // Placeholder for delete functionality
              console.log('Delete clicked for:', selectedMedicine?.medicine_name);
            }}>
              <IonLabel>Delete (Placeholder)</IonLabel>
            </IonItem>
          </IonList>
        </IonPopover>

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
