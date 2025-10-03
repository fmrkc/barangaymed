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
} from '@ionic/react';
import { useAuth } from '../../../contexts/AuthContext';
import { db, storage } from '../../../firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';

interface ViewMedicalRecordProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const ViewMedicalRecord: React.FC<ViewMedicalRecordProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [historyFiles, setHistoryFiles] = useState<any[]>([]);

  const [showLoading, setShowLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertHeader, setAlertHeader] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

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
      setAlertHeader('Success');
      setAlertMessage('Your medical record has been updated.');
      setShowAlert(true);

    } catch (error) {
      console.error("Error updating medical record:", error);
      setShowLoading(false);
      setAlertHeader('Error');
      setAlertMessage('Failed to update your medical record.');
      setShowAlert(true);
    }
  };

  const handleDismiss = () => {
    setIsEditing(false);
    onDidDismiss();
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isEditing ? 'Edit' : 'View'} Medical Record</IonTitle>
          <IonButtons slot="start">
             <IonButton onClick={handleDismiss}>Close</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            {!isEditing ? (
              <IonButton onClick={() => setIsEditing(true)}>Edit</IonButton>
            ) : (
              <IonButton color="success" onClick={handleSave}>Save</IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={showLoading} message={'Loading...'} />
        <IonNote>All fields are optional. You can edit them at any time.</IonNote>

        <IonItemDivider style={{ marginTop: '1rem' }}>Details</IonItemDivider>
        <IonItem>
          <IonLabel position="stacked">Symptoms</IonLabel>
          <IonTextarea readonly={!isEditing} value={symptoms} onIonChange={e => setSymptoms(e.detail.value!)}></IonTextarea>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Existing Conditions</IonLabel>
          <IonTextarea readonly={!isEditing} value={conditions} onIonChange={e => setConditions(e.detail.value!)}></IonTextarea>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Allergies</IonLabel>
          <IonTextarea readonly={!isEditing} value={allergies} onIonChange={e => setAllergies(e.detail.value!)}></IonTextarea>
        </IonItem>

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

export default ViewMedicalRecord;
