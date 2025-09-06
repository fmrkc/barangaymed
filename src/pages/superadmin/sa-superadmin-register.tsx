import { IonBackButton, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonPage, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonItem, IonLabel, IonText, IonSelect, IonSelectOption } from '@ionic/react';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, Region, Province, CityMunicipality } from '../../services/addressService';

const SuperAdminRegister: React.FC = () => {
    const { currentUser } = useAuth();

    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();

    // State for the new super admin provisioning form
    const [fullName, setFullName] = React.useState('');
    const [contactEmail, setContactEmail] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCityMunicipality, setSelectedCityMunicipality] = useState('');

    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipality[]>([]);

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
            } else {
                setProvinces([]);
                setSelectedProvince('');
                setSelectedCityMunicipality('');
            }
        };
        loadProvinces();
    }, [selectedRegion]);

    useEffect(() => {
        const loadCitiesMunicipalities = async () => {
            if (selectedProvince) {
                setCitiesMunicipalities(await getCitiesMunicipalitiesByProvince(selectedProvince));
                setSelectedCityMunicipality('');
            } else {
                setCitiesMunicipalities([]);
                setSelectedCityMunicipality('');
            }
        };
        loadCitiesMunicipalities();
    }, [selectedProvince]);

    const handleProvisionSuperAdmin = async () => {
        setError(null);
        setSuccess(null);

        if (!fullName || !contactEmail || !selectedRegion || !selectedProvince || !selectedCityMunicipality) {
            setError('All fields are required.');
            return;
        }

        await present('Creating Super Admin...');

        try {
            const provisionUserFunction = httpsCallable(functions, 'provisionUser');
            const result = await provisionUserFunction({
                fullName,
                contactEmail,
                role: 'superadmin', // Hardcode role to superadmin
                cityMunicipalityId: selectedCityMunicipality, // Add city/municipality for superadmin
            });

            const data = result.data as { success: boolean; message: string };
            if (data.success) {
                setSuccess(data.message);
                // Clear form
                setFullName('');
                setContactEmail('');
                setSelectedRegion('');
                setSelectedProvince('');
                setSelectedCityMunicipality('');
            } else {
                setError(data.message);
            }
        } catch (error: any) {
            console.error('Error provisioning user:', error);
            setError(error.message || 'Failed to create user.');
        } finally {
            dismiss();
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonBackButton defaultHref='/superadmin/dashboard/admin-management' />
                    </IonButtons>
                    <IonTitle>Create Super Admin</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent scrollY={false}>
                <IonGrid fixed>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>Create New Super Admin Account</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonItem>
                                        <IonLabel position="stacked">Full Name</IonLabel>
                                        <IonInput
                                            type="text"
                                            value={fullName}
                                            onIonChange={(e) => setFullName(e.detail.value!)}
                                            placeholder="Juan Dela Cruz"
                                        />
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel position="stacked">Contact Email</IonLabel>
                                        <IonInput
                                            type="email"
                                            value={contactEmail}
                                            onIonChange={(e) => setContactEmail(e.detail.value!)}
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

                                    {error && <IonText color="danger"><p>{error}</p></IonText>}
                                    {success && <IonText color="success"><p>{success}</p></IonText>}

                                    <IonButton expand="block" className="ion-margin-top" onClick={handleProvisionSuperAdmin}>
                                        Create and Send Credentials
                                    </IonButton>
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