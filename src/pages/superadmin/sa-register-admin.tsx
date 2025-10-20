import {
    IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonToast, IonItem, IonText,
    IonProgressBar,
    IonCardSubtitle,
    IonItemDivider,
    IonFooter,
    IonCardHeader,
    IonCardTitle
} from '@ionic/react';
import { checkmarkDoneOutline, arrowForward, person, arrowBack, close } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { getBarangaysByCityMunicipality, Barangay } from '../../services/addressService';
import { useAuth } from '../../contexts/AuthContext';

const AdminRegister: React.FC = () => {
    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();
    const { cityMunicipalityId } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const progress = currentStep / 4;

    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [suffix, setSuffix] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [barangayId, setBarangay] = useState('');
    const [assignedLocation, setAssignedLocation] = useState('');
    const [specificRole, setSpecificRole] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const [barangays, setBarangays] = useState<Barangay[]>([]);

    useEffect(() => {
        const loadBarangays = async () => {
            if (cityMunicipalityId) {
                setBarangays(await getBarangaysByCityMunicipality(cityMunicipalityId));
                setBarangay('');
            } else {
                setBarangays([]);
                setBarangay('');
            }
        };
        loadBarangays();
    }, [cityMunicipalityId]);

    const validateStep1 = () => {
        if (!firstName.trim() || !lastName.trim()) {
            setError('First name and last name are required.');
            setShowErrorToast(true);
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep2 = () => {
        if (!birthdate || !gender || !address.trim()) {
            setError('Birthdate, gender, and address are required.');
            setShowErrorToast(true);
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep3 = () => {
        if (!contactEmail.trim() || !barangayId || !assignedLocation.trim()) {
            setError('Email, barangay, and assigned location are required.');
            setShowErrorToast(true);
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            setError('Please enter a valid email address.');
            setShowErrorToast(true);
            return false;
        }
        setError(null);
        return true;
    };

    const nextStep = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        } else if (currentStep === 3 && validateStep3()) {
            setCurrentStep(4);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError(null); // Clear error when going back
        }
    };

    const handleProvisionAdmin = async (event: any) => {
        event.preventDefault();
        if (!validateStep1() || !validateStep2() || !validateStep3()) {
            setError('Please fill all required fields before submitting.');
            setShowErrorToast(true);
            return;
        }

        await present('Creating BHW Account...');
        const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ');

        try {
            const provisionUserFunction = httpsCallable(functions, 'provisionUser');
            await provisionUserFunction({
                firstName,
                middleName,
                lastName,
                suffix,
                fullName,
                birthdate,
                gender,
                address,
                contactEmail,
                role: 'admin',
                barangayId,
                cityMunicipalityId, // Explicitly pass cityMunicipalityId
                assignedLocation,
                specificRole,
            });

            dismiss();
            setSuccessMessage('BHW account created successfully. Details have been sent to the provided email address.');
            setShowSuccessToast(true);
            // Clear form
            setFirstName('');
            setMiddleName('');
            setLastName('');
            setSuffix('');
            setBirthdate('');
            setGender('');
            setAddress('');
            setContactEmail('');
            setBarangay('');
            setAssignedLocation('');
            setSpecificRole('');
            setCurrentStep(1);

        } catch (err: any) {
            dismiss();
            setError(err.message || 'Registration failed. Please try again.');
            setShowErrorToast(true);
        }
    }

    return (
      <IonPage>
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonTitle>Create BHW Account</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => router.goBack()}>
                <IonIcon icon={close} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
          <IonProgressBar value={progress}></IonProgressBar>
        </IonHeader>

        <IonContent>
          <IonToast
            isOpen={showErrorToast}
            onDidDismiss={() => setShowErrorToast(false)}
            message={error || ""}
            duration={3000}
            color="danger"
          />
          <IonToast
            isOpen={showSuccessToast}
            onDidDismiss={() => setShowSuccessToast(false)}
            message={successMessage || ""}
            duration={3000}
            color="success"
          />
          <IonGrid fixed>
            <IonRow className="ion-justify-content-center">
              <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
                {currentStep === 1 && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>Step 1: Personal Details</IonCardTitle>
                      <IonCardSubtitle>
                        Please provide the user's full name.
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonItemDivider>First Name *</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonInput
                          fill="outline"
                          placeholder="e.g. Juan"
                          value={firstName}
                          onIonChange={(e) => setFirstName(e.detail.value!)}
                          required
                        >
                          <IonIcon slot="start" icon={person}></IonIcon>
                        </IonInput>
                      </IonItem>
                      <IonItemDivider>Middle Name (Optional)</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonInput
                          fill="outline"
                          placeholder="e.g. Dela"
                          value={middleName}
                          onIonChange={(e) => setMiddleName(e.detail.value!)}
                        >
                          <IonIcon slot="start" icon={person}></IonIcon>
                        </IonInput>
                      </IonItem>
                      <IonItemDivider>Last Name *</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonInput
                          fill="outline"
                          placeholder="e.g. Cruz"
                          value={lastName}
                          onIonChange={(e) => setLastName(e.detail.value!)}
                          required
                        >
                          <IonIcon slot="start" icon={person}></IonIcon>
                        </IonInput>
                      </IonItem>
                      <IonItemDivider>Suffix (Optional)</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonInput
                          fill="outline"
                          placeholder="e.g. Jr., Sr."
                          value={suffix}
                          onIonChange={(e) => setSuffix(e.detail.value!)}
                        >
                          <IonIcon slot="start" icon={person}></IonIcon>
                        </IonInput>
                      </IonItem>
                    </IonCardContent>
                  </IonCard>
                )}

                {currentStep === 2 && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>
                        Step 2: Personal Details
                      </IonCardTitle>
                      <IonCardSubtitle>
                        Please provide the user's birthdate, gender, and address.
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonItemDivider>Birthdate *</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonInput
                          fill="outline"
                          type="date"
                          value={birthdate}
                          max={new Date().toISOString().split("T")[0]}
                          onIonChange={(e) => setBirthdate(e.detail.value!)}
                          required
                        />
                      </IonItem>
                      <IonItemDivider>Gender *</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonSelect
                          fill="outline"
                          value={gender}
                          onIonChange={(e) => setGender(e.detail.value!)}
                          placeholder="Select Gender"
                          required
                        >
                          <IonSelectOption value="Male">Male</IonSelectOption>
                          <IonSelectOption value="Female">
                            Female
                          </IonSelectOption>
                        </IonSelect>
                      </IonItem>
                      <IonItemDivider>Address *</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonInput
                          fill="outline"
                          placeholder="e.g. 123 Main St, Barangay"
                          value={address}
                          onIonChange={(e) => setAddress(e.detail.value!)}
                          required
                        />
                      </IonItem>
                    </IonCardContent>
                  </IonCard>
                )}

                {currentStep === 3 && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>
                        Step 3: Assigned Details
                      </IonCardTitle>
                      <IonCardSubtitle>
                        Please provide the user's assigned barangay, location, and specific role.
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonItemDivider>Assigned Barangay *</IonItemDivider>
                        <IonItem className='ion-margin-vertical' lines='none'>
                          <IonSelect
                            fill="outline"
                            value={barangayId}
                            placeholder="Select Barangay"
                            onIonChange={(e) => setBarangay(e.detail.value)}
                            disabled={!cityMunicipalityId}
                          >
                            {barangays.map((brgy) => (
                              <IonSelectOption
                                key={brgy.code}
                                value={brgy.code}
                              >
                                {brgy.name}
                              </IonSelectOption>
                            ))}
                          </IonSelect>
                        </IonItem>
                        <IonItemDivider>Assigned Location *</IonItemDivider>
                        <IonItem className='ion-margin-vertical' lines='none'>
                          <IonInput
                            fill="outline"
                            placeholder="e.g. Health Center, Clinic Name"
                            value={assignedLocation}
                            onIonChange={(e) =>
                              setAssignedLocation(e.detail.value!)
                            }
                          />
                        </IonItem>
                        <IonItemDivider>
                          Specific Role (Optional)
                        </IonItemDivider>
                        <IonItem className='ion-margin-vertical' lines='none'>
                          <IonInput
                            fill="outline"
                            placeholder="e.g. Nurse, Doctor"
                            value={specificRole}
                            onIonChange={(e) =>
                              setSpecificRole(e.detail.value!)
                            }
                          />
                        </IonItem>
                        <IonItemDivider>Contact Email *</IonItemDivider>
                        <IonItem>
                          <IonInput
                            fill="outline"
                            type="email"
                            value={contactEmail}
                            onIonChange={(e) =>
                              setContactEmail(e.detail.value!)
                            }
                            placeholder="juan@example.com"
                            helperText=' Please make sure that this email address is correct and is a working email address. This email will be used to send a separate email containing a custom email address and password. '
                          />
                        </IonItem>
                    </IonCardContent>
                  </IonCard>
                )}

                {currentStep === 4 && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>Step 4: Summary</IonCardTitle>
                      <IonCardSubtitle>
                        Please make sure that the entered information is correct.
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonItemDivider>Full Name</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{[firstName, middleName, lastName, suffix].filter(Boolean).join(' ')}</IonText>
                      </IonItem>
                      <IonItemDivider>Birthdate</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{birthdate}</IonText>
                      </IonItem>
                      <IonItemDivider>Gender</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{gender}</IonText>
                      </IonItem>
                      <IonItemDivider>Address</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{address}</IonText>
                      </IonItem>
                      <IonItemDivider>Assigned Barangay</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{barangays.find(brgy => brgy.code === barangayId)?.name || 'N/A'}</IonText>
                      </IonItem>
                      <IonItemDivider>Assigned Location</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{assignedLocation}</IonText>
                      </IonItem>
                      <IonItemDivider>Specific Role</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{specificRole || 'N/A'}</IonText>
                      </IonItem>
                      <IonItemDivider>Contact Email</IonItemDivider>
                      <IonItem className="ion-margin-vertical" lines="none">
                        <IonText>{contactEmail}</IonText>
                      </IonItem>
                    </IonCardContent>
                  </IonCard>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
        <IonFooter>
          <IonToolbar>
            {currentStep === 1 && (
              <IonButton
                expand="block"
                shape="round"
                onClick={nextStep}
                className="ion-margin"
              >
                <IonIcon slot="end" icon={arrowForward} />
                <IonText className="ion-padding-vertical">Next</IonText>
              </IonButton>
            )}
            {currentStep === 2 && (
              <IonGrid>
                <IonRow>
                  <IonCol size="3">
                    <IonButton
                    expand='block'
                    shape="round" 
                    fill="outline" 
                    onClick={prevStep}
                    >
                      <IonIcon slot="start" icon={arrowBack} />
                      <IonText className='ion-padding-vertical'>Back</IonText>
                    </IonButton>
                  </IonCol>
                  <IonCol size="9">
                    <IonButton
                    expand='block'
                      shape="round"
                      onClick={nextStep}
                    >
                      <IonIcon slot="end" icon={arrowForward} />
                      <IonText className='ion-padding-vertical'>Next</IonText>
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            )}
            {currentStep === 3 && (
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
                      <IonText className="ion-padding-vertical">Back</IonText>
                    </IonButton>
                  </IonCol>
                  <IonCol size="9">
                    <IonButton
                      expand="block"
                      shape="round"
                      onClick={nextStep}
                    >
                      <IonIcon slot="end" icon={arrowForward} />
                      <IonText className="ion-padding-vertical">Next</IonText>
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            )}
            {currentStep === 4 && (
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
                      <IonText className="ion-padding-vertical">Back</IonText>
                    </IonButton>
                  </IonCol>
                  <IonCol size="9">
                    <IonButton
                      color={"success"}
                      expand="block"
                      shape="round"
                      onClick={handleProvisionAdmin}
                    >
                      <IonText className="ion-padding-vertical">
                        Create and Send Account
                      </IonText>
                      <IonIcon slot="end" icon={checkmarkDoneOutline} />
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            )}
          </IonToolbar>
        </IonFooter>
      </IonPage>
    );
};

export default AdminRegister;