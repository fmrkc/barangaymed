import React, { useState, useRef, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonTextarea, IonText, IonLoading, IonToast, IonButtons, IonCard, IonItemDivider, IonNote, IonCheckbox, IonFooter, IonIcon, IonGrid, IonRow, IonCol, IonCardHeader } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, addDoc, serverTimestamp, query, getDocs, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserService } from '../../services/userService';
import { paperPlane, send, arrowBack, arrowForward, open } from 'ionicons/icons';

interface UserMedRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserMedRequest: React.FC<UserMedRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser, userRole, barangayId } = useAuth();
  const [reason, setReason] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const db = getFirestore();
  const storage = getStorage();

  const isUser = userRole === 'user';

  const checkActiveRequest = async () => {
    if (!currentUser) return;
    const activeStatuses = ['pending', 'accepted', 'scheduled', 'pending completion'];
    const activeRequestsQuery = query(
      collection(db, 'medicineRequests'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', activeStatuses)
    );
    const activeRequestsSnapshot = await getDocs(activeRequestsQuery);
    setHasActiveRequest(!activeRequestsSnapshot.empty);
  };

  useEffect(() => {
    checkActiveRequest();
  }, [currentUser]);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDismiss = () => {
    setStep(1);
    setReason('');
    setHasPrescription(false);
    setPrescriptionFile(null);
    onDidDismiss();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPrescriptionFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!isUser) {
      setToastMessage('You must be a registered user to submit a medicine request.');
      setShowToast(true);
      return;
    }
    if (!reason.trim()) {
      setToastMessage('Please provide a reason for the medicine request.');
      setShowToast(true);
      return;
    }
    if (hasPrescription && !prescriptionFile) {
      setToastMessage('Please upload a photo of your prescription.');
      setShowToast(true);
      return;
    }
    if (!barangayId) {
      setToastMessage('Barangay information is missing. Please update your profile.');
      setShowToast(true);
      return;
    }
    setLoading(true);
    try {
      await currentUser?.getIdToken(true);

      const userService = UserService.getInstance();
      const userData = await userService.getUserData(currentUser?.uid!);

      let prescriptionUrl = '';
      if (hasPrescription && prescriptionFile) {
        const storageRef = ref(storage, `prescriptions/${currentUser?.uid}/${Date.now()}_${prescriptionFile.name}`);
        const uploadResult = await uploadBytes(storageRef, prescriptionFile);
        prescriptionUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, 'medicineRequests'), {
        userId: currentUser?.uid,
        barangayId: barangayId,
        userData: {
          firstName: userData.firstName,
          middleName: userData.middleName,
          lastName: userData.lastName,
          suffix: userData.suffix,
          address: userData.address,
          gender: userData.gender,
          contactNumber: userData.contactNumber,
          email: userData.email,
        },
        reason: reason.trim(),
        hasPrescription,
        prescriptionUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setToastMessage('Medicine request submitted successfully.');
      setShowToast(true);
      setReason('');
      setHasPrescription(false);
      setPrescriptionFile(null);
      onDidDismiss(); 
    } catch (error) {
      console.error('Error submitting medicine request:', error);
      setToastMessage('Failed to submit request. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  if (hasActiveRequest) {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader className='ion-no-border'>
          <IonToolbar>
            <IonTitle>Medicine Request</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleDismiss}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard className="ion-padding">
            <IonCardHeader>
              <IonText color={'primary'}>
                <h1>You already have an active request.</h1>
              </IonText>
            </IonCardHeader>
          <IonItem lines='none'>
              <IonText>
            You already have an active medicine request. Please check your existing request for updates on the <strong>My Requests</strong> page.
          </IonText>
          </IonItem>
          <IonButton expand="block" routerLink="/user/dashboard/requests/medicine-requests" className="ion-padding-vertical" onClick={handleDismiss}>
            Go to My Requests
            <IonIcon slot="end" icon={open} />
          </IonButton>
          </IonCard>
          
        </IonContent>
      </IonModal>
    );
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Medicine Request</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {step === 1 && (
          <IonCard className="ion-padding">
            <IonItem lines='none'>
              <h2>What is a Medicine Request?</h2>
            </IonItem>
            <IonItem lines='none'>
              <p>
                BarangayMed+'s medicine request service allows you to request essential medicines from your barangay health unit.
              <br /> <br />
                This form will ask for your current symptoms and/or conditions. You may also choose to upload a prescription if you have one.
              <br /> <br />
                After submitting this form, your request will be reviewed by the Rural Health Unit (RHU). If your request is accepted, you will be notified.
              <br /><br />
                Ensure that you provide accurate information to help us assist you better.
              </p>
            </IonItem>
          </IonCard>
        )}

        {step === 2 && (
          <>
            <IonCard className="ion-padding">
              <IonItem lines='none'>
                Medicine Request Reason:
              </IonItem>
              <IonItem lines='none'>
                <IonTextarea
                  fill='outline'
                  value={reason}
                  onIonChange={e => setReason(e.detail.value!)}
                  rows={6}
                  maxlength={500}
                  placeholder="Describe your reason for requesting medicine. Include any symptoms or conditions you have."
                />
              </IonItem>
              <IonItem>
                <small>Please provide accurate information to help us assist you better.</small>
              </IonItem>
            </IonCard>

            <IonCard className='ion-padding'>
              <IonItem>
                Do you have a prescription?
                <IonCheckbox
                  slot="end"
                  checked={hasPrescription}
                  onIonChange={e => setHasPrescription(e.detail.checked)}
                />
              </IonItem>
              {hasPrescription && (
                <IonItem lines='none'>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <IonButton onClick={() => fileInputRef.current?.click()}>
                    Upload Prescription
                  </IonButton>
                  {prescriptionFile && <IonText>{prescriptionFile.name}</IonText>}
                </IonItem>
              )}
              <IonItem lines='none'>
                <small>
                  Upload a photo of your prescription if available. This will help the RHU process your request faster.
                </small>
              </IonItem>
            </IonCard>
          </>
        )}

        {step === 3 && (
          <IonCard className="ion-padding">
            <IonItem lines='none'>
              <h2>Request Summary</h2>
            </IonItem>
            <IonItem>
              <IonLabel>Request Reason:</IonLabel>
              <IonText>{reason || 'Not provided'}</IonText>
            </IonItem>
            <IonItem>
              <IonLabel>Has Prescription:</IonLabel>
              <IonText>{hasPrescription ? 'Yes' : 'No'}</IonText>
            </IonItem>
            {hasPrescription && prescriptionFile && (
              <IonItem>
                <IonLabel>Prescription File:</IonLabel>
                <IonText>{prescriptionFile.name}</IonText>
              </IonItem>
            )}
          </IonCard>
        )}

        <IonLoading isOpen={loading} message={'Submitting request...'} />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastMessage.includes('successfully') ? 'success' : 'danger'}
        />
      </IonContent>
      <IonFooter>
        <IonToolbar>
          {step === 3 && (
            <IonItem lines='none'>
              <p><small>Note that submission of this form does not guarantee approval. You will be contacted once your request is reviewed. After submitting, you can check updates on this request on <IonText color={'primary'}>My Requests</IonText> .</small></p>
            </IonItem>
          )}
          {step === 1 && (
            <IonButton
              expand="block"
              shape="round"
              onClick={nextStep}
              className="ion-margin"
            >
              <IonIcon slot="end" icon={arrowForward} />
              <IonText className='ion-padding-vertical'>Next</IonText>
            </IonButton>
          )}

          {(step === 2 || step === 3) && (
            <IonGrid>
              <IonRow>
                <IonCol size="3">
                  <IonButton
                    expand="block"
                    shape="round"
                    fill="outline"
                    onClick={prevStep}
                  >
                    <IonIcon slot="start" icon={arrowBack} />
                    <IonText className='ion-padding-vertical'>Back</IonText>
                  </IonButton>
                </IonCol>
                <IonCol size="9">
                  {step === 2 ? (
                    <IonButton
                      expand="block"
                      shape="round"
                      onClick={nextStep}
                    >
                      <IonIcon slot="end" icon={arrowForward} />
                      <IonText className='ion-padding-vertical'>Next</IonText>
                    </IonButton>
                  ) : (
                    <IonButton
                      color={'success'}
                      expand="block"
                      shape="round"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      <IonText className='ion-padding-vertical'>Submit Request</IonText>
                      <IonIcon slot="end" icon={paperPlane} />
                    </IonButton>
                  )}
                </IonCol>
              </IonRow>
            </IonGrid>
          )}
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default UserMedRequest;