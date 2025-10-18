import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
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
  IonCardHeader,
  IonItem,
  IonItemDivider,
  IonAlert,
} from '@ionic/react';

import { close, arrowBack, arrowForward, cloudUpload, checkmarkCircle, paperPlane, call, home, logOutOutline, logOut } from 'ionicons/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useIonRouter } from '@ionic/react';

import { logEvent } from '../../../utils/logger';
import { getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality, getZipCodeByBarangay, Region, Province, CityMunicipality, Barangay } from '../../../services/addressService';

interface CompleteProfileProps {}

const CompleteProfile: React.FC<CompleteProfileProps> = () => {
  const { currentUser, logout } = useAuth();
  const history = useIonRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

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
  const [idType, setIdType] = useState<string>('');
  const [idFile, setIdFile] = useState<File | null>(null);

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

    loadRegions();
    if (currentUser) {
      loadExistingData();
    }
  }, [currentUser]);

  useEffect(() => {
    const loadProvinces = async () => {
      if (selectedRegion) {
        try {
          const provincesData = await getProvincesByRegion(selectedRegion);
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
        const phone = data.contactNumber || '';
        setContactNumber(phone.startsWith('+63') ? phone.slice(3) : phone);
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
    if (contactNumber.length !== 10) {
      setError('Contact number must be 10 digits.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!idType) {
      setError('Please select an ID type.');
      return false;
    }
    if (!idFile) {
      setError('Please upload your selected ID.');
      return false;
    }
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIdFile(file);
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
      // Prepend +63 to the contact number before submitting
      const unmaskedContactNumber = `+63${contactNumber}`;

      // Construct full address
      const barangayName = barangays.find(b => b.code === barangayId)?.name || '';
      const cityName = citiesMunicipalities.find(c => c.code === selectedCityMunicipality)?.name || '';
      const provinceName = provinces.find(p => p.code === selectedProvince)?.name || '';
      const addressParts = [];
      if (lotBlkHouseNo.trim()) addressParts.push(lotBlkHouseNo.trim());
      if (streetName.trim()) addressParts.push(streetName.trim());
      if (subdivisionVillageZonePurok.trim()) addressParts.push(subdivisionVillageZonePurok.trim());
      if (barangayName) addressParts.push(barangayName);
      if (cityName) addressParts.push(cityName);
      if (provinceName) addressParts.push(provinceName);
      if (zipCode.trim()) addressParts.push(zipCode.trim());
      const fullAddress = addressParts.join(', ');

      console.log('Current User UID:', currentUser.uid);
      const storagePath = `user-documents/${currentUser.uid}/${idType}-${Date.now()}`;
      console.log('Storage Path for upload:', storagePath);

      // Upload file to Firebase Storage
      const idVerificationUrl = await uploadFile(
        idFile!,
        storagePath
      );

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        selectedRegion,
        selectedProvince,
        selectedCityMunicipality,
        barangayId,
        zipCode,
        lotBlkHouseNo,
        streetName,
        subdivisionVillageZonePurok,
        contactNumber: unmaskedContactNumber,
        address: fullAddress,
        idVerificationUrl,
        idVerificationType: idType,
        verificationStatus: 'pending_approval',
      });

      logEvent('info', 'Full profile submitted for verification', {
        userId: currentUser.uid,
      });

      setSuccessMessage('Profile submitted for verification! Please wait for admin approval.');
      history.push('/user/pending-verification');

    } catch (error: any) {
      console.error('Error submitting full profile:', error);
      setError(error.message || 'Failed to submit profile. Please try again.');
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

  const handleLogout = async () => {
    await logout();
  };

  const progress = currentStep / 3;

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Complete Your Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowAlert(true)}>
              <IonIcon slot='icon-only' icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonProgressBar value={progress} />
      </IonHeader>

      <IonContent className="ion-padding">
        {currentStep === 1 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonItem >
                  Step 1: Select your Location
                </IonItem>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              
              <IonItem>
                <IonSelect
                label='Region *'
                fill="outline"
                value={selectedRegion}
                placeholder="Select Region"
                onIonChange={(e) => setSelectedRegion(e.detail.value)}
                interface="alert"
                className='ion-margin-bottom'
              >
                {regions.map((region) => (
                  <IonSelectOption key={region.code} value={region.code}>
                    {region.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
              </IonItem>

              <IonItem>
                <IonSelect
                  label='Province *'
                  className='ion-margin-bottom'
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
                <IonSelect
                label='City/Municipality *'
                className='ion-margin-bottom'
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
                <IonSelect
                label='Barangay *'
                className='ion-margin-bottom'
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

              <IonItem>
                <IonInput
                fill="outline"
                label="Zip Code"
                readonly
                className="ion-margin-bottom"
              >
              <IonText slot='end'>{zipCode}</IonText>
              </IonInput>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 2 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonItem>
                  Step 2: Enter your Address & Contact Number
                </IonItem>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItemDivider>Lot/Blk/House No. (optional)</IonItemDivider>
              <IonItem>
              
              <IonInput
                fill="outline"
                value={lotBlkHouseNo}
                onIonChange={(e) => setLotBlkHouseNo(e.detail.value!)}
                placeholder="Blk 12, Lot 7"
                className="ion-margin-bottom"
              >
                <IonIcon slot="start" icon={home}></IonIcon>
              </IonInput>
              </IonItem>
              
              <IonItemDivider>Street Name *</IonItemDivider>
              <IonItem>
                <IonInput
                fill="outline"
                value={streetName}
                onIonChange={(e) => setStreetName(e.detail.value!)}
                placeholder="Mabini Street"
                className="ion-margin-bottom"
              > <IonIcon slot="start" icon={home} /> </IonInput>
              </IonItem>

              <IonItemDivider>Subdivision/Village/Zone/Purok (optional)</IonItemDivider>
              <IonItem>
                <IonInput
                fill="outline"
                value={subdivisionVillageZonePurok}
                onIonChange={(e) => setSubdivisionVillageZonePurok(e.detail.value!)}
                placeholder="Purok 3"
                className="ion-margin-bottom"
              >
                <IonIcon slot="start" icon={home}></IonIcon>
                </IonInput>
              </IonItem>
              
              <IonItemDivider>Contact Number *</IonItemDivider>
              <IonItem>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '0 10px', fontWeight: 'bold', fontSize: '1.2em' }}>+63</div>
                  <IonInput
                    fill="outline"
                    value={contactNumber}
                    onIonInput={(e) => {
                      let val = e.detail.value || '';
                      // Ensure the first digit is 9 and only digits allowed
                      if (val.length === 1 && val !== '9') {
                        val = '';
                      }
                      val = val.replace(/[^0-9]/g, '');
                      setContactNumber(val);
                    }}
                    placeholder="9XX XXX XXXX"
                    maxlength={10}
                    minlength={10}
                    inputmode="numeric"
                    pattern="[9][0-9]{9}"
                    className={`${(!contactNumber || contactNumber.length !== 10) && 'ion-invalid ion-touched'}`}
                    autocomplete="tel"
                  >
                    <IonIcon slot="start" icon={call}></IonIcon>
                  </IonInput>
                </div>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {currentStep === 3 && (
          <IonCard>
            <IonCardContent>
              <IonCardTitle>
                <IonItem className='ion-margin-bottom'>
                  Step 3: Upload Document for Verification
                </IonItem>
              </IonCardTitle>

              <IonItem  className='ion-margin-bottom'>
                Upload one of the following IDs for address verification. After verification, your uploaded document will be deleted.
              </IonItem>

              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonSelect
                        label="ID Type *"
                        fill="outline"
                        value={idType}
                        placeholder="Select ID Type"
                        onIonChange={(e) => setIdType(e.detail.value)}
                        interface="alert"
                        className="ion-margin-bottom"
                      >
                        <IonSelectOption value="National ID">National ID</IonSelectOption>
                        <IonSelectOption value="Barangay ID">Barangay ID</IonSelectOption>
                        <IonSelectOption value="PhilHealth ID">PhilHealth ID</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      id="id-upload"
                      disabled={!idType}
                    />
                    <IonButton
                      expand="block"
                      fill={idFile ? 'solid' : 'outline'}
                      color={idFile ? 'success' : 'primary'}
                      onClick={() => document.getElementById('id-upload')?.click()}
                      className="ion-margin-vertical"
                      disabled={!idType}
                    >
                      <IonIcon slot="start" icon={idFile ? checkmarkCircle : cloudUpload} />
                      <IonText className='ion-padding-vertical'>
                        {idFile ? 'ID Uploaded' : `Upload ${idType || 'ID'}`}
                      </IonText>
                    </IonButton>
                    {idFile && (
                      <IonText color="success">
                        Uploaded file: {idFile.name}
                      </IonText>
                    )}
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        <IonLoading isOpen={isLoading} message="Submitting profile..." />
        <IonToast isOpen={!!error} message={error || ''} duration={3000} color="danger" />
        <IonToast isOpen={!!successMessage} message={successMessage || ''} duration={5000} color="success" />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Confirm Logout'}
          message={'Are you sure you want to log out?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
            },
            {
              text: 'Logout',
              handler: handleLogout,
            },
          ]}
        />
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
              <IonText className='ion-padding-vertical'>Next</IonText>
            </IonButton>
          )}

          {currentStep === 2 && (
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
                  <IonButton
                    expand="block"
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
                    <IonText className='ion-padding-vertical'>Back</IonText>
                  </IonButton>
                </IonCol>
                <IonCol size="9">
                  <IonButton
                  color={'success'}
                    expand="block"
                    shape="round"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    <IonText className='ion-padding-vertical'>Submit</IonText>
                    <IonIcon slot="end" icon={paperPlane} />
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

export default CompleteProfile;