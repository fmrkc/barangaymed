import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonBackButton,
  IonButtons,
  IonSpinner,
  IonText,
  IonTextarea,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserService } from '../../../services/userService';
import { getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality, getZipCodeByBarangay, Region, Province, CityMunicipality, Barangay } from '../../../services/addressService';

interface TelePage2Props {
  onNext: (data: any) => void;
  onBack: () => void;
}

const TelePage2: React.FC<TelePage2Props> = ({ onNext, onBack }) => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    selectedRegion: '',
    selectedProvince: '',
    selectedCityMunicipality: '',
    barangayId: '',
    zipCode: '',
    lotBlkHouseNo: '',
    streetName: '',
    subdivisionVillageZonePurok: '',
    notes: '',
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  useEffect(() => {
    const loadRegions = async () => {
      setRegions(await getRegions());
    };
    loadRegions();
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userService = UserService.getInstance();
        const userData = await userService.getUserData(currentUser.uid);
        
        // Construct full name from individual components
        const fullName = [userData.firstName, userData.middleName, userData.lastName, userData.suffix]
          .filter(Boolean)
          .join(' ');
        
        setFormData({
          fullName: fullName,
          email: userData.email,
          phone: userData.contactNumber,
          selectedRegion: userData.selectedRegion || '',
          selectedProvince: userData.selectedProvince || '',
          selectedCityMunicipality: userData.selectedCityMunicipality || '',
          barangayId: userData.barangayId || '',
          zipCode: userData.zipCode || '',
          lotBlkHouseNo: userData.lotBlkHouseNo || '',
          streetName: userData.streetName || '',
          subdivisionVillageZonePurok: userData.subdivisionVillageZonePurok || '',
          notes: '', // Initialize notes field
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your information. Please fill in the form manually.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const loadProvinces = async () => {
      if (formData.selectedRegion) {
        setProvinces(await getProvincesByRegion(formData.selectedRegion));
        setFormData(prev => ({ ...prev, selectedProvince: '', selectedCityMunicipality: '', barangayId: '', zipCode: '' }));
      } else {
        setProvinces([]);
        setFormData(prev => ({ ...prev, selectedProvince: '', selectedCityMunicipality: '', barangayId: '', zipCode: '' }));
      }
    };
    loadProvinces();
  }, [formData.selectedRegion]);

  useEffect(() => {
    const loadCitiesMunicipalities = async () => {
      if (formData.selectedProvince) {
        setCitiesMunicipalities(await getCitiesMunicipalitiesByProvince(formData.selectedProvince));
        setFormData(prev => ({ ...prev, selectedCityMunicipality: '', barangayId: '', zipCode: '' }));
      } else {
        setCitiesMunicipalities([]);
        setFormData(prev => ({ ...prev, selectedCityMunicipality: '', barangayId: '', zipCode: '' }));
      }
    };
    loadCitiesMunicipalities();
  }, [formData.selectedProvince]);

  useEffect(() => {
    const loadBarangays = async () => {
      if (formData.selectedCityMunicipality) {
        setBarangays(await getBarangaysByCityMunicipality(formData.selectedCityMunicipality));
        setFormData(prev => ({ ...prev, barangayId: '', zipCode: '' }));
      } else {
        setBarangays([]);
        setFormData(prev => ({ ...prev, barangayId: '', zipCode: '' }));
      }
    };
    loadBarangays();
  }, [formData.selectedCityMunicipality]);

  const handleBarangayChange = async (brgyCode: string) => {
    const zip = await getZipCodeByBarangay(brgyCode) || '';
    setFormData(prev => ({ ...prev, barangayId: brgyCode, zipCode: zip }));
  };

  const handleNext = () => {
    if (!formData.fullName || !formData.email || !formData.phone || 
        !formData.selectedRegion || !formData.selectedProvince || !formData.selectedCityMunicipality || 
        !formData.barangayId || !formData.zipCode || !formData.streetName) {
      alert('Please fill in all required fields');
      return;
    }
    onNext(formData);
    history.push('/user/teleconsultation/step3');
  };

  const handleBack = () => {
    onBack();
    history.push('/user/teleconsultation/step1');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user/teleconsultation/step1" />
          </IonButtons>
          <IonTitle>Book Teleconsultation - Step 2</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" size-md="8" offset-md="2">
              <IonCard>
                <IonCardContent>
                  <h2>Personal Information</h2>
                  
                  {loading ? (
                    <div className="ion-text-center ion-padding">
                      <IonSpinner />
                      <p>Loading your information...</p>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <IonText color="warning" className="ion-padding">
                          <p>{error}</p>
                        </IonText>
                      )}
                      
                      <IonItem>
                        <IonLabel position="stacked">Full Name *</IonLabel>
                        <IonInput
                          value={formData.fullName}
                          onIonChange={(e) => setFormData({ ...formData, fullName: e.detail.value! })}
                          placeholder="Enter your full name"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Email Address *</IonLabel>
                        <IonInput
                          type="email"
                          value={formData.email}
                          onIonChange={(e) => setFormData({ ...formData, email: e.detail.value! })}
                          placeholder="Enter your email address"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Phone Number *</IonLabel>
                        <IonInput
                          type="tel"
                          value={formData.phone}
                          onIonChange={(e) => setFormData({ ...formData, phone: e.detail.value! })}
                          placeholder="Enter your phone number"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Region *</IonLabel>
                        <IonSelect
                          value={formData.selectedRegion}
                          placeholder="Select Region"
                          onIonChange={(e) => setFormData({ ...formData, selectedRegion: e.detail.value! })}
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
                          value={formData.selectedProvince}
                          placeholder="Select Province"
                          onIonChange={(e) => setFormData({ ...formData, selectedProvince: e.detail.value! })}
                          disabled={!formData.selectedRegion}
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
                          value={formData.selectedCityMunicipality}
                          placeholder="Select City/Municipality"
                          onIonChange={(e) => setFormData({ ...formData, selectedCityMunicipality: e.detail.value! })}
                          disabled={!formData.selectedProvince}
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
                          value={formData.barangayId}
                          placeholder="Select Barangay"
                          onIonChange={(e) => handleBarangayChange(e.detail.value!)}
                          disabled={!formData.selectedCityMunicipality}
                        >
                          {barangays.map((brgy) => (
                            <IonSelectOption key={brgy.code} value={brgy.code}>
                              {brgy.name}
                            </IonSelectOption>
                          ))}
                        </IonSelect>
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Zip Code *</IonLabel>
                        <IonInput
                          value={formData.zipCode}
                          readonly
                          placeholder="Zip Code"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Lot/Blk/House No. (optional)</IonLabel>
                        <IonInput
                          value={formData.lotBlkHouseNo}
                          onIonChange={(e) => setFormData({ ...formData, lotBlkHouseNo: e.detail.value! })}                          placeholder="Blk 12, Lot 7"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Street Name *</IonLabel>
                        <IonInput
                          value={formData.streetName}
                          onIonChange={(e) => setFormData({ ...formData, streetName: e.detail.value! })}                          placeholder="Mabini Street"
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Subdivision/Village/Zone/Purok (optional)</IonLabel>
                        <IonInput
                          value={formData.subdivisionVillageZonePurok}
                          onIonChange={(e) => setFormData({ ...formData, subdivisionVillageZonePurok: e.detail.value! })}                          placeholder="Purok 3"
                        />
                      </IonItem>
                    </>
                  )}

                  <IonItem>
                    <IonLabel position="stacked">Additional Notes (Optional)</IonLabel>
                    <IonTextarea
                      rows={3}
                      value={formData.notes}
                      onIonChange={(e) => setFormData({ ...formData, notes: e.detail.value! })}                      placeholder="Any additional information you'd like to share"
                    />
                  </IonItem>

                  <div className="ion-margin-top">
                    <IonButton expand="block" onClick={handleBack} fill="outline" className="ion-margin-bottom">
                      Back
                    </IonButton>
                    <IonButton 
                      expand="block" 
                      onClick={handleNext}
                      disabled={!formData.fullName || !formData.email || !formData.phone || 
                                !formData.selectedRegion || !formData.selectedProvince || !formData.selectedCityMunicipality || 
                                !formData.barangayId || !formData.zipCode || !formData.streetName}
                    >
                      Next
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default TelePage2;
