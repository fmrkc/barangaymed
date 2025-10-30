import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonList, IonItem, IonLabel, IonSpinner, IonModal, IonSelect, IonSelectOption, IonButtons, IonMenuButton, IonFab, IonFabButton, IonRefresher, IonText, IonFooter, IonSearchbar } from '@ionic/react';
import { add, close } from 'ionicons/icons';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import { Region, Province, CityMunicipality, Barangay, getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, getBarangaysByCityMunicipality } from '../../services/addressService';
import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    barangayId?: string;
    barangayName?: string;
    createdAt?: any;
    regionId?: string;
    provinceId?: string;
    cityMunicipalityId?: string;
    regionName?: string;
    provinceName?: string;
    cityMunicipalityName?: string;
    creatorEmail?: string;
    creatorDisplayName?: string;
    assignedLocation?: string;
    specificRole?: string;
}

const AdminManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [searchText, setSearchText] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedBrgy, setSelectedBrgy] = useState('');
    const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([]);

    const [regions, setRegions] = useState<Region[]>([]);
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipality[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedCityMunicipality, setSelectedCityMunicipality] = useState('');

    useEffect(() => {
        fetchAdmins();
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

    useEffect(() => {
        const loadBarangays = async () => {
            if (selectedCityMunicipality) {
                setBarangays(await getBarangaysByCityMunicipality(selectedCityMunicipality));
            } else {
                setBarangays([]);
            }
        };
        loadBarangays();
    }, [selectedCityMunicipality]);

    const uniqueCities = useMemo(() => {
        const cityMap = new Map<string, string>();
        admins.forEach(admin => {
            if (admin.cityMunicipalityId && admin.cityMunicipalityName) {
                cityMap.set(admin.cityMunicipalityId, admin.cityMunicipalityName);
            }
        });
        return Array.from(cityMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [admins]);

    const uniqueBarangays = useMemo(() => {
        const barangayMap = new Map<string, string>();
        admins.forEach(admin => {
            if (admin.barangayId && admin.barangayName && (!selectedCity || admin.cityMunicipalityId === selectedCity)) {
                barangayMap.set(admin.barangayId, admin.barangayName);
            }
        });
        return Array.from(barangayMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [admins, selectedCity]);

    useEffect(() => {
        let filtered = admins;

        if (searchText) {
            filtered = filtered.filter(admin =>
                admin.name.toLowerCase().includes(searchText.toLowerCase()) ||
                admin.email.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        if (selectedRole) {
            filtered = filtered.filter(admin => admin.role === selectedRole);
        }

        if (selectedCity) {
            filtered = filtered.filter(admin => admin.cityMunicipalityId === selectedCity);
        }

        if (selectedBrgy) {
            filtered = filtered.filter(admin => admin.barangayId === selectedBrgy);
        }

        setFilteredAdmins(filtered);
    }, [searchText, selectedRole, selectedCity, selectedBrgy, admins]);

    const fetchAdmins = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("role", "in", ["admin", "superadmin"]));
            const querySnapshot = await getDocs(q);
            const adminList: AdminUser[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.role === 'admin' || data.role === 'superadmin') {
                    adminList.push({
                        id: doc.id,
                        email: data.email,
                        name: data.name,
                        role: data.role,
                        barangayId: data.barangayId,
                        barangayName: data.barangayName,
                        createdAt: data.createdAt,
                        regionId: data.regionId,
                        provinceId: data.provinceId,
                        cityMunicipalityId: data.cityMunicipalityId,
                        regionName: data.regionName,
                        provinceName: data.provinceName,
                        cityMunicipalityName: data.cityMunicipalityName,
                        creatorEmail: data.creatorEmail,
                        creatorDisplayName: data.creatorDisplayName,
                        assignedLocation: data.assignedLocation,
                        specificRole: data.specificRole,
                    });
                }
            });
            setAdmins(adminList);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching admins:", error);
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (timestamp && timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString();
        }
        return 'N/A';
    };

    const openDetailsModal = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setDetailsModalOpen(true);
    };
  
    const handleRefresh = async (event: any) => {
        await fetchAdmins();
        event.detail.complete();
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>BHW Accounts</IonTitle>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar value={searchText} onIonChange={e => setSearchText(e.detail.value!)} placeholder="Search by Name or Email"></IonSearchbar>
                </IonToolbar>
                <IonToolbar>
                    <IonGrid>
                        <IonRow className="ion-margin-horizontal">
                            <IonCol size="3">
                                <IonSelect
                                    value={selectedRole}
                                    placeholder="Filter by Role"
                                    onIonChange={e => setSelectedRole(e.detail.value)}
                                    interface="popover"
                                >
                                    <IonSelectOption value="">All Roles</IonSelectOption>
                                    <IonSelectOption value="admin">Admin</IonSelectOption>
                                    <IonSelectOption value="superadmin">Super Admin</IonSelectOption>
                                </IonSelect>
                            </IonCol>
                            <IonCol size="3">
                                <IonSelect
                                    value={selectedCity}
                                    placeholder="Filter by City"
                                    onIonChange={e => { setSelectedCity(e.detail.value); setSelectedBrgy(''); }}
                                    interface="popover"
                                >
                                    <IonSelectOption value="">All Cities</IonSelectOption>
                                    {uniqueCities.map(city => (
                                        <IonSelectOption key={city.id} value={city.id}>{city.name}</IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonCol>
                            <IonCol size="3">
                                <IonSelect
                                    value={selectedBrgy}
                                    placeholder="Filter by Barangay"
                                    onIonChange={e => setSelectedBrgy(e.detail.value)}
                                    interface="popover"
                                    disabled={!selectedCity}
                                >
                                    <IonSelectOption value="">All Barangays</IonSelectOption>
                                    {uniqueBarangays.map(brgy => (
                                        <IonSelectOption key={brgy.id} value={brgy.id}>{brgy.name}</IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                  <IonRefresher slot="fixed" onIonRefresh={handleRefresh}></IonRefresher>
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton routerLink='/superadmin/dashboard/register-bhw'>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12">
                            <IonCard>
                                <IonCardContent>
                                    {loading ? (
                                        <IonSpinner />
                                    ) : filteredAdmins.length === 0 ? (
                                        <p>No matching admins found.</p>
                                    ) : (
                                        <IonList>
                                            {filteredAdmins.map((admin) => (
                                                <IonItem key={admin.id} button={true} detail={true} lines="full" onClick={() => openDetailsModal(admin)}>
                                                    <IonLabel>
                                                        <h2>{admin.name}</h2>
                                                        <p>{admin.email}</p>
                                                        <p>Role: {admin.role}</p>
                                                    </IonLabel>
                                                </IonItem>
                                            ))}
                                        </IonList>
                                    )}
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
            <IonModal isOpen={detailsModalOpen} onDidDismiss={() => setDetailsModalOpen(false)}>
                <IonHeader className='ion-no-border'>
                    <IonToolbar>
                        <IonTitle>Admin Details</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setDetailsModalOpen(false)}>
                                <IonIcon icon={close} slot="icon-only" />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {selectedAdmin && (
                        <IonList>
                            <IonItem>
                                <IonLabel>Name</IonLabel>
                                <IonText slot="end">{selectedAdmin.name}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Email</IonLabel>
                                <IonText slot="end">{selectedAdmin.email}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Role</IonLabel>
                                <IonText slot="end">{selectedAdmin.role}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Created At</IonLabel>
                                <IonText slot="end">{formatDate(selectedAdmin.createdAt)}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Created By</IonLabel>
                                <IonText slot="end">{selectedAdmin.creatorDisplayName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Region</IonLabel>
                                <IonText slot="end">{selectedAdmin.regionName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Province</IonLabel>
                                <IonText slot="end">{selectedAdmin.provinceName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>City/Municipality</IonLabel>
                                <IonText slot="end">{selectedAdmin.cityMunicipalityName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Barangay</IonLabel>
                                <IonText slot="end">{selectedAdmin.barangayName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Assigned Location</IonLabel>
                                <IonText slot="end">{selectedAdmin.assignedLocation || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Specific Role</IonLabel>
                                <IonText slot="end">{selectedAdmin.specificRole || 'N/A'}</IonText>
                            </IonItem>
                        </IonList>
                    )}
                </IonContent>
            </IonModal>
        </IonPage>
    );
};

export default AdminManagement;
