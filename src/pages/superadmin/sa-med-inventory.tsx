import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonTextarea, IonButton, IonToast, IonModal, IonFab, IonFabButton, IonIcon, IonList, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonFooter, IonLoading, IonItemDivider, IonActionSheet, IonAlert, IonSearchbar, IonRefresher, IonRefresherContent, RefresherCustomEvent, IonText, IonSegment, IonSegmentButton, IonCardSubtitle, IonChip, IonPopover, IonSkeletonText } from '@ionic/react';
import { add, addCircle, albums, arrowBack, ellipsisVertical, filter, pencil } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FirestoreAuditTrailEntry, Medicine } from '../../types/medicine';

const Med_Inventory: React.FC = () => {
   const { currentUser } = useAuth();

  const [medicineName, setMedicineName] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [strength, setStrength] = useState('');
  const [category, setCategory] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [unitName, setUnitName] = useState('');
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false); // For add/edit/delete forms
  const [isFetchingList, setIsFetchingList] = useState(false); // For fetching the medicine list
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
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [medicineToArchive, setMedicineToArchive] = useState<Medicine | null>(null);
  const [showArchiveAlert, setShowArchiveAlert] = useState(false);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [medicineToUnarchive, setMedicineToUnarchive] = useState<Medicine | null>(null);
  const [showUnarchiveAlert, setShowUnarchiveAlert] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedDosageFormFilter, setSelectedDosageFormFilter] = useState('all');
  const [selectedStrengthFilter, setSelectedStrengthFilter] = useState('all');
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');

  useEffect(() => {
    setIsSearching(true);
    const searchDebounce = setTimeout(() => {
      let meds = [...medicines];

      // Apply search query filter
      if (searchQuery) {
        meds = meds.filter(med => med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      // Apply category filter
      if (selectedCategoryFilter !== 'all') {
        meds = meds.filter(med => med.category === selectedCategoryFilter);
      }

      // Apply dosage form filter
      if (selectedDosageFormFilter !== 'all') {
        meds = meds.filter(med => med.dosage_form === selectedDosageFormFilter);
      }

      // Apply strength filter
      if (selectedStrengthFilter !== 'all') {
        meds = meds.filter(med => med.strength === selectedStrengthFilter);
      }

      // Apply archived filter
      if (archiveFilter === 'archived') {
        meds = meds.filter(med => med.isDeleted);
      } else if (archiveFilter === 'active') {
        meds = meds.filter(med => !med.isDeleted);
      }
      // for 'all', we don't filter

      setFilteredMedicines(meds);
      setIsSearching(false);
    }, 300); // Debounce to improve performance and user experience

    return () => clearTimeout(searchDebounce);
  }, [searchQuery, medicines, selectedCategoryFilter, selectedDosageFormFilter, selectedStrengthFilter, archiveFilter]);

  const resetForm = () => {
    setMedicineName('');
    setDosageForm('');
    setStrength('');
    setCategory('');
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


    

    setIsProcessingAction(true);

    try {
      await addDoc(collection(db, 'medicine'), {
        medicine_name: medicineName,
        dosage_form: dosageForm,
        strength: strength,
        category: category,
        created_at: serverTimestamp(),
        expiration_date: new Date(expirationDate + "-01"),
        unit_name: unitName,
        quantity: quantity,
        isDeleted: false,
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
      setShowModal(false); // This will trigger onDidDismiss which handles cleanup
      fetchMedicines(); // Refresh list
    } catch (error) {
      setToastMessage('Failed to add medicine. Please try again.');
      setShowToast(true);
      console.error('Error adding medicine:', error);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUpdateMedicine = async () => {
    if (!selectedMedicine || !currentUser) return;

    if (!medicineName || !dosageForm || !strength || !category || !unitName || quantity === undefined || !expirationDate) {
      setToastMessage('Please fill in all required fields.');
      setShowToast(true);
      return;
    }

    setIsProcessingAction(true);

    try {
      const medRef = doc(db, 'medicine', selectedMedicine.id!);
      await updateDoc(medRef, {
        medicine_name: medicineName,
        dosage_form: dosageForm,
        strength: strength,
        category: category,
        expiration_date: new Date(expirationDate + "-01"),
        unit_name: unitName,
        quantity: quantity,
        auditTrail: arrayUnion({
          action: 'Medicine details updated',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'unknown',
          userName: currentUser.displayName || currentUser.email || 'Super Admin',
          timestamp: new Date(),
        })
      });
      setToastMessage('Medicine updated successfully.');
      setShowToast(true);
      setShowModal(false); // This will trigger onDidDismiss which handles cleanup
      setSearchQuery(''); // Clear search query
      fetchMedicines(); // Refresh list
    } catch (error) {
      setToastMessage('Failed to update medicine.');
      setShowToast(true);
      console.error('Error updating medicine:', error);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const fetchMedicines = async () => {
    setIsFetchingList(true);
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
    } finally {
      setIsFetchingList(false);
    }
  };

  const handleArchiveMedicine = async () => {
    if (!medicineToArchive || !currentUser) return;
    setIsProcessingAction(true);
    try {
      const medRef = doc(db, 'medicine', medicineToArchive.id!);
      await updateDoc(medRef, {
        isDeleted: true, // Still using isDeleted for the underlying logic
        auditTrail: arrayUnion({
          action: 'Medicine archived',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'unknown',
          userName: currentUser.displayName || currentUser.email || 'Super Admin',
          timestamp: new Date(),
        })
      });
      setToastMessage('Medicine archived successfully.');
      setShowToast(true);
      fetchMedicines(); // Refresh list
    } catch (error) {
      setToastMessage('Failed to archive medicine.');
      setShowToast(true);
      console.error('Error archiving medicine:', error);
    } finally {
      setIsProcessingAction(false);
      setMedicineToArchive(null);
    }
  };

  const handleUnarchiveMedicine = async () => {
    if (!medicineToUnarchive || !currentUser) return;
    setIsProcessingAction(true);
    try {
      const medRef = doc(db, 'medicine', medicineToUnarchive.id!);
      await updateDoc(medRef, {
        isDeleted: false,
        auditTrail: arrayUnion({
          action: 'Medicine unarchived',
          userId: currentUser.uid,
          userEmail: currentUser.email || 'unknown',
          userName: currentUser.displayName || currentUser.email || 'Super Admin',
          timestamp: new Date(),
        })
      });
      setToastMessage('Medicine unarchived successfully.');
      setShowToast(true);
      fetchMedicines(); // Refresh list
    } catch (error) {
      setToastMessage('Failed to unarchive medicine.');
      setShowToast(true);
      console.error('Error unarchiving medicine:', error);
    } finally {
      setIsProcessingAction(false);
      setMedicineToUnarchive(null);
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
          <IonSearchbar value={searchQuery} onIonInput={e => setSearchQuery(e.detail.value!)} placeholder="Search by medicine name..." showClearButton="always" />
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
              <IonButtons slot="start">
                <IonButton onClick={() => setShowFilterModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonCard>
              <IonCardContent className='ion-margin-vertical'>
                <IonItem lines='none' className='ion-margin-top'>
                  <IonSelect fill='outline' label='Category' placeholder="All Categories" value={selectedCategoryFilter} onIonChange={e => setSelectedCategoryFilter(e.detail.value)}>
                    <IonSelectOption value="all">All Categories</IonSelectOption>
                    {categoryOptions.map(option => (
                      <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem lines='none' className='ion-margin-top'>
                  <IonSelect fill='outline' label='Dosage Form' placeholder="All Dosage Forms" value={selectedDosageFormFilter} onIonChange={e => setSelectedDosageFormFilter(e.detail.value)}>
                    <IonSelectOption value="all">All Dosage Forms</IonSelectOption>
                    {dosageFormOptions.map(option => (
                      <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem lines='none' className='ion-margin-top'>
                  <IonSelect fill='outline' label='Strength' placeholder="All Strengths" value={selectedStrengthFilter} onIonChange={e => setSelectedStrengthFilter(e.detail.value)}>
                    <IonSelectOption value="all">All Strengths</IonSelectOption>
                    {strengthOptions.map(option => (
                      <IonSelectOption key={option} value={option}>{option}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItemDivider className="ion-margin-top">Filter Medicines</IonItemDivider>
                <IonSegment value={archiveFilter} onIonChange={e => setArchiveFilter(e.detail.value as any)}>
                  <IonSegmentButton value="active">
                    <IonLabel>Active</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="archived">
                    <IonLabel>Archived</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="all">
                    <IonLabel>All</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </IonCardContent>
            </IonCard>
          </IonContent>
          <IonFooter>
            <IonToolbar>
               <IonButton className='ion-padding-vertical' shape='round' expand="block" onClick={() => setShowFilterModal(false)}>Apply Filters</IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>

     

       
        {(isFetchingList || isSearching) && (
          <IonList style={{ backgroundColor: 'transparent' }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <IonItem className='ion-margin' lines='none' key={index}>
                <IonChip>
                  <IonSkeletonText animated style={{ width: '50px' }} />
                </IonChip>
                <IonCard style={{ flexGrow: 1 }}>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonSkeletonText animated style={{ width: '80%' }} />
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonSkeletonText animated style={{ width: '60%' }} />
                  </IonCardContent>
                </IonCard>
                <IonButton slot='end' fill='clear' size='default'>
                  <IonIcon icon={ellipsisVertical} slot='icon-only' />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        {!isFetchingList && !isSearching && medicines.length === 0 && (
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

        {!isFetchingList && !isSearching && medicines.length > 0 && filteredMedicines.length === 0 && searchQuery && (
           <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
           <IonCard style={{ textAlign: 'center' }} className='ion-padding-vertical'>
             <IonCardHeader>
               <IonCardTitle>
                 <IonText color={'primary'}>
                   <strong>No Results Found</strong>
                 </IonText>
               </IonCardTitle>
             </IonCardHeader>
             <IonCardContent>
               <p>Your search for "{searchQuery}" did not return any results.</p>
               <p>Try checking your spelling or using different keywords.</p>
             </IonCardContent>
           </IonCard>
         </div>
        )}
        
        {!isFetchingList && !isSearching && filteredMedicines.length > 0 && (
          <IonList style={{ backgroundColor: 'transparent' }}>
            {filteredMedicines.map((med) => (
              <IonItem className='ion-margin' lines='none' key={med.id} style={{ opacity: med.isDeleted ? 0.6 : 1 }}>
                <IonChip>
                    {med.quantity} pc/s.
                  </IonChip>
                <IonCard key={med.id}>
                <IonCardHeader>
                    <IonCardTitle>
                      {med.medicine_name} ({med.unit_name})
                      {med.isDeleted && <IonChip color="medium" slot="end">Archived</IonChip>}
                    </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                   {med.strength} • {`${String(med.expiration_date.getMonth() + 1).padStart(2, '0')}/${med.expiration_date.getFullYear()}`}
                </IonCardContent>
              </IonCard>
              <IonButton slot='end' fill='clear' size='default' onClick={(e) => {
                setSelectedMedicine(med);
                setPopoverEvent(e.nativeEvent as Event);
                setShowPopover(true);
              }}>
                <IonIcon icon={ellipsisVertical} slot='icon-only' />
              </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

           {/* Medicine Details Modal */}
        <IonModal isOpen={showDetailsModal} onDidDismiss={() => setShowDetailsModal(false)}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>Medicine Details</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowDetailsModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
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
                  {/* <IonSegmentButton value="transactions">
                    <IonLabel>Transactions</IonLabel>
                  </IonSegmentButton> */}
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
                        <IonLabel>Expiration Date:</IonLabel>
                        <IonText slot="end">{selectedMedicine.expiration_date.toLocaleDateString()}</IonText>
                      </IonItem>
                      <IonItem>
                        <IonLabel>Unit Name:</IonLabel>
                        <IonText slot="end">{selectedMedicine.unit_name}</IonText>
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
                      <IonCardTitle>History</IonCardTitle>
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
                          <IonLabel>No history available.</IonLabel>
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
              if (selectedMedicine) {
                setModalMode('edit');
                setMedicineName(selectedMedicine.medicine_name);
                setDosageForm(selectedMedicine.dosage_form);
                setStrength(selectedMedicine.strength);
                setCategory(selectedMedicine.category);
                setExpirationDate(selectedMedicine.expiration_date.toISOString().substring(0, 7));
                setUnitName(selectedMedicine.unit_name);
                setQuantity(selectedMedicine.quantity);
                setShowModal(true);
              }
            }}>
              <IonLabel>Edit</IonLabel>
            </IonItem>
            {selectedMedicine && !selectedMedicine.isDeleted ? (
              <IonItem button onClick={() => {
                setShowPopover(false);
                if (selectedMedicine) {
                  setMedicineToArchive(selectedMedicine);
                  setShowArchiveAlert(true);
                }
              }}>
                <IonLabel color="warning">Archive</IonLabel>
              </IonItem>
            ) : (
              <IonItem button onClick={() => {
                setShowPopover(false);
                if (selectedMedicine) {
                  setMedicineToUnarchive(selectedMedicine);
                  setShowUnarchiveAlert(true);
                }
              }}>
                <IonLabel color="success">Unarchive</IonLabel>
              </IonItem>
            )}
          </IonList>
        </IonPopover>

        <IonModal isOpen={showModal} onDidDismiss={() => { setShowModal(false); resetForm(); setModalMode('add'); }}>
          <IonHeader className='ion-no-border'>
            <IonToolbar>
              <IonTitle>{modalMode === 'add' ? 'Add New Medicine' : 'Edit Medicine'}</IonTitle>
              <IonButtons slot='start'>
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={arrowBack} slot='icon-only' />
                </IonButton>
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
               <IonButton shape='round' color={'success'} expand="block" className="ion-padding-vertical" disabled={isProcessingAction} onClick={modalMode === 'add' ? handleAddMedicine : handleUpdateMedicine}>
                {isProcessingAction ? (modalMode === 'add' ? 'Adding...' : 'Updating...') : (modalMode === 'add' ? 'Add Medicine' : 'Update Medicine')}
                <IonIcon slot="end" icon={modalMode === 'add' ? add : pencil} />
               </IonButton>

            </IonToolbar>
          </IonFooter>
        </IonModal>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} />
        <IonLoading isOpen={isProcessingAction} message="Processing..." />

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

        <IonAlert
          isOpen={showArchiveAlert}
          onDidDismiss={() => setShowArchiveAlert(false)}
          header="Confirm Archive"
          message={`Are you sure you want to archive ${medicineToArchive?.medicine_name}? It will no longer appear in the active inventory but can be restored later.`}
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setMedicineToArchive(null) },
            { text: 'Archive', handler: () => handleArchiveMedicine() }
          ]}
        />

        <IonAlert
          isOpen={showUnarchiveAlert}
          onDidDismiss={() => setShowUnarchiveAlert(false)}
          header="Confirm Unarchive"
          message={`Are you sure you want to unarchive ${medicineToUnarchive?.medicine_name}? It will be visible in the active inventory again.`}
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setMedicineToUnarchive(null) },
            { text: 'Unarchive', handler: () => handleUnarchiveMedicine() }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Med_Inventory;
