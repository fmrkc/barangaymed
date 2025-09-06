import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonToast, IonItem, IonLabel, IonText } from '@ionic/react';
import { checkmarkDoneOutline } from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality, Region, Province, CityMunicipality, Barangay } from '../../services/addressService';

const SuperAdminRegister: React.FC = () => {
    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();

    const [fullName, setFullName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [barangayId, setBarangay] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCityMunicipality, setSelectedCityMunicipality] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipality[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);

    useEffect(() => {
        const loadRegions = async () => {
            setRegions(await getRegions());
        };
        loadRegions();
    }, []);

    useEffect(() => {
        const loadProvinces = async () => {
            if (selectedRegion) {
                setProvinces(await getProvincesByRegion(selectedRegion));
                setSelectedProvince('');
                setSelectedCityMunicipality('');
                setBarangay('');
            } else {
                setProvinces([]);
                setSelectedProvince('');
                setSelectedCityMunicipality('');
                setBarangay('');
            }
        };
        loadProvinces();
    }, [selectedRegion]);

    useEffect(() => {
        const loadCitiesMunicipalities = async () => {
            if (selectedProvince) {
                setCitiesMunicipalities(await getCitiesMunicipalitiesByProvince(selectedProvince));
                setSelectedCityMunicipality('');
                setBarangay('');
            } else {
                setCitiesMunicipalities([]);
                setSelectedCityMunicipality('');
                setBarangay('');
            }
        };
        loadCitiesMunicipalities();
    }, [selectedProvince]);

    useEffect(() => {
        const loadBarangays = async () => {
            if (selectedCityMunicipality) {
                setBarangays(await getBarangaysByCityMunicipality(selectedCityMunicipality));
                setBarangay('');
            } else {
                setBarangays([]);
                setBarangay('');
            }
        };
        loadBarangays();
    }, [selectedCityMunicipality]);

    const handleProvisionAdmin = async (event: any) => {
        event.preventDefault();
        setError(null);

        if (!fullName || !contactEmail || !selectedRegion || !selectedProvince || !selectedCityMunicipality || !barangayId) {
            setError('All fields are required.');
            return;
        }

        await present('Creating Admin Account...');
        try {
            const provisionUserFunction = httpsCallable(functions, 'provisionUser');
            await provisionUserFunction({
                fullName,
                contactEmail,
                role: 'admin',
                barangayId: barangayId,
                region: selectedRegion,
                province: selectedProvince,
                cityMunicipality: selectedCityMunicipality,
            });
            
            dismiss();
            setShowToast(true);
            // Clear form
            setFullName('');
            setContactEmail('');
            setBarangay('');
            setSelectedRegion('');
            setSelectedProvince('');
            setSelectedCityMunicipality('');

        } catch (err: any) {
            dismiss();
            setError(err.message || 'Registration failed. Please try again.');
        }
    }

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonBackButton defaultHref='/superadmin/dashboard/admin-management' />
                    </IonButtons>
                    <IonTitle>Create Admin Account</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent scrollY={false}>
                <IonGrid fixed>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                            <IonCard>
                                <IonCardContent>
                                <form onSubmit={handleProvisionAdmin}>
                                    <IonItem>
                                        <IonLabel position="stacked">Full Name</IonLabel>
                                        <IonInput
                                            type="text"
                                            value={fullName}
                                            onIonChange={e => setFullName(e.detail.value!)}
                                            placeholder="Juan Dela Cruz"
                                        />
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel position="stacked">Contact Email</IonLabel>
                                        <IonInput
                                            type="email"
                                            value={contactEmail}
                                            onIonChange={e => setContactEmail(e.detail.value!)}
                                            placeholder="(Credentials will be sent here)"
                                        />
                                    </IonItem>

                                    <IonItem>
                                        <IonLabel>Region</IonLabel>
                                        <IonSelect
                                            value={selectedRegion}
                                            placeholder="Select Region"
                                            onIonChange={e => setSelectedRegion(e.detail.value)}
                                        >
                                            {regions.map((region) => (
                                                <IonSelectOption key={region.code} value={region.code}>
                                                    {region.name}
                                                </IonSelectOption>
                                            ))}
                                        </IonSelect>
                                    </IonItem>

                                    <IonItem>
                                        <IonLabel>Province</IonLabel>
                                        <IonSelect
                                            value={selectedProvince}
                                            placeholder="Select Province"
                                            onIonChange={e => setSelectedProvince(e.detail.value)}
                                            disabled={!selectedRegion}
                                        >
                                            {provinces.map((province) => (
                                                <IonSelectOption key={province.code} value={province.code}>
                                                    {province.name}
                                                </IonSelectOption>
                                            ))}
                                        </IonSelect>
                                    </IonItem>

                                    <IonItem>
                                        <IonLabel>City/Municipality</IonLabel>
                                        <IonSelect
                                            value={selectedCityMunicipality}
                                            placeholder="Select City/Municipality"
                                            onIonChange={e => setSelectedCityMunicipality(e.detail.value)}
                                            disabled={!selectedProvince}
                                        >
                                            {citiesMunicipalities.map((cityMun) => (
                                                <IonSelectOption key={cityMun.code} value={cityMun.code}>
                                                    {cityMun.name}
                                                </IonSelectOption>
                                            ))}
                                        </IonSelect>
                                    </IonItem>

                                    <IonItem>
                                      <IonLabel>Barangay</IonLabel>
                                      <IonSelect
                                          value={barangayId}
                                          placeholder="Select Barangay"
                                          onIonChange={e => setBarangay(e.detail.value)}
                                          disabled={!selectedCityMunicipality}
                                      >
                                          {barangays.map((brgy) => (
                                              <IonSelectOption key={brgy.code} value={brgy.code}>
                                                  {brgy.name}
                                              </IonSelectOption>
                                          ))}
                                      </IonSelect>
                                    </IonItem>
                                    
                                    {error && <IonText color="danger"><p className="ion-padding-start">{error}</p></IonText>}

                                    <IonButton type='submit' className="ion-margin-top" expand='block'>
                                        Create and Send Credentials
                                        <IonIcon icon={checkmarkDoneOutline} slot="end" />
                                    </IonButton>
                                </form>
                                <IonToast
                                    isOpen={showToast}
                                    onDidDismiss={() => setShowToast(false)}
                                    message="Admin account created successfully. Credentials have been sent."
                                    duration={2500}
                                    color="success"
                                />
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>

        </IonPage>
    );
};

export default SuperAdminRegister;