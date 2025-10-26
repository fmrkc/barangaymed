import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonSpinner, IonSearchbar, IonCardSubtitle, IonModal, IonButton, IonIcon, IonItemDivider, IonText, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getBarangayNameByCode } from '../../services/addressService';
import { person, call, mail, home, close, open } from 'ionicons/icons';

interface Resident {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    barangayId: string;
    role: string;
    createdAt?: any;
    middleName?: string;
    suffix?: string;
    name?: string;
    birthdate?: string;
    gender?: string;
    address?: string;
    contactNumber?: string;
    verificationStatus?: string;
    lotBlkHouseNo?: string;
    streetName?: string;
    subdivisionVillageZonePurok?: string;
    zipCode?: string;
    barangayName?: string;
}

const Residents: React.FC = () => {
    const { barangayId } = useAuth();
    const [residents, setResidents] = useState<Resident[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [barangayName, setBarangayName] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

    const openModal = (resident: Resident) => {
        setSelectedResident(resident);
        setShowModal(true);
    };

    useEffect(() => {
        if (barangayId) {
            getBarangayNameByCode(barangayId).then(name => {
                if (name) {
                    setBarangayName(name);
                }
            });
        }
    }, [barangayId]);

    useEffect(() => {
        const fetchResidents = async () => {
            if (!barangayId) return;

            setLoading(true);
            try {
                const residentsRef = collection(db, 'users');
                const q = query(
                    residentsRef,
                    where('barangayId', '==', barangayId),
                    where('role', '==', 'user')
                );
                const querySnapshot = await getDocs(q);
                const residentsList: Resident[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data() as Omit<Resident, 'id'>
                }));
                setResidents(residentsList);
            } catch (error) {
                console.error("Error fetching residents:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResidents();
    }, [barangayId]);

    const filteredResidents = residents.filter(resident => {
        const searchLower = searchQuery.toLowerCase();
        const nameToSearch = (resident.name || `${resident.firstName} ${resident.lastName}`).toLowerCase();
        const emailToSearch = resident.email.toLowerCase();
        return nameToSearch.includes(searchLower) || emailToSearch.includes(searchLower);
    });

    return (
        <IonPage>
            <IonHeader className='ion-no-border'>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>Barangay {barangayName || ''} Residents</IonTitle>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onIonChange={e => setSearchQuery(e.detail.value!)}
                />
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                        <IonSpinner />
                    </div>
                ) : (
                     <>
                     <IonCardSubtitle className="ion-margin-bottom">Showing all residents in {barangayName || 'your barangay'}.</IonCardSubtitle>
                    <IonList>
                        {filteredResidents.length > 0 ? (
                            filteredResidents.map(resident => (
                                <IonItem lines='none' >
                                    <IonCard key={resident.id}>
                                        <IonCardHeader className='ion-no-padding'>
                                            <IonCardTitle>
                                                {resident.name ? resident.name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') : `${resident.firstName} ${resident.lastName}`} {resident.suffix}
                                            </IonCardTitle>
                                            <IonCardSubtitle>
                                                {resident.email} • {resident.contactNumber}
                                            </IonCardSubtitle>
                                        </IonCardHeader>
                                        <IonCardContent className='ion-no-padding'>
                                            <IonLabel>
                                                <p></p>
                                            </IonLabel>

                                        </IonCardContent>
                                    </IonCard>
                                    <IonButtons slot='end'>
                                        <IonButton slot="end" onClick={() => openModal(resident)}>
                                            <IonIcon icon={open} slot='icon-only' />
                                        </IonButton>
                                    </IonButtons>
                                </IonItem>
                            ))
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60%' }}>
                                <IonCard style={{ textAlign: 'center' }} className='ion-padding-vertical'>
                                    <IonCardHeader>
                                        <IonCardTitle>
                                            <IonText color={'primary'}>
                                                <strong>No Residents Found</strong>
                                            </IonText>
                                        </IonCardTitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <p>
                                            {searchQuery
                                                ? `No residents match your search for "${searchQuery}".`
                                                : `There are no residents registered in ${barangayName || 'your barangay'} yet.`}
                                        </p>
                                    </IonCardContent>
                                </IonCard>
                            </div>
                        )}
                    </IonList>
                     </>
                )}
            </IonContent>


            {selectedResident && (
                <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                    <IonHeader className='ion-no-border'>
                        <IonToolbar>
                            <IonTitle>{selectedResident.name ? selectedResident.name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') : `${selectedResident.firstName} ${selectedResident.lastName}`}</IonTitle>
                            <IonButtons slot="end">
                                <IonButton shape='round' onClick={() => setShowModal(false)}>
                                    <IonIcon slot="icon-only" icon={close} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <IonCard className='ion-padding'>
                            <IonItemDivider className='ion-margin-top'>Personal Details</IonItemDivider>
                            <IonItem>
                                <IonIcon slot="start" icon={person} />
                                <IonLabel>Name</IonLabel>
                                <IonText slot="end">{selectedResident.name ? selectedResident.name.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') : `${selectedResident.firstName} ${selectedResident.lastName}`} {selectedResident.suffix}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonIcon slot="start" icon={call} />
                                <IonLabel>Contact</IonLabel>
                                <IonText slot="end">{selectedResident.contactNumber || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonIcon slot="start" icon={mail} />
                                <IonLabel>Email</IonLabel>
                                <IonText slot="end">{selectedResident.email}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonIcon slot="start" icon={home} />
                                <IonLabel>Barangay</IonLabel>
                                <IonText slot="end">{selectedResident.barangayName || 'N/A'}</IonText>
                            </IonItem>

                            <IonItemDivider className='ion-margin-top'>Address Details</IonItemDivider>
                            <IonItem>
                                <IonIcon slot='start' icon={home} />
                                <IonLabel>Lot/Blk/House No.</IonLabel>
                                <IonText slot='end'>{selectedResident.lotBlkHouseNo || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonIcon slot='start' icon={home} />
                                <IonLabel>Street Name</IonLabel>
                                <IonText slot='end'>{selectedResident.streetName || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonIcon slot='start' icon={home} />
                                <IonLabel>Subdivision/Village/Zone/Purok</IonLabel>
                                <IonText slot='end' style={{ whiteSpace: 'normal', textAlign: 'right' }}>{selectedResident.subdivisionVillageZonePurok || 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonIcon slot='start' icon={home} />
                                <IonLabel>Zip Code</IonLabel>
                                <IonText slot='end'>{selectedResident.zipCode || 'N/A'}</IonText>
                            </IonItem>

                            <IonItemDivider className='ion-margin-top'>Other Information</IonItemDivider>
                            <IonItem>
                                <IonLabel>Verification Status</IonLabel>
                                <IonText slot='end'>{selectedResident.verificationStatus}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Birthdate</IonLabel>
                                <IonText slot='end'>{selectedResident.birthdate ? new Date(selectedResident.birthdate).toLocaleDateString() : 'N/A'}</IonText>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Gender</IonLabel>
                                <IonText slot='end'>{selectedResident.gender || 'N/A'}</IonText>
                            </IonItem>
                        </IonCard>
                    </IonContent>
                </IonModal>
            )}
        </IonPage>
    );
};

export default Residents;
            

                
                