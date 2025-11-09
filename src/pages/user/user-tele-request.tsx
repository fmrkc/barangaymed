import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonTextarea, IonText, IonLoading, IonToast, IonButtons, IonCard, IonItemDivider, IonNote, IonCheckbox, IonFooter, IonIcon, IonGrid, IonRow, IonCol, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, query, getDocs, where } from 'firebase/firestore';
import { getBarangayNameByCode } from '../../services/addressService';
import { UserService } from '../../services/userService';
import { paperPlane, send, arrowBack, arrowForward, open, checkmarkCircle, close } from 'ionicons/icons';

interface UserTeleRequestProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const UserTeleRequest: React.FC<UserTeleRequestProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser, userRole, verificationStatus, barangayId } = useAuth();
    const [reasons, setReasons] = useState({
    'Follow-up check-up': false,
    'New health concern': false,
    'Prescription renewal': false,
    'Mental health support': false,
    'General health advice': false,
    'Others': false,
  });
  const [otherReason, setOtherReason] = useState('');
  const [attachMedicalRecord, setAttachMedicalRecord] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [hasMedicalRecord, setHasMedicalRecord] = useState(false);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const db = getFirestore();

  const isAnyReasonSelected = Object.values(reasons).some(Boolean);

  const isUser = userRole === 'user';

  const fetchMedicalRecordStatus = async () => {
    if (!currentUser) return;
    const medicalRecordDoc = await getDoc(doc(db, 'medicalRecords', currentUser!.uid));
    setHasMedicalRecord(medicalRecordDoc.exists());
  };

  const checkActiveRequest = async () => {
    if (!currentUser) return;
    const activeStatuses = ['pending', 'accepted', 'scheduled'];
    const activeRequestsQuery = query(
      collection(db, 'teleconsultationRequests'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', activeStatuses)
    );
    const activeRequestsSnapshot = await getDocs(activeRequestsQuery);
    setHasActiveRequest(!activeRequestsSnapshot.empty);
  };

  useEffect(() => {
    fetchMedicalRecordStatus();
    checkActiveRequest();
  }, [currentUser]);

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDismiss = () => {
    setStep(1);
    setReasons({
      'Follow-up check-up': false,
      'Prescription renewal': false,
      'New health concern': false,
      'Mental health support': false,
      'General health advice': false,
      'Others': false,
    });
    setOtherReason('');
    setAttachMedicalRecord(false);
    setToastMessage('');
    setShowToast(false);
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

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!isUser) {
      setToastMessage('You must be a registered user to submit a teleconsultation request.');
      setShowToast(true);
      return;
    }
    const reasonString = getReasonString();
    if (!reasonString) {
      setToastMessage('Please provide a reason for the teleconsultation request.');
      setShowToast(true);
      return;
    }
    if (reasons.Others && !otherReason.trim()) {
      setToastMessage('Please specify the other reason.');
      setShowToast(true);
      return;
    }
    if (!barangayId) {
      setToastMessage('Barangay information is missing. Please update your profile.');
      setShowToast(true);
      return;
    }

    if (hasActiveRequest) {
      setToastMessage('You have an active teleconsultation request. Please check your existing requests for updates.');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      // Refresh the user's ID token to ensure latest claims
      await currentUser?.getIdToken(true);

      // Fetch complete user data
      const userService = UserService.getInstance();
      const userData = await userService.getUserData(currentUser?.uid!);

      const barangayName = await getBarangayNameByCode(barangayId);

      let medicalRecord = undefined;
      if (attachMedicalRecord) {
        const medicalRecordRef = doc(db, 'medicalRecords', currentUser?.uid!);
        const medicalRecordSnap = await getDoc(medicalRecordRef);
        if (medicalRecordSnap.exists()) {
          const data = medicalRecordSnap.data();
          const historyFilesQuery = query(collection(db, 'medicalRecords', currentUser.uid!, 'historyFiles'));
          const historyFilesSnap = await getDocs(historyFilesQuery);
          const historyFiles = historyFilesSnap.docs.map(doc => ({
            fileName: doc.data().fileName,
            fileURL: doc.data().fileURL,
            uploadedAt: doc.data().uploadedAt.toDate()
          }));
          medicalRecord = {
            symptoms: data.symptoms || [],
            conditions: data.conditions || [],
            allergies: data.allergies || [],
            historyFiles,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          };
        } else {
          setToastMessage('Medical record not found. Request submitted without attachment.');
          setShowToast(true);
        }
      }

      await addDoc(collection(db, 'teleconsultationRequests'), {
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
        status: 'pending',
        createdAt: serverTimestamp(),
        ...(medicalRecord && { medicalRecord }),
      });
      setHasActiveRequest(true);
      nextStep();
    } catch (error) {
      console.error('Error submitting teleconsultation request:', error);
      setToastMessage('Failed to submit request. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  if (hasActiveRequest) {
    return (
      <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader className='ion-no-border'>
          <IonToolbar>
            <IonTitle>Teleconsultation Request</IonTitle>
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
                <IonText class='ion-text-center'>
                  <IonIcon icon={checkmarkCircle} style={{ fontSize: '48px', color: 'var(--ion-color-primary)' }} />
                </IonText>
                <IonCardTitle>Request sent successfully!</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p className="ion-margin-top">
                  Your request has been successfully sent. Please check your newly created request for updates on the <strong>My Requests</strong> page.
                </p>
                <IonButton expand="block" routerLink="/user/dashboard/requests" className="ion-padding-vertical" onClick={handleDismiss}>
                  Go to My Requests
                  <IonIcon slot="end" icon={open} />
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>
      </>
    );
  }

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader className='ion-no-border'>
          <IonToolbar>
            <IonTitle>Teleconsultation Request</IonTitle>
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
                <h2>What is a Teleconsultation Request?</h2>
              </IonItem>
              <IonItem lines='none'>
                <p>
                  BarangayMed+'s teleconsultation service allows you to consult with healthcare professionals in your barangay remotely via Google Meet. 
                <br /> <br />
                  This form will ask for your current symptoms and/or conditions. You may also choose to attach your medical record if you have created one.
                <br /> <br />
                  After submitting this form, your request will be reviewed by the Rural Health Unit (RHU). If your request is accepted, you will be scheduled a date & time for your consultation.
                <br /><br />
                  Your Consultations will be done via Google Meet. Ensure that you have a stable internet connection and a device with a camera and microphone.
                </p>
              </IonItem>
            </IonCard>
          )}

          {step === 2 && (
            <>
              <IonCard className="ion-padding">
                <IonItem lines='none'>
                  <h2>What are your current symptoms or conditions?</h2>
                </IonItem>
                {Object.keys(reasons).map((reasonKey) => (
                  <IonItem key={reasonKey}>
                    <IonCheckbox
                      justify='space-between'
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
                        placeholder="Please specify other reason"
                        rows={3}
                      />
                    </IonItem>
                    <IonItem>
                      <small>Please provide accurate information to help us assist you better.</small>
                    </IonItem>
                  </>
                )}
              
              </IonCard>

              {hasMedicalRecord && (
                <IonCard className='ion-padding'>
                  <IonItem>
                    Attach Medical Record (Optional)
                    <IonCheckbox
                      slot="end"
                      checked={attachMedicalRecord}
                      onIonChange={e => setAttachMedicalRecord(e.detail.checked)}
                    />
                  </IonItem>
                  <IonItem lines='none'>
                    <small>
                      This medical record will be sent to the RHU along with your request. Ensure that it does not contain sensitive information you do not wish to share.
                    </small>
                  </IonItem>
                </IonCard>
              )}
            </>
          )}

          {step === 3 && (
            <IonCard className="ion-padding">
              <IonItem lines='none'>
                <h2>These are the information you have provided:</h2>
              </IonItem>
              <IonItem lines='none'>
                <IonLabel>Consultation Reason:</IonLabel>
              </IonItem>
              <IonItem lines='none'>
                <IonTextarea
                fill='outline'
                rows={5}
                value={getReasonString()} 
                readonly
                />
              </IonItem>
              {hasMedicalRecord && (
                <IonItem>
                  <IonLabel>Attach Medical Record:</IonLabel>
                  <IonText>{attachMedicalRecord ? 'Yes' : 'No'}</IonText>
                </IonItem>
              )}
            </IonCard>
          )}

          {step === 4 && (
            <IonCard className="ion-padding">
            <IonCardHeader>
              <IonText color={'success'}>
                <h1>Request Submitted Successfully!</h1>
              </IonText>
            </IonCardHeader>
            <IonItem lines='none'>
              <IonText>
                Your teleconsultation request has been submitted. You can check for updates on the <strong>My Requests</strong> page.
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
            {step === 3 && (
              <IonItem lines='none'>
                <p><small> You will be contacted once your request is reviewed. After submitting, you can check updates on this request on <IonText color={'primary'}>My Requests</IonText> .</small></p>
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
            ) : step === 4 ? (
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
                    {step === 2 ? (
                      <IonButton
                        expand="block"
                        shape="round"
                        onClick={nextStep}
                        disabled={!isAnyReasonSelected || (reasons.Others && !otherReason.trim())}
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

export default UserTeleRequest;
