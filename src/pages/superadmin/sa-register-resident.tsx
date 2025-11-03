import {
    IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar, useIonRouter, useIonLoading, IonToast, IonItem, IonText,
    IonProgressBar,
    IonCardSubtitle,
    IonItemDivider,
    IonFooter,
    IonCardHeader,
    IonCardTitle, IonModal, IonLabel
} from '@ionic/react';
import { checkmarkDoneOutline, arrowForward, person, arrowBack, close } from 'ionicons/icons';
import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality, getZipCodeByBarangay,
    Region, Province, CityMunicipality, Barangay
} from '../../services/addressService';

const SARegisterResident: React.FC = () => {
    const router = useIonRouter();
    const [present, dismiss] = useIonLoading();
    const [currentStep, setCurrentStep] = useState(1);
    const progress = currentStep / 3; // 3 steps for resident registration

    // State for User Information (Page 1)
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [suffix, setSuffix] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [gender, setGender] = useState('');

    // State for Address and Contact Details (Page 2)
    const [selectedRegionCode, setSelectedRegionCode] = useState('');
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedCityMunCode, setSelectedCityMunCode] = useState('');
    const [selectedBarangayCode, setSelectedBarangayCode] = useState('');
    const [zipCode, setZipCode] = useState('');

    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipality[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);

    const [lotBlockHouseNo, setLotBlockHouseNo] = useState('');
    const [streetName, setStreetName] = useState('');
    const [subdivisionVillagePurok, setSubdivisionVillagePurok] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    // State for Account Credentials and Document Upload (Page 3)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [idType, setIdType] = useState('');
    const [idFile, setIdFile] = useState<File | null>(null);
    const idFileInputRef = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    // Load Regions on component mount
    useEffect(() => {
        const loadRegions = async () => {
            setRegions(await getRegions());
        };
        loadRegions();
    }, []);

    // Load Provinces when Region changes
    useEffect(() => {
        const loadProvinces = async () => {
            if (selectedRegionCode) {
                setProvinces(await getProvincesByRegion(selectedRegionCode));
                setSelectedProvinceCode('');
                setCitiesMunicipalities([]);
                setSelectedCityMunCode('');
                setBarangays([]);
                setSelectedBarangayCode('');
                setZipCode('');
            } else {
                setProvinces([]);
                setSelectedProvinceCode('');
            }
        };
        loadProvinces();
    }, [selectedRegionCode]);

    // Load Cities/Municipalities when Province changes
    useEffect(() => {
        const loadCitiesMunicipalities = async () => {
            if (selectedProvinceCode) {
                setCitiesMunicipalities(await getCitiesMunicipalitiesByProvince(selectedProvinceCode));
                setSelectedCityMunCode('');
                setBarangays([]);
                setSelectedBarangayCode('');
                setZipCode('');
            } else {
                setCitiesMunicipalities([]);
                setSelectedCityMunCode('');
            }
        };
        loadCitiesMunicipalities();
    }, [selectedProvinceCode]);

    // Load Barangays when City/Municipality changes
    useEffect(() => {
        const loadBarangays = async () => {
            if (selectedCityMunCode) {
                setBarangays(await getBarangaysByCityMunicipality(selectedCityMunCode));
                setSelectedBarangayCode('');
                setZipCode('');
            } else {
                setBarangays([]);
                setSelectedBarangayCode('');
            }
        };
        loadBarangays();
    }, [selectedCityMunCode]);

    // Load Zip Code when Barangay changes
    useEffect(() => {
        const loadZipCode = async () => {
            if (selectedBarangayCode) {
                setZipCode(await getZipCodeByBarangay(selectedBarangayCode) || '');
            } else {
                setZipCode('');
            }
        };
        loadZipCode();
    }, [selectedBarangayCode]);

    const isAtLeast18 = (dateString: string) => {
        const birthDate = parseISO(dateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 18;
    };

    const validateStep1 = () => {
        if (!firstName.trim() || !lastName.trim() || !birthdate || !gender) {
            setError('First name, last name, birthdate, and gender are required.');
            setShowErrorToast(true);
            return false;
        }
        if (!isAtLeast18(birthdate)) {
            setError('Resident must be at least 18 years old.');
            setShowErrorToast(true);
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep2 = () => {
        if (!selectedRegionCode || !selectedProvinceCode || !selectedCityMunCode || !selectedBarangayCode || !streetName.trim() || !contactNumber.trim()) {
            setError('Region, Province, City/Municipality, Barangay, Street Name, and Contact Number are required.');
            setShowErrorToast(true);
            return false;
        }
        const contactNumberRegex = /^\+63\d{10}$/;
        if (!contactNumberRegex.test(contactNumber)) {
            setError('Contact number must be a valid 10-digit number prefixed with +63 (e.g., +639171234567).');
            setShowErrorToast(true);
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep3 = () => {
        if (!email.trim() || !password.trim() || !idType || !idFile) {
            setError('Email, Password, ID Type, and ID File are required.');
            setShowErrorToast(true);
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            setShowErrorToast(true);
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setShowErrorToast(true);
            return false;
        }
        if (idFile && idFile.size > 5 * 1024 * 1024) { // 5MB limit
            setError('ID File size must not exceed 5MB.');
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
            // If all validations pass, show the summary modal
            setShowSummaryModal(true);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError(null); // Clear error when going back
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('ID File size must not exceed 5MB.');
                setShowErrorToast(true);
                setIdFile(null);
                if (idFileInputRef.current) idFileInputRef.current.value = ''; // Clear file input
            } else {
                setIdFile(file);
                setError(null);
            }
        } else {
            setIdFile(null);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleConfirmRegistration = async () => {
        present('Creating account...');
        try {
            if (!idFile) {
                throw new Error('ID file is not selected.');
            }

            const idFileBase64 = await fileToBase64(idFile);

            const functions = getFunctions();
            const createResidentAccount = httpsCallable(functions, 'createResidentAccount');

            const result = await createResidentAccount({
                email,
                password,
                firstName,
                middleName,
                lastName,
                suffix,
                birthdate,
                gender,
                selectedRegionCode,
                selectedProvinceCode,
                selectedCityMunCode,
                selectedBarangayCode,
                zipCode,
                lotBlockHouseNo,
                streetName,
                subdivisionVillagePurok,
                contactNumber,
                idType,
                idFile: idFileBase64,
            });

            dismiss();
            setSuccessMessage('Resident account created successfully. A verification email has been sent.');
            setShowSuccessToast(true);
            setShowSummaryModal(false);
            router.goBack();
        } catch (error: any) {
            dismiss();
            setError(error.message);
            setShowErrorToast(true);
        }
    };

    const getRegionName = (code: string) => regions.find(r => r.code === code)?.name || code;
    const getProvinceName = (code: string) => provinces.find(p => p.code === code)?.name || code;
    const getCityMunName = (code: string) => citiesMunicipalities.find(c => c.code === code)?.name || code;
    const getBarangayName = (code: string) => barangays.find(b => b.code === code)?.name || code;

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle>Register New Resident</IonTitle>
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

                {currentStep === 1 && (
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Step 1: Personal Details</IonCardTitle>
                            <IonCardSubtitle>
                                Please provide the resident's full name and personal information.
                            </IonCardSubtitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonItemDivider>Name</IonItemDivider>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    placeholder="First Name"
                                    value={firstName}
                                    onIonChange={(e) => setFirstName(e.detail.value!)}
                                    required
                                >
                                    <IonIcon slot="start" icon={person}></IonIcon>
                                </IonInput>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    placeholder="Middle Name (Optional)"
                                    value={middleName}
                                    onIonChange={(e) => setMiddleName(e.detail.value!)}
                                >
                                    <IonIcon slot="start" icon={person}></IonIcon>
                                </IonInput>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onIonChange={(e) => setLastName(e.detail.value!)}
                                    required
                                >
                                    <IonIcon slot="start" icon={person}></IonIcon>
                                </IonInput>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    placeholder="Suffix (Optional)"
                                    value={suffix}
                                    onIonChange={(e) => setSuffix(e.detail.value!)}
                                >
                                    <IonIcon slot="start" icon={person}></IonIcon>
                                </IonInput>
                            </IonItem>

                            <IonItemDivider className="ion-margin-top">Personal Details</IonItemDivider>
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
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonSelect
                                    fill="outline"
                                    value={gender}
                                    onIonChange={(e) => setGender(e.detail.value!)}
                                    placeholder="Select Gender"
                                    required
                                >
                                    <IonSelectOption value="Male">Male</IonSelectOption>
                                    <IonSelectOption value="Female">Female</IonSelectOption>
                                </IonSelect>
                            </IonItem>
                        </IonCardContent>
                    </IonCard>
                )}

                {currentStep === 2 && (
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Step 2: Address and Contact Details</IonCardTitle>
                            <IonCardSubtitle>
                                Please provide the resident's address and contact information.
                            </IonCardSubtitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonItemDivider>Location Details</IonItemDivider>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonSelect
                                    fill="outline"
                                    value={selectedRegionCode}
                                    onIonChange={e => setSelectedRegionCode(e.detail.value)}
                                    placeholder="Select Region"
                                    required
                                >
                                    {regions.map(region => (
                                        <IonSelectOption key={region.code} value={region.code}>
                                            {region.name}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonSelect
                                    fill="outline"
                                    value={selectedProvinceCode}
                                    onIonChange={e => setSelectedProvinceCode(e.detail.value)}
                                    placeholder="Select Province"
                                    disabled={!selectedRegionCode || provinces.length === 0}
                                    required
                                >
                                    {provinces.map(province => (
                                        <IonSelectOption key={province.code} value={province.code}>
                                            {province.name}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonSelect
                                    fill="outline"
                                    value={selectedCityMunCode}
                                    onIonChange={e => setSelectedCityMunCode(e.detail.value)}
                                    placeholder="Select City/Municipality"
                                    disabled={!selectedProvinceCode || citiesMunicipalities.length === 0}
                                    required
                                >
                                    {citiesMunicipalities.map(cityMun => (
                                        <IonSelectOption key={cityMun.code} value={cityMun.code}>
                                            {cityMun.name}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonSelect
                                    fill="outline"
                                    value={selectedBarangayCode}
                                    onIonChange={e => setSelectedBarangayCode(e.detail.value)}
                                    placeholder="Select Barangay"
                                    disabled={!selectedCityMunCode || barangays.length === 0}
                                    required
                                >
                                    {barangays.map(barangay => (
                                        <IonSelectOption key={barangay.code} value={barangay.code}>
                                            {barangay.name}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    label="Zip Code"
                                    value={zipCode}
                                    disabled
                                ></IonInput>
                            </IonItem>

                            <IonItemDivider className="ion-margin-top">Specific Address Details and Contact Info</IonItemDivider>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    placeholder="Lot/Block/House No. (Optional)"
                                    value={lotBlockHouseNo}
                                    onIonChange={e => setLotBlockHouseNo(e.detail.value!)}
                                ></IonInput>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    placeholder="Street Name"
                                    value={streetName}
                                    onIonChange={e => setStreetName(e.detail.value!)}
                                    required
                                ></IonInput>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    placeholder="Subdivision/Village/Zone/Purok (Optional)"
                                    value={subdivisionVillagePurok}
                                    onIonChange={e => setSubdivisionVillagePurok(e.detail.value!)}
                                ></IonInput>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    type="tel"
                                    placeholder="+639171234567"
                                    value={contactNumber}
                                    onIonChange={e => setContactNumber(e.detail.value!)}
                                    required
                                    pattern="^\\+63\\d{10}$"
                                    helperText="Must be a valid 10-digit number, prefixed with +63 (e.g., +639171234567)"
                                ></IonInput>
                            </IonItem>
                        </IonCardContent>
                    </IonCard>
                )}

                {currentStep === 3 && (
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Step 3: Account Credentials and Document Upload</IonCardTitle>
                            <IonCardSubtitle>
                                Please provide account credentials and upload necessary documents.
                            </IonCardSubtitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonItemDivider>Account Credentials</IonItemDivider>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onIonChange={e => setEmail(e.detail.value!)}
                                    required
                                ></IonInput>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonInput
                                    fill="outline"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onIonChange={e => setPassword(e.detail.value!)}
                                    required
                                ></IonInput>
                            </IonItem>

                            <IonItemDivider className="ion-margin-top">Document Uploads</IonItemDivider>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <IonSelect
                                    fill="outline"
                                    value={idType}
                                    onIonChange={e => setIdType(e.detail.value!)}
                                    placeholder="Select ID Type"
                                    required
                                >
                                    <IonSelectOption value="National ID">National ID</IonSelectOption>
                                    <IonSelectOption value="Barangay ID">Barangay ID</IonSelectOption>
                                    <IonSelectOption value="PhilHealth ID">PhilHealth ID</IonSelectOption>
                                </IonSelect>
                            </IonItem>
                            <IonItem className="ion-margin-vertical" lines="none">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    ref={idFileInputRef}
                                    style={{ display: 'none' }} // Hide the default input
                                />
                                <IonButton onClick={() => idFileInputRef.current?.click()} expand="block" fill="outline">
                                    Upload ID File (Max 5MB)
                                </IonButton>
                                {idFile && <IonText className="ion-padding-start">{idFile.name}</IonText>}
                            </IonItem>
                        </IonCardContent>
                    </IonCard>
                )}
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
                                        shape='round'
                                        fill='outline'
                                        onClick={prevStep}
                                    >
                                        <IonIcon slot="start" icon={arrowBack} />
                                        <IonText className='ion-padding-vertical'>Back</IonText>
                                    </IonButton>
                                </IonCol>
                                <IonCol size="9">
                                    <IonButton
                                        expand='block'
                                        shape='round'
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
                                        color={"success"}
                                        expand="block"
                                        shape="round"
                                        onClick={nextStep} // Changed to nextStep to trigger summary modal
                                    >
                                        <IonText className="ion-padding-vertical">
                                            SUBMIT REGISTRATION
                                        </IonText>
                                        <IonIcon slot="end" icon={checkmarkDoneOutline} />
                                    </IonButton>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    )}
                </IonToolbar>
            </IonFooter>

            {/* Summary Modal */}
            <IonModal isOpen={showSummaryModal} onDidDismiss={() => setShowSummaryModal(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Registration Summary</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowSummaryModal(false)}>
                                <IonIcon icon={close} slot="icon-only" />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Personal Details</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonItem>
                                <IonLabel>Name:</IonLabel>
                                <IonText>{`${firstName} ${middleName ? middleName + ' ' : ''}${lastName} ${suffix ? suffix : ''}`.trim()}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Birthdate:</IonLabel>
                                <IonText>{birthdate}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Gender:</IonLabel>
                                <IonText>{gender}</IonText>
                            </IonItem>
                        </IonCardContent>
                    </IonCard>

                    <IonCard className="ion-margin-top">
                        <IonCardHeader>
                            <IonCardTitle>Address and Contact Details</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonItem>
                                <IonLabel>Region:</IonLabel>
                                <IonText>{getRegionName(selectedRegionCode)}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Province:</IonLabel>
                                <IonText>{getProvinceName(selectedProvinceCode)}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>City/Municipality:</IonLabel>
                                <IonText>{getCityMunName(selectedCityMunCode)}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Barangay:</IonLabel>
                                <IonText>{getBarangayName(selectedBarangayCode)}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Zip Code:</IonLabel>
                                <IonText>{zipCode}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Lot/Block/House No.:</IonLabel>
                                <IonText>{lotBlockHouseNo || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Street Name:</IonLabel>
                                <IonText>{streetName}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Subdivision/Village/Purok:</IonLabel>
                                <IonText>{subdivisionVillagePurok || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Contact Number:</IonLabel>
                                <IonText>{contactNumber}</IonText>
                            </IonItem>
                        </IonCardContent>
                    </IonCard>

                    <IonCard className="ion-margin-top">
                        <IonCardHeader>
                            <IonCardTitle>Account Credentials and Document Upload</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonItem>
                                <IonLabel>Email:</IonLabel>
                                <IonText>{email}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Password:</IonLabel>
                                <IonText>********</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>ID Type:</IonLabel>
                                <IonText>{idType}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>ID File:</IonLabel>
                                <IonText>{idFile ? idFile.name : 'No file selected'}</IonText>
                            </IonItem>
                        </IonCardContent>
                    </IonCard>
                </IonContent>
                <IonFooter>
                    <IonToolbar>
                        <IonGrid>
                            <IonRow>
                                <IonCol size="3">
                                    <IonButton
                                        expand="block"
                                        shape="round"
                                        fill="outline"
                                        onClick={() => setShowSummaryModal(false)}
                                    >
                                        <IonIcon slot="start" icon={arrowBack} />
                                        <IonText className="ion-padding-vertical">BACK</IonText>
                                    </IonButton>
                                </IonCol>
                                <IonCol size="9">
                                    <IonButton
                                        color={"success"}
                                        expand="block"
                                        shape="round"
                                        onClick={handleConfirmRegistration}
                                    >
                                        <IonText className="ion-padding-vertical">
                                            CONFIRM
                                        </IonText>
                                        <IonIcon slot="end" icon={checkmarkDoneOutline} />
                                    </IonButton>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonToolbar>
                </IonFooter>
            </IonModal>
        </IonPage>
    );
};

export default SARegisterResident;