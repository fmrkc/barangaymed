import React, { useState, useRef, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonTextarea, IonText, IonLoading, IonToast, IonButtons, IonCard, IonItemDivider, IonNote, IonCheckbox, IonFooter, IonIcon, IonGrid, IonRow, IonCol, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, addDoc, serverTimestamp, query, getDocs, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserService } from '../../services/userService';
import { getBarangayNameByCode } from '../../services/addressService';
import { paperPlane, send, arrowBack, arrowForward, open, cloudUpload, checkmarkCircle, close } from 'ionicons/icons';

interface UserMedRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserMedRequest: React.FC<UserMedRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser, userRole, barangayId } = useAuth();
    const [reasons, setReasons] = useState({
    'Fever': false,
    'Cough and Colds': false,
    'Headache': false,
    'Body Pain': false,
    'Allergies': false,
    'Diarrhea': false,
    'Others': false,
  });
  const [otherReason, setOtherReason] = useState('');
  const [hasPrescription, setHasPrescription] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const db = getFirestore();
  const storage = getStorage();

  const isUser = userRole === 'user';

  const checkActiveRequest = async () => {
    if (!currentUser) return;
    const activeStatuses = ['pending', 'accepted', 'scheduled'];
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
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDismiss = () => {
    setStep(1);
        setReasons({
      'Fever': false,
      'Cough and Colds': false,
      'Headache': false,
      'Body Pain': false,
      'Allergies': false,
      'Diarrhea': false,
      'Others': false,
    });
    setOtherReason('');
    setHasPrescription(false);
    setPrescriptionFile(null);
    setToastMessage('');
    setShowToast(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setToastMessage('Invalid file type. Only PNG, JPG, and JPEG are allowed.');
        setShowToast(true);
        setPrescriptionFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > maxSize) {
        setToastMessage('File size exceeds 5MB limit.');
        setShowToast(true);
        setPrescriptionFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setPrescriptionFile(file);
    }
  };

    const getReasonString = () => {
    const selectedReasons = Object.entries(reasons)
      .filter(([, isChecked]) => isChecked)
      .map(([reason]) => reason)
      .filter(reason => reason !== 'Others');

    let finalReason = selectedReasons.join(', ');

    if (reasons.Others && otherReason.trim()) {
      if (finalReason) {
        finalReason += `, ${otherReason.trim()}`;
      } else {
        finalReason = otherReason.trim();
      }
    }
    return finalReason;
  };

  const isAnyReasonSelected = Object.values(reasons).some(Boolean);

  const handleSubmit = async () => {
    if (!isUser) {
      setToastMessage('You must be a registered user to submit a medicine request.');
      setShowToast(true);
      return;
    }
    const reasonString = getReasonString();
    if (!reasonString) {
      setToastMessage('Please provide a reason for the medicine request.');
      setShowToast(true);
      return;
    }
    if (reasons.Others && !otherReason.trim()) {
      setToastMessage('Please specify the other reason.');
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
    if (hasActiveRequest) {
      setToastMessage('You have an active medicine request. Please check your existing requests for updates.');
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

      const barangayName = await getBarangayNameByCode(barangayId);
      await addDoc(collection(db, 'medicineRequests'), {
        userId: currentUser?.uid,
        barangayId: barangayId,
        barangayName: barangayName,
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
        reason: reasonString,
        hasPrescription,
        prescriptionUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setHasActiveRequest(true);
      nextStep();
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
              <IonButton onClick={onDidDismiss}>
                 <IonIcon slot="icon-only" icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '90%' }}>
            <IonCard style={{ maxWidth: '450px', textAlign: 'center' }}>
              <IonCardHeader>
                <IonText className='ion-text-center'>
                  <IonIcon icon={checkmarkCircle} style={{ fontSize: '48px', color: 'var(--ion-color-primary)' }} />
                </IonText>
                <IonCardTitle>Request sent successfully!</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p className="ion-margin-top">
                  Your request has been successfully sent. Please check your newly created request for updates on the <strong>My Requests</strong> page.
                </p>
                <IonButton expand="block" routerLink="/user/dashboard/requests" className="ion-padding-vertical" onClick={onDidDismiss}>
                  Go to My Requests
                  <IonIcon slot="end" icon={open} />
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>
    );
  }

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader className='ion-no-border'>
          <IonToolbar>
            <IonTitle>Create Medicine Request</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onDidDismiss}>
                 <IonIcon slot="icon-only" icon={close} />
              </IonButton>
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
            <IonCard className="ion-padding">
              <IonItem lines='none'>
                <h2>What are your current symptoms or conditions?</h2>
              </IonItem>
              {Object.keys(reasons).map((reasonKey) => (
                <IonItem key={reasonKey}>
                  <IonCheckbox
                    justify="space-between"
                    checked={reasons[reasonKey as keyof typeof reasons]}
                    onIonChange={e => {
                      setReasons(prev => ({ ...prev, [reasonKey]: e.detail.checked }));
                    }}
                  >
                    {reasonKey}
                  </IonCheckbox>
                </IonItem>
              ))}
              {reasons.Others && (
                <>
                  <IonItem className="ion-margin-top">
                    <IonTextarea
                      fill="outline"
                      value={otherReason}
                      onIonInput={e => setOtherReason((e.target as HTMLIonTextareaElement).value ?? '')}
                      onIonFocus={() => setIsDebouncing(true)}
                      onIonBlur={() => setTimeout(() => setIsDebouncing(false), 1500)}
                      placeholder="Please specify your reason here..."
                      rows={3}
                    />
                  </IonItem>
                  <IonItem lines='none' className='ion-margin-top'>
                    <small>Please provide accurate information to help us assist you better.</small>
                  </IonItem>
                </>
              )}
             
            </IonCard>
          )}

          {step === 3 && (
            <>
              <IonCard className='ion-padding'>
                <IonItem lines='none'>
              <h2>Upload a prescription (optional)</h2>
              </IonItem>
              <IonItem lines='none'>
                  <small>
                    Upload a photo of your prescription if available. This will help the RHU process your request faster.
                  </small>
                </IonItem>
                <IonItem>
                  Do you have a prescription?
                  <IonCheckbox
                    slot="end"
                    checked={hasPrescription}
                    onIonChange={e => setHasPrescription(e.detail.checked)}
                  />
                </IonItem>

                {hasPrescription && (
                  <IonCard>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                    />
                    <IonButton className='ion-padding-vertical' expand='block' onClick={() => fileInputRef.current?.click()}>
                      {prescriptionFile ? 'Change Prescription' : 'Upload Prescription'}
                      <IonIcon slot="start" icon={cloudUpload} />
                    </IonButton>
                    {prescriptionFile && (
                      <>
                        <IonItem>
                          Uploaded file: &nbsp;
                          <IonText color={'primary'}>
                            {prescriptionFile.name}
                          </IonText>
                        </IonItem>
                        <IonItem lines='none'>
                          <img src={URL.createObjectURL(prescriptionFile)} alt="Uploaded Prescription" style={{ maxWidth: '100%', marginTop: '10px' }} />
                        </IonItem>
                      </>
                    )}
                    {!prescriptionFile && (
                      <IonItem lines="none">
                        Accepted file types: PNG, JPG, JPEG. Maximum file size: 5MB.
                      </IonItem>
                    )}
                  </IonCard>
                )}

              </IonCard>
            </>
          )}

          {step === 4 && (
            <>
              <IonCard className="ion-padding">
              <IonItem lines='none'>
                <h2>These are the information you have provided:</h2>
              </IonItem>

              <IonItem>
                <IonTextarea color={'primary'} fill='outline' value={getReasonString() || 'Not provided'} rows={10} readonly></IonTextarea>
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
            <IonCard>
              <IonItem lines='none'>
                <small>
                  Please review the information above before submitting your request. You can go back to make changes if needed.
                </small>
              </IonItem>
            </IonCard>
            </>
          )}

          {step === 5 && (
            <IonCard className="ion-padding">
              <IonCardHeader>
                <IonText color={'success'}>
                  <h1>Request Submitted Successfully!</h1>
                </IonText>
              </IonCardHeader>
              <IonItem lines='none'>
                <IonText>
                  Your medicine request has been submitted. You can check for updates on the <strong>My Requests</strong> page.
                </IonText>
              </IonItem>
              <IonButton expand="block" routerLink="/user/dashboard/requests" className="ion-padding-vertical" onClick={onDidDismiss}>
                Go to My Requests
                <IonIcon slot="end" icon={open} />
              </IonButton>          
            </IonCard>
          )}

          <IonLoading isOpen={loading} message={'Submitting request...'} />
        </IonContent>
        <IonFooter>
          <IonToolbar>
            {step === 4 && (
              <IonItem lines='none'>
                <p><small>You will be contacted once your request is reviewed. After submitting, you can check updates on this request on <IonText color={'primary'}>My Requests</IonText> .</small></p>
              </IonItem>
            )}
            {step === 1 ? (
              <IonButton
                expand="block"
                shape="round"
                onClick={nextStep}
                className="ion-margin"
              >
                <IonIcon slot="end" icon={arrowForward} />
                <IonText className='ion-padding-vertical'>Next</IonText>
              </IonButton>
            ) : step === 5 ? (
              <IonButton
                expand="block"
                shape="round"
                onClick={onDidDismiss}
                className="ion-margin"
              >
                Close
              </IonButton>
            ) : (
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
                    {step < 4 ? (
                      <IonButton
                        expand="block"
                        shape="round"
                        onClick={nextStep}
                        disabled={(step === 3 && hasPrescription && !prescriptionFile) || (step === 2 && (!isAnyReasonSelected || (reasons.Others && !otherReason.trim())))}
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
                        disabled={loading || isDebouncing}
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
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => {
          setShowToast(false);
          setToastMessage('');
        }}
        message={toastMessage}
        duration={3000}
        color={'danger'}
      />
    </>
  );
};

export default UserMedRequest;