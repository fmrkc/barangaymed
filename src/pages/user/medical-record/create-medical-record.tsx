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

  IonFooter,
  IonProgressBar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonText,
  IonCardSubtitle,
  IonItemDivider,
} from '@ionic/react';
import { arrowBack, arrowForward, checkmarkCircle, cloudUpload } from 'ionicons/icons';
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
          <IonCard>
            <IonCardContent>
              <p>This is a form to help you create your medical record. This form will be used to provide context behind your medicine & consultation requests. </p>
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
              <IonTextarea rows={8} fill="outline" placeholder="Enter one symptom per line" value={symptoms} onIonChange={e => setSymptoms(e.detail.value!)} className="ion-margin-bottom"></IonTextarea>
            </IonItem>
            <IonItemDivider>Existing Conditions (Optional)</IonItemDivider>
            <IonItem>
              <IonTextarea rows={8} fill="outline" placeholder="Enter one condition per line." value={conditions} onIonChange={e => setConditions(e.detail.value!)} className="ion-margin-bottom"></IonTextarea>
            </IonItem>
          </>
        );
      case 3:
        return (
          <>
            <IonItemDivider>Allergies (Optional)</IonItemDivider>
            <IonItem>
              <IonTextarea rows={10} fill="outline" placeholder="Enter one allergy per line." value={allergies} onIonChange={e => setAllergies(e.detail.value!)} className="ion-margin-bottom"></IonTextarea>
            </IonItem>
          </>
        );
      case 4:
        return (
          <>
            <IonItem className="ion-margin-bottom">
              Upload one of the following medical history documents. After upload, the document will be securely stored.
            </IonItem>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="medical-history-upload"
            />
            <IonButton
              expand="block"
              fill={file ? 'solid' : 'outline'}
              color={file ? 'success' : 'primary'}
              onClick={() => document.getElementById('medical-history-upload')?.click()}
              className="ion-margin-vertical"
            >
              <IonIcon slot="start" icon={file ? checkmarkCircle : cloudUpload} />
              <IonText className="ion-padding-vertical">
                {file ? 'Medical History Uploaded' : 'Upload Medical History'}
              </IonText>
            </IonButton>
            {file && (
              <IonText color="success">
                Uploaded file: {file.name}
              </IonText>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Create Medical Record</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss}>Close</IonButton>
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
                {step === 4 && 'Step 4: Upload Medical History'}
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
                      <IonButton className='ion-padding-vertical' color="success" expand="block" shape="round" onClick={handleSave}>
                        Save Medical Record
                        <IonIcon slot="end" icon={checkmarkCircle} />
                      </IonButton>
                    )}
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonToolbar>
          </IonFooter>

          <IonLoading isOpen={showLoading} message={'Saving...'} />
          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header={alertHeader}
            message={alertMessage}
            buttons={['OK']}
          />
    </IonModal>
  );
};

export default CreateMedicalRecord;
