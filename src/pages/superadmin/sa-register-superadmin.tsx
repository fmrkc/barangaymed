import {
    IonBackButton, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonInput, IonPage, IonRow, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonItem, IonLabel, IonText, IonSelect, IonSelectOption,
    IonProgressBar,
    IonToast,
    IonCardSubtitle,
    IonItemDivider,
    IonIcon,
    IonFooter
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { arrowForward, person, arrowBack, checkmarkDoneOutline } from 'ionicons/icons';

import { useAuth } from '../../contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, Region, Province, CityMunicipality } from '../../services/addressService';

const SuperAdminRegister: React.FC = () => {
    const { currentUser } = useAuth();

    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();

    const [currentStep, setCurrentStep] = useState(1);
    const progress = currentStep / 4;

    // State for the new super admin provisioning form
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [suffix, setSuffix] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [gender, setGender] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);


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
        if (!birthdate || !gender) {
            setError('Birthdate and gender are required.');
            setShowErrorToast(true);
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep3 = () => {
        if (!selectedRegion || !selectedProvince || !selectedCityMunicipality) {
            setError('Region, province, and city/municipality are required.');
            setShowErrorToast(true);
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep4 = () => {
        if (!contactEmail.trim()) {
            setError('Contact email is required.');
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

    const handleProvisionSuperAdmin = async () => {
        if (!validateStep4()) return;

        await present('Creating Super Admin...');

        const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ');

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
                setSuccessMessage(data.message);
                setShowSuccessToast(true);
                // Clear form
                setFirstName('');
                setMiddleName('');
                setLastName('');
                setSuffix('');
                setBirthdate('');
                setGender('');
                setContactEmail('');
                setSelectedRegion('');
                setSelectedProvince('');
                setSelectedCityMunicipality('');
                setCurrentStep(1);
            } else {
                setError(data.message);
                setShowErrorToast(true);
            }
        } catch (error: any) {
            console.error('Error provisioning user:', error);
            setError(error.message || 'Failed to create user.');
            setShowErrorToast(true);
        } finally {
            dismiss();
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot='start'>
                        <IonBackButton defaultHref='/superadmin/dashboard' />
                    </IonButtons>
                    <IonTitle>Create Super Admin</IonTitle>
                </IonToolbar>
                <IonProgressBar value={progress}></IonProgressBar>
            </IonHeader>

            <IonContent>
                <IonToast
                    isOpen={showErrorToast}
                    onDidDismiss={() => setShowErrorToast(false)}
                    message={error || ''}
                    duration={3000}
                    color="danger"
                />
                <IonToast
                    isOpen={showSuccessToast}
                    onDidDismiss={() => setShowSuccessToast(false)}
                    message={successMessage || ''}
                    duration={3000}
                    color="success"
                />
                <IonGrid fixed>
                    <IonRow className='ion-justify-content-center'>
                        <IonCol size='12' sizeMd='8' sizeLg='6' sizeXl='4'>
                            {currentStep === 1 && (
                                <IonCard>
                                    <IonCardHeader>
                                        <IonCardTitle>Step 1: Personal Details</IonCardTitle>
                                        <IonCardSubtitle>Please provide the user's full name.</IonCardSubtitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <IonItemDivider>First Name *</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonInput fill="outline" placeholder="e.g. Juan" value={firstName} onIonChange={(e) => setFirstName(e.detail.value!)} required>
                                                <IonIcon slot="start" icon={person}></IonIcon>
                                            </IonInput>
                                        </IonItem>
                                        <IonItemDivider>Middle Name (Optional)</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonInput fill="outline" placeholder="e.g. Dela" value={middleName} onIonChange={(e) => setMiddleName(e.detail.value!)}>
                                                <IonIcon slot="start" icon={person}></IonIcon>
                                            </IonInput>
                                        </IonItem>
                                        <IonItemDivider>Last Name *</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonInput fill="outline" placeholder="e.g. Cruz" value={lastName} onIonChange={(e) => setLastName(e.detail.value!)} required>
                                                <IonIcon slot="start" icon={person}></IonIcon>
                                            </IonInput>
                                        </IonItem>
                                        <IonItemDivider>Suffix (Optional)</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonInput fill="outline" placeholder="e.g. Jr., Sr." value={suffix} onIonChange={(e) => setSuffix(e.detail.value!)}>
                                                <IonIcon slot="start" icon={person}></IonIcon>
                                            </IonInput>
                                        </IonItem>
                                    </IonCardContent>
                                </IonCard>
                            )}

                            {currentStep === 2 && (
                                <IonCard>
                                    <IonCardHeader>
                                        <IonCardTitle>Step 2: Personal Details</IonCardTitle>
                                        <IonCardSubtitle>Please provide the user's birthdate and gender.</IonCardSubtitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <IonItemDivider>Birthdate *</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonInput fill="outline" type="date" value={birthdate} max={new Date().toISOString().split('T')[0]} onIonChange={(e) => setBirthdate(e.detail.value!)} required/>
                                        </IonItem>
                                        <IonItemDivider>Gender *</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonSelect fill="outline" value={gender} onIonChange={(e) => setGender(e.detail.value!)} placeholder="Select Gender" required>
                                                <IonSelectOption value="Male">Male</IonSelectOption>
                                                <IonSelectOption value="Female">Female</IonSelectOption>
                                            </IonSelect>
                                        </IonItem>
                                    </IonCardContent>
                                </IonCard>
                            )}

                            {currentStep === 3 && (
                                <IonCard>
                                    <IonCardHeader>
                                        <IonCardTitle>Step 3: Assigned Details</IonCardTitle>
                                        <IonCardSubtitle>Please provide the user's assigned location and contact email.</IonCardSubtitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <IonItemDivider>Region *</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonSelect
                                                fill="outline"
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

                                        <IonItemDivider>Province *</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonSelect
                                                fill="outline"
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

                                        <IonItemDivider>City/Municipality *</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonSelect
                                                fill="outline"
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

                                        <IonItemDivider>Contact Email *</IonItemDivider>
                                        <IonItem>
                                            <IonInput
                                                fill="outline"
                                                type="email"
                                                value={contactEmail}
                                                onIonChange={(e) => setContactEmail(e.detail.value!)}
                                                placeholder="juan@example.com"
                                                helperText=" Please make sure that this email address is correct and is a working email address. This email will be used to send a separate email containing a new email address and password. "
                                            />
                                        </IonItem>
                                    </IonCardContent>
                                </IonCard>
                            )}

                            {currentStep === 4 && (
                                <IonCard>
                                    <IonCardHeader>
                                        <IonCardTitle>Step 4: Summary</IonCardTitle>
                                        <IonCardSubtitle>Please make sure that the entered information is correct.</IonCardSubtitle>
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
                                        <IonItemDivider>Region</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonText>{regions.find(r => r.code === selectedRegion)?.name || 'N/A'}</IonText>
                                        </IonItem>
                                        <IonItemDivider>Province</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonText>{provinces.find(p => p.code === selectedProvince)?.name || 'N/A'}</IonText>
                                        </IonItem>
                                        <IonItemDivider>City/Municipality</IonItemDivider>
                                        <IonItem className="ion-margin-vertical" lines="none">
                                            <IonText>{citiesMunicipalities.find(c => c.code === selectedCityMunicipality)?.name || 'N/A'}</IonText>
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
                        <IonButton expand="block" shape="round" onClick={nextStep} className="ion-margin">
                            <IonIcon slot="end" icon={arrowForward} />
                            <IonText className='ion-padding-vertical'>Next</IonText>
                        </IonButton>
                    )}

                    {currentStep === 2 && (
                        <IonGrid>
                            <IonRow>
                                <IonCol size="3">
                                    <IonButton expand="block" shape="round" fill="outline" onClick={prevStep}>
                                        <IonIcon slot="start" icon={arrowBack} />
                                        <IonText className='ion-padding-vertical'>Back</IonText>
                                    </IonButton>
                                </IonCol>
                                <IonCol size="9">
                                    <IonButton expand="block" shape="round" onClick={nextStep}>
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
                                    <IonButton expand="block" shape="round" fill="outline" onClick={prevStep}>
                                        <IonIcon slot="start" icon={arrowBack} />
                                        <IonText className='ion-padding-vertical'>Back</IonText>
                                    </IonButton>
                                </IonCol>
                                <IonCol size="9">
                                    <IonButton expand="block" shape="round" onClick={nextStep}>
                                        <IonIcon slot="end" icon={arrowForward} />
                                        <IonText className='ion-padding-vertical'>Next</IonText>
                                    </IonButton>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    )}

                    {currentStep === 4 && (
                        <IonGrid>
                            <IonRow>
                                <IonCol size="3">
                                    <IonButton expand="block" shape="round" fill="outline" onClick={prevStep}>
                                        <IonIcon slot="start" icon={arrowBack} />
                                        <IonText className='ion-padding-vertical'>Back</IonText>
                                    </IonButton>
                                </IonCol>
                                <IonCol size="9">
                                    <IonButton color={'success'} expand="block" shape="round" onClick={handleProvisionSuperAdmin}>
                                        <IonText className='ion-padding-vertical'>Create and Send Credentials</IonText>
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

export default SuperAdminRegister;