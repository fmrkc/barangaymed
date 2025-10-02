import React, { useState } from 'react';
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
  IonModal,
  IonNote,
} from '@ionic/react';
import { useAuth } from '../../../contexts/AuthContext';
import { db, storage } from '../../../firebaseConfig';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CreateMedicalRecordProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const CreateMedicalRecord: React.FC<CreateMedicalRecordProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser } = useAuth();

  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [showLoading, setShowLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertHeader, setAlertHeader] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const resetState = () => {
    setStep(1);
    setSymptoms('');
    setConditions('');
    setAllergies('');
    setFile(null);
  }

  const handleDismiss = () => {
    resetState();
    onDidDismiss();
  }

  const handleSave = async () => {
    if (!currentUser) {
      setAlertHeader('Error');
      setAlertMessage('You must be logged in to create a medical record.');
      setShowAlert(true);
      return;
    }

    setShowLoading(true);

    try {
      const medicalRecordRef = doc(db, 'medicalRecords', currentUser.uid);

      await setDoc(medicalRecordRef, {
        symptoms: symptoms.split('\n').filter(s => s),
        conditions: conditions.split('\n').filter(c => c),
        allergies: allergies.split('\n').filter(a => a),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      if (file) {
        const storageRef = ref(storage, `medical-history/${currentUser.uid}/${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);

        const historyFilesRef = collection(db, 'medicalRecords', currentUser.uid, 'historyFiles');
        await addDoc(historyFilesRef, {
          fileName: file.name,
          fileURL: downloadURL,
          uploadedAt: serverTimestamp(),
        });
      }

      setShowLoading(false);
      setAlertHeader('Success');
      setAlertMessage('Your medical record has been saved.');
      setShowAlert(true);
      handleDismiss();

    } catch (error) {
      console.error('Error saving medical record:', error);
      setShowLoading(false);
      setAlertHeader('Error');
      setAlertMessage('Failed to save your medical record. Please try again.');
      setShowAlert(true);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <IonItem>
              <IonLabel position="stacked">Symptoms (Optional)</IonLabel>
              <IonTextarea placeholder="Enter one symptom per line" value={symptoms} onIonChange={e => setSymptoms(e.detail.value!)}></IonTextarea>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Existing Conditions (Optional)</IonLabel>
              <IonTextarea placeholder="Enter one condition per line" value={conditions} onIonChange={e => setConditions(e.detail.value!)}></IonTextarea>
            </IonItem>
          </>
        );
      case 2:
        return (
          <IonItem>
            <IonLabel position="stacked">Allergies (Optional)</IonLabel>
            <IonTextarea placeholder="Enter one allergy per line" value={allergies} onIonChange={e => setAllergies(e.detail.value!)}></IonTextarea>
          </IonItem>
        );
      case 3:
        return (
          <IonItem>
            <IonLabel>Upload Medical History (Optional)</IonLabel>
            <input type="file" onChange={handleFileChange} />
          </IonItem>
        );
      default:
        return null;
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create Medical Record</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonNote>All fields are optional.</IonNote>
        <h2 style={{ marginTop: '1.5rem' }}>Step {step} of 3</h2>
        
        {renderStep()}

        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', bottom: '20px', width: 'calc(100% - 32px)' }}>
          {step > 1 && <IonButton onClick={prevStep}>Back</IonButton>}
          {step < 3 ? 
            <IonButton onClick={nextStep} style={{ marginLeft: 'auto' }}>Next</IonButton> :
            <IonButton color="success" onClick={handleSave} style={{ marginLeft: 'auto' }}>Save Medical Record</IonButton>
          }
        </div>
        
        <IonLoading isOpen={showLoading} message={'Saving...'} />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonModal>
  );
};

export default CreateMedicalRecord;
