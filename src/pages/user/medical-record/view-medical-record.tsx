import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonLabel,
  IonItem,
  IonTextarea,
  IonButtons,
  IonLoading,
  useIonRouter,
  IonAlert,
  IonList,
  IonItemDivider,
  IonModal,
  IonNote,
  IonCard,
  IonCardContent,
  IonFooter,
  IonProgressBar,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonText,
} from '@ionic/react';
import { arrowBack, arrowForward, checkmarkCircle, cloudUpload } from 'ionicons/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { db, storage } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { eventService } from '../../../services/eventService';

interface ViewMedicalRecordProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const ViewMedicalRecord: React.FC<ViewMedicalRecordProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [historyFiles, setHistoryFiles] = useState<any[]>([]);

  const [showLoading, setShowLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertHeader, setAlertHeader] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);

  useEffect(() => {
    const fetchMedicalRecord = async () => {
      if (!currentUser || !isOpen) return;

      setShowLoading(true);
      try {
        const medicalRecordRef = doc(db, 'medicalRecords', currentUser.uid);
        const docSnap = await getDoc(medicalRecordRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSymptoms(data.symptoms?.join('\n') || '');
          setConditions(data.conditions?.join('\n') || '');
          setAllergies(data.allergies?.join('\n') || '');
        } 

        const historyFilesRef = collection(db, 'medicalRecords', currentUser.uid, 'historyFiles');
        const filesSnapshot = await getDocs(historyFilesRef);
        setHistoryFiles(filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Error fetching medical record:", error);
        setAlertHeader('Error');
        setAlertMessage('Could not load your medical record.');
        setShowAlert(true);
      } finally {
        setShowLoading(false);
      }
    };

    fetchMedicalRecord();
  }, [currentUser, isOpen]);

  const handleSave = async () => {
    if (!currentUser) return;

    setShowLoading(true);
    try {
      const medicalRecordRef = doc(db, 'medicalRecords', currentUser.uid);
      await setDoc(medicalRecordRef, {
        symptoms: symptoms.split('\n').filter(s => s),
        conditions: conditions.split('\n').filter(c => c),
        allergies: allergies.split('\n').filter(a => a),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setShowLoading(false);
      setIsEditing(false);
      setStep(1);
      setAlertHeader('Success');
      setAlertMessage('Your medical record has been updated.');
      setShowAlert(true);

      // Publish event for medical record update
      await eventService.publishEvent('user.medical_record.updated', {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'User',
      });

    } catch (error) {
      console.error("Error updating medical record:", error);
      setShowLoading(false);
      setAlertHeader('Error');
      setAlertMessage('Failed to update your medical record.');
      setShowAlert(true);
    }
  };

  const handleDismiss = () => {
    if (isEditing) {
      setShowDiscardAlert(true);
    } else {
      setIsEditing(false);
      setStep(1);
      onDidDismiss();
    }
  }

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <IonCard>
            <IonCardContent>
              <p>This is your medical record. You can view or edit the information here. This form will be used to provide context behind your medicine & consultation requests.</p>
              <br />
              <p>Please note that any information shared here are information you are okay with sharing. All information will be kept confidential. You may skip any fields you are not comfortable sharing.</p>
            </IonCardContent>
          </IonCard>
        );
      case 2:
        return (
          <>
            <IonItemDivider>Existing Symptoms (Optional)</IonItemDivider>
            <IonItem>
              <IonTextarea readonly={!isEditing} rows={8} fill="outline" placeholder="Enter one symptom per line" value={symptoms} onIonChange={e => setSymptoms(e.detail.value!)} className="ion-margin-bottom"></IonTextarea>
            </IonItem>
            <IonItemDivider>Existing Conditions (Optional)</IonItemDivider>
            <IonItem>
              <IonTextarea readonly={!isEditing} rows={8} fill="outline" placeholder="Enter one condition per line." value={conditions} onIonChange={e => setConditions(e.detail.value!)} className="ion-margin-bottom"></IonTextarea>
            </IonItem>
          </>
        );
      case 3:
        return (
          <>
            <IonItemDivider>Allergies (Optional)</IonItemDivider>
            <IonItem>
              <IonTextarea readonly={!isEditing} rows={10} fill="outline" placeholder="Enter one allergy per line." value={allergies} onIonChange={e => setAllergies(e.detail.value!)} className="ion-margin-bottom"></IonTextarea>
            </IonItem>
          </>
        );
      case 4:
        return (
          <>
            <IonItemDivider>Uploaded History Files</IonItemDivider>
            <IonList>
              {historyFiles.length > 0 ? historyFiles.map(file => (
                <IonItem key={file.id} button onClick={() => window.open(file.fileURL, '_blank')}>
                  <IonLabel>{file.fileName}</IonLabel>
                </IonItem>
              )) : (
                <IonItem>
                  <IonLabel>No files uploaded.</IonLabel>
                </IonItem>
              )}
            </IonList>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{isEditing ? 'Edit' : 'View'} Medical Record</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={handleDismiss}>Close</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            {!isEditing && <IonButton onClick={() => { setIsEditing(true); setStep(1); }}>Edit</IonButton>}
          </IonButtons>
        </IonToolbar>
        <IonProgressBar value={step / 4} />
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              {step === 1 && 'Step 1: Introduction'}
              {step === 2 && 'Step 2: Symptoms and Conditions'}
              {step === 3 && 'Step 3: Allergies'}
              {step === 4 && 'Step 4: Uploaded History Files'}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {renderStep()}
          </IonCardContent>
        </IonCard>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="3">
                {step > 1 && (
                  <IonButton className='ion-padding-vertical' expand="block" shape="round" fill="outline" onClick={prevStep}>
                    <IonIcon slot="start" icon={arrowBack} />
                    Back
                  </IonButton>
                )}
              </IonCol>
              <IonCol size="9">
                {step < 4 ? (
                  <IonButton className='ion-padding-vertical' expand="block" shape="round" onClick={nextStep}>
                    Next
                    <IonIcon slot="end" icon={arrowForward} />
                  </IonButton>
                ) : (
                  isEditing && (
                    <IonButton className='ion-padding-vertical' color="success" expand="block" shape="round" onClick={handleSave}>
                      Save Medical Record
                      <IonIcon slot="end" icon={checkmarkCircle} />
                    </IonButton>
                  )
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonFooter>
      <IonLoading isOpen={showLoading} message={'Loading...'} />
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={alertHeader}
        message={alertMessage}
        buttons={['OK']}
      />
      <IonAlert
        isOpen={showDiscardAlert}
        onDidDismiss={(e) => {
          setShowDiscardAlert(false);
          if (e.detail.role === 'discard') {
            setIsEditing(false);
            setStep(1);
            onDidDismiss();
          }
        }}
        header={'Discard Changes?'}
        message={'You have unsaved changes. Do you want to discard them?'}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Discard',
            role: 'discard',
          },
        ]}
      />
    </IonModal>
  );
};

export default ViewMedicalRecord;
