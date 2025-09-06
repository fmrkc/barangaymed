import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonText,
  IonToast,
  IonLoading,
  IonProgressBar,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonCardTitle,
  IonCardSubtitle,
  IonItem, // Added IonItem
} from '@ionic/react';

import { close, arrowBack, arrowForward, cloudUpload, checkmarkCircle } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


import { logEvent } from '../../utils/logger';
import { MaskitoOptions } from '@maskito/core';
import { useMaskito } from '@maskito/react';
import { getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality, getZipCodeByBarangay, Region, Province, CityMunicipality, Barangay } from '../../services/addressService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';

interface FullRegistrationModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const FullRegistrationModal: React.FC<FullRegistrationModalProps> = ({ isOpen, onDidDismiss }) => {
  const { currentUser, userRole } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Region, Province, City/Municipality, Barangay
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCityMunicipality, setSelectedCityMunicipality] = useState('');
  const [barangayId, setBarangayId] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Step 2: Specific Address Details and Contact Info
  const [lotBlkHouseNo, setLotBlkHouseNo] = useState('');
  const [streetName, setStreetName] = useState('');
  const [subdivisionVillageZonePurok, setSubdivisionVillageZonePurok] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Step 3: Document Uploads
  const [barangayIdFile, setBarangayIdFile] = useState<File | null>(null);
  const [barangayCertificateFile, setBarangayCertificateFile] = useState<File | null>(null);

  const phoneMaskOptions: MaskitoOptions = {
    mask: ['+', '(', '6', '3', ')', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/],
  };
  const phoneMask = useMaskito({ options: phoneMaskOptions });

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);



  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regionsData = await getRegions();
        setRegions(regionsData);
      } catch (error) {
        console.error('Error loading regions:', error);
        setRegions([]);
      }
    };

    if (isOpen) {
      loadRegions();
      if (currentUser) {
        loadExistingData();
      }
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    const loadProvinces = async () => {
      if (selectedRegion) {
        try {
          const provincesData = await getProvincesByRegion(selectedRegion);
          // Sort provinces alphabetically by name
          provincesData.sort((a, b) => a.name.localeCompare(b.name));
          setProvinces(provincesData);
        } catch (error) {
          console.error('Error loading provinces:', error);
          setProvinces([]);
        }
      } else {
        setProvinces([]);
      }
      setSelectedProvince('');
      setSelectedCityMunicipality('');
      setBarangayId('');
      setZipCode('');
    };
    loadProvinces();
  }, [selectedRegion]);
  
  useEffect(() => {
    const loadCitiesMunicipalities = async () => {
      if (selectedProvince) {
        try {
          const citiesData = await getCitiesMunicipalitiesByProvince(selectedProvince);
          // Sort cities/municipalities alphabetically by name
          citiesData.sort((a, b) => a.name.localeCompare(b.name));
          setCitiesMunicipalities(citiesData);
        } catch (error) {
          console.error('Error loading cities/municipalities:', error);
          setCitiesMunicipalities([]);
        }
      } else {
        setCitiesMunicipalities([]);
      }
      setSelectedCityMunicipality('');
      setBarangayId('');
      setZipCode('');
    };
    loadCitiesMunicipalities();
  }, [selectedProvince]);
  
  useEffect(() => {
    const loadBarangays = async () => {
      setIsLoadingBarangays(true);
      if (selectedCityMunicipality) {
        try {
          const barangaysData = await getBarangaysByCityMunicipality(selectedCityMunicipality);
          // Sort barangays alphabetically by name
          barangaysData.sort((a, b) => a.name.localeCompare(b.name));
          setBarangays(barangaysData);
        } catch (error) {
          console.error('Error loading barangays:', error);
          setBarangays([]);
        }
      } else {
        setBarangays([]);
      }
      setBarangayId('');
      setZipCode('');
      setIsLoadingBarangays(false);
    };
    loadBarangays();
  }, [selectedCityMunicipality]);



  const loadExistingData = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setSelectedRegion(data.selectedRegion || '');
        setSelectedProvince(data.selectedProvince || '');
        setSelectedCityMunicipality(data.selectedCityMunicipality || '');
        setBarangayId(data.barangayId || '');
        setZipCode(data.zipCode || '');
        setLotBlkHouseNo(data.lotBlkHouseNo || '');
        setStreetName(data.streetName || '');
        setSubdivisionVillageZonePurok(data.subdivisionVillageZonePurok || '');
        setContactNumber(data.contactNumber || '');
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const handleBarangayChange = async (brgyCode: string) => {
    setBarangayId(brgyCode);
    try {
      const zip = await getZipCodeByBarangay(brgyCode);
      setZipCode(zip || '');
    } catch (error) {
      console.error('Error fetching zip code:', error);
      setZipCode('');
    }
  };

  const validateStep1 = () => {
    if (!selectedRegion) {
      setError('Region is required.');
      return false;
    }
    if (!selectedProvince) {
      setError('Province is required.');
      return false;
    }
    if (!selectedCityMunicipality) {
      setError('City/Municipality is required.');
      return false;
    }
    if (!barangayId) {
      setError('Barangay is required.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!streetName.trim()) {
      setError('Street name is required.');
      return false;
    }
    if (!contactNumber.trim()) {
      setError('Contact number is required.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!barangayIdFile) {
      setError('Barangay ID upload is required.');
      return false;
    }
    if (!barangayCertificateFile) {
      setError('Barangay Certificate upload is required.');
      return false;
    }
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'certificate') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG) or PDF file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    if (type === 'id') {
      setBarangayIdFile(file);
    } else {
      setBarangayCertificateFile(file);
    }
    setError(null);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    if (!validateStep3()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Upload files to Firebase Storage
      const barangayIdUrl = await uploadFile(
        barangayIdFile!,
        `user-documents/${currentUser.uid}/barangay-id-${Date.now()}`
      );

      const barangayCertificateUrl = await uploadFile(
        barangayCertificateFile!,
        `user-documents/${currentUser.uid}/barangay-certificate-${Date.now()}`
      );

      // Update user document with full registration data
      await updateDoc(doc(db, 'users', currentUser.uid), {
        // Address and contact info
        selectedRegion,
        selectedProvince,
        selectedCityMunicipality,
        barangayId,
        zipCode,
        lotBlkHouseNo,
        streetName,
        subdivisionVillageZonePurok,
        contactNumber,

        // Documents
        barangayIdUrl,
        barangayCertificateUrl,

        // Update verification status
        verificationStatus: 'pending',
        fullRegistrationSubmittedAt: new Date(),
      });

      logEvent('info', 'Full registration submitted', {
        userId: currentUser.uid,
        userEmail: currentUser.email || undefined,
        userRole: userRole || undefined,
      });

      setSuccessMessage('Full registration submitted successfully! Your account is now pending admin verification.');

      // Call the Cloud Function using the new consolidated function URL
      const idToken = await currentUser.getIdToken();
      const response = await fetch('https://api-gy7oflie2a-uc.a.run.app/submitFullRegistrationV2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          registrationDetails: {
            selectedRegion,
            selectedProvince,
            selectedCityMunicipality,
            barangayId,
            zipCode,
            lotBlkHouseNo,
            streetName,
            subdivisionVillageZonePurok,
            contactNumber,
            barangayIdUrl,
            barangayCertificateUrl,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit registration');
      }

      const result = await response.json();

      console.log('Full registration submitted:', result.data);

      setTimeout(() => {
        onDidDismiss();
        // Reset form
        setCurrentStep(1);
        setSelectedRegion('');
        setSelectedProvince('');
        setSelectedCityMunicipality('');
        setBarangayId('');
        setZipCode('');
        setLotBlkHouseNo('');
        setStreetName('');
        setSubdivisionVillageZonePurok('');
        setContactNumber('');
        setBarangayIdFile(null);
        setBarangayCertificateFile(null);
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting full registration:', error);
      setError(error.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setError(null);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      setError(null);
    }
  };

  const prevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setError(null);
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setError(null);
    }
  };

  const progress = currentStep / 3;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Complete Your Registration</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonProgressBar value={progress} />
      </IonHeader>

      <IonContent className="ion-padding">
        {currentStep === 1 && (
          <IonCard>
            <IonCardContent>
              <IonCardTitle className="ion-padding-vertical">
                Step 1: Select your Location
              </IonCardTitle>

              <IonItem>
                <IonLabel position="stacked">Region *</IonLabel>
                <IonSelect
                  fill="outline"
                  value={selectedRegion}
                  placeholder="Select Region"
                  onIonChange={(e) => setSelectedRegion(e.detail.value)}
                  interface="alert"
                >
                  {regions.map((region) => (
                    <IonSelectOption key={region.code} value={region.code}>
                      {region.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Province *</IonLabel>
                <IonSelect
                  fill="outline"
                  value={selectedProvince}
                  placeholder="Select Province"
                  onIonChange={(e) => setSelectedProvince(e.detail.value)}
                  disabled={!selectedRegion}
                  interface="alert"
                >
                  {provinces.map((province) => (
                    <IonSelectOption key={province.code} value={province.code}>
                      {province.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">City/Municipality *</IonLabel>
                <IonSelect
                  fill="outline"
                  value={selectedCityMunicipality}
                  placeholder="Select City/Municipality"
                  onIonChange={(e) => setSelectedCityMunicipality(e.detail.value)}
                  disabled={!selectedProvince}
                  interface="alert"
                >
                  {citiesMunicipalities.map((cityMun) => (
                    <IonSelectOption key={cityMun.code} value={cityMun.code}>
                      {cityMun.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Barangay *</IonLabel>
                <IonSelect
                  fill="outline"
                  value={barangayId}
                  placeholder={isLoadingBarangays ? "Loading Barangays..." : "Select Barangay"}
                  onIonChange={(e) => handleBarangayChange(e.detail.value)}
                  disabled={!selectedCityMunicipality || isLoadingBarangays}
                  interface="alert"
                >
                  {barangays.map((brgy) => (
                    <IonSelectOption key={brgy.code} value={brgy.code}>
                      {brgy.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonInput
                fill="outline"
                label="Zip Code"
                labelPlacement="floating"
                value={zipCode}
                readonly
                className="ion-margin-bottom"
              />

              <IonButton
                expand="block"
                shape="round"
                onClick={nextStep}
                className="ion-margin-top"
              >
                <IonIcon slot="end" icon={arrowForward} />
                Next
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 2 && (
          <IonCard>
            <IonCardContent>
              <IonCardTitle className="ion-padding-vertical">
                Step 2: Specific Address Details and Contact Information
              </IonCardTitle>

              <IonInput
                fill="outline"
                label="Lot/Blk/House No. (optional)"
                labelPlacement="floating"
                value={lotBlkHouseNo}
                onIonChange={(e) => setLotBlkHouseNo(e.detail.value!)}
                placeholder="Blk 12, Lot 7"
                className="ion-margin-bottom"
              />

              <IonInput
                fill="outline"
                label="Street Name *"
                labelPlacement="floating"
                value={streetName}
                onIonChange={(e) => setStreetName(e.detail.value!)}
                placeholder="Mabini Street"
                className="ion-margin-bottom"
              />

              <IonInput
                fill="outline"
                label="Subdivision/Village/Zone/Purok (optional)"
                labelPlacement="floating"
                value={subdivisionVillageZonePurok}
                onIonChange={(e) => setSubdivisionVillageZonePurok(e.detail.value!)}
                placeholder="Purok 3"
                className="ion-margin-bottom"
              />

              <IonInput
                fill="outline"
                label="Contact Number *"
                labelPlacement="floating"
                value={contactNumber}
                onIonChange={(e) => setContactNumber(e.detail.value!)}
                placeholder="+(63) 123-456-7890"
                className="ion-margin-bottom"
              />

              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      shape="round"
                      fill="outline"
                      onClick={prevStep}
                    >
                      <IonIcon slot="start" icon={arrowBack} />
                      Back
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      shape="round"
                      onClick={nextStep}
                    >
                      <IonIcon slot="end" icon={arrowForward} />
                      Next
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 3 && (
          <IonCard>
            <IonCardContent>
              <IonCardTitle className="ion-padding-vertical">
                Step 3: Document Upload
              </IonCardTitle>

              <IonCardSubtitle className="ion-margin-top">
                Upload Required Documents
              </IonCardSubtitle>

              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'id')}
                      style={{ display: 'none' }}
                      id="barangay-id-upload"
                    />
                    <IonButton
                      expand="block"
                      shape="round"
                      color={barangayIdFile ? 'success' : 'primary'}
                      onClick={() => document.getElementById('barangay-id-upload')?.click()}
                      className="ion-margin-vertical"
                    >
                      <IonIcon slot="start" icon={barangayIdFile ? checkmarkCircle : cloudUpload} />
                      {barangayIdFile ? 'Barangay ID Uploaded' : 'Upload Barangay ID'}
                    </IonButton>
                    {barangayIdFile && (
                      <IonText color="success">
                        <small>{barangayIdFile.name}</small>
                      </IonText>
                    )}
                  </IonCol>

                  <IonCol size="12" sizeMd="6">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'certificate')}
                      style={{ display: 'none' }}
                      id="barangay-certificate-upload"
                    />
                    <IonButton
                      expand="block"
                      shape="round"
                      color={barangayCertificateFile ? 'success' : 'primary'}
                      onClick={() => document.getElementById('barangay-certificate-upload')?.click()}
                      className="ion-margin-vertical"
                    >
                      <IonIcon slot="start" icon={barangayCertificateFile ? checkmarkCircle : cloudUpload} />
                      {barangayCertificateFile ? 'Certificate Uploaded' : 'Upload Barangay Certificate'}
                    </IonButton>
                    {barangayCertificateFile && (
                      <IonText color="success">
                        <small>{barangayCertificateFile.name}</small>
                      </IonText>
                    )}
                  </IonCol>
                </IonRow>
              </IonGrid>

              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      shape="round"
                      fill="outline"
                      onClick={prevStep}
                    >
                      <IonIcon slot="start" icon={arrowBack} />
                      Back
                    </IonButton>
                  </IonCol>
                  <IonCol size="6">
                    <IonButton
                      expand="block"
                      shape="round"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Submitting...' : 'Submit Registration'}
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        <IonLoading isOpen={isLoading} message="Submitting registration..." />
        <IonToast isOpen={!!error} message={error || ''} duration={3000} color="danger" />
        <IonToast isOpen={!!successMessage} message={successMessage || ''} duration={5000} color="success" />
      </IonContent>
    </IonModal>
  );
};

export default FullRegistrationModal;
