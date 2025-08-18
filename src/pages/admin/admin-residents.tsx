import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, IonList, IonItem, IonLabel, IonSpinner, IonSearchbar, IonCardSubtitle } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface Resident {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    barangay: string;
    role: string;
    createdAt?: any;
}

const Residents: React.FC = () => {
    const [userBarangay, setUserBarangay] = useState<string>('');
    const [residents, setResidents] = useState<Resident[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchAdminBarangay = async () => {
            if (currentUser) {
                try {
                    const adminDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (adminDoc.exists()) {
                        const adminData = adminDoc.data();
                        setUserBarangay(adminData.barangay || '');
                    }
                } catch (error) {
                    console.error("Error fetching admin barangay:", error);
                }
            }
        };

        fetchAdminBarangay();
    }, [currentUser]);

    useEffect(() => {
        const fetchResidents = async () => {
            if (!userBarangay) return;

            setLoading(true);
            try {
                const residentsRef = collection(db, 'users');
                const q = query(
                    residentsRef, 
                    where('barangay', '==', userBarangay),
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
    }, [userBarangay]);

    const filteredResidents = residents.filter(resident => {
        const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        return fullName.includes(searchLower) || 
               resident.firstName.toLowerCase().includes(searchLower) || 
               resident.lastName.toLowerCase().includes(searchLower);
    });

    return (
        <IonPage>
            <IonHeader className='ion-no-border'>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>Barangay {userBarangay} Residents</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
               
                <IonSearchbar
                    placeholder="Search residents by name" 
                    value={searchQuery} 
                    onIonChange={e => setSearchQuery(e.detail.value!)} 
                    
                />
                 <IonCardSubtitle className="ion-margin-bottom">Showing all residents in {userBarangay}.</IonCardSubtitle>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                        <IonSpinner />
                    </div>
                ) : (
                    <IonList>
                        {filteredResidents.length > 0 ? (
                            filteredResidents.map(resident => (
                                <IonItem key={resident.id}>
                                    <IonLabel>
                                        <h2>{resident.firstName} {resident.lastName}</h2>
                                        <p>{resident.email}</p>
                                    </IonLabel>
                                </IonItem>
                            ))
                        ) : (
                            <IonItem>
                                <IonLabel>No residents found</IonLabel>
                            </IonItem>
                        )}
                    </IonList>
                )}
            </IonContent>
        </IonPage>
    );
};

export default Residents;
