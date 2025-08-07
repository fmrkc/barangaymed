import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonSpinner, IonActionSheet, IonModal, IonInput, IonSelect, IonSelectOption, IonButtons, IonBackButton, IonMenuButton } from '@ionic/react';
import { personCircle, create, trash, ellipsisVertical } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    barangay?: string;
    createdAt?: any;
}

const adminmanagement: React.FC = () => {
    const { currentUser } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editBarangay, setEditBarangay] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const adminList: AdminUser[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.role === 'admin' || data.role === 'superadmin') {
                    adminList.push({
                        id: doc.id,
                        email: data.email,
                        name: data.name,
                        role: data.role,
                        barangay: data.barangay,
                        createdAt: data.createdAt
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

    const openActionSheet = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setActionSheetOpen(true);
    };

    const openEditModal = (admin: AdminUser | null) => {
        if (admin) {
            setEditName(admin.name);
            setEditEmail(admin.email);
            setEditRole(admin.role);
            setEditBarangay(admin.barangay || '');
            setEditModalOpen(true);
        }
    };

    const confirmDelete = (admin: AdminUser | null) => {
        if (admin) {
            setSelectedAdmin(admin);
            setDeleteConfirmOpen(true);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAdmin) return;

        try {
            const userRef = doc(db, 'users', selectedAdmin.id);
            await updateDoc(userRef, {
                name: editName,
                email: editEmail,
                role: editRole,
                barangay: editBarangay,
                updatedAt: new Date()
            });

            // Update local state
            setAdmins(admins.map(admin => 
                admin.id === selectedAdmin.id 
                    ? { ...admin, name: editName, email: editEmail, role: editRole, barangay: editBarangay }
                    : admin
            ));

            setEditModalOpen(false);
            setSelectedAdmin(null);
        } catch (error) {
            console.error("Error updating admin:", error);
            alert("Failed to update admin. Please try again.");
        }
    };

    const handleDelete = async () => {
        if (!selectedAdmin) return;

        try {
            // Delete from Firestore
            await deleteDoc(doc(db, 'users', selectedAdmin.id));

            // Delete from Firebase Auth
            const auth = getAuth();
            // Note: In a real app, you'd need to use Firebase Admin SDK to delete other users
            // This is a simplified version for demonstration
            console.log("Admin deleted from Firestore:", selectedAdmin.email);

            // Update local state
            setAdmins(admins.filter(admin => admin.id !== selectedAdmin.id));

            setDeleteConfirmOpen(false);
            setSelectedAdmin(null);
        } catch (error) {
            console.error("Error deleting admin:", error);
            alert("Failed to delete admin. Please try again.");
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton />
                    </IonButtons>
                    <IonTitle>Admin Management</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol size="12">
                            <IonButton routerLink='/superadmin/dashboard/sa-register' type='button' color='primary'>
                                Create Admin/Super Admin Account
                                <IonIcon icon={personCircle} slot="end" />
                            </IonButton>
                        </IonCol>
                    </IonRow>
                    
                    <IonRow className="ion-margin-top">
                        <IonCol size="12">
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>Current Admins</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    {loading ? (
                                        <IonSpinner />
                                    ) : admins.length === 0 ? (
                                        <p>No admins found.</p>
                                    ) : (
                                        <IonList>
                                            {admins.map((admin) => (
                                                <IonItem key={admin.id} button={true} detail={false} lines="full" onClick={() => openActionSheet(admin)}>
                                                    <IonLabel>
                                                        <h2>{admin.name}</h2>
                                                        <p>{admin.email}</p>
                                                        <p>Role: {admin.role}</p>
                                                        {admin.barangay && <p>Barangay: {admin.barangay}</p>}
                                                        <p>Created: {formatDate(admin.createdAt)}</p>
                                                    </IonLabel>
                                                    <IonIcon icon={ellipsisVertical} slot="end" />
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
            <IonActionSheet
                isOpen={actionSheetOpen}
                onDidDismiss={() => setActionSheetOpen(false)}
                buttons={[
                    {
                        text: 'Edit',
                        icon: create,
                        handler: () => {
                            setActionSheetOpen(false);
                            openEditModal(selectedAdmin);
                        }
                    },
                    {
                        text: 'Delete',
                        role: 'destructive',
                        icon: trash,
                        handler: () => {
                            setActionSheetOpen(false);
                            confirmDelete(selectedAdmin);
                        }
                    },
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            setActionSheetOpen(false);
                        }
                    }
                ]}
            />
            <IonModal isOpen={editModalOpen} onDidDismiss={() => setEditModalOpen(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={() => setEditModalOpen(false)}>
                                <IonIcon icon={create} />
                            </IonButton>
                        </IonButtons>
                        <IonTitle>Edit Admin</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <form onSubmit={handleEditSubmit}>
                        <IonInput
                            label="Full Name"
                            labelPlacement="floating"
                            value={editName}
                            onIonChange={e => setEditName(e.detail.value!)}
                            required
                        />
                        <IonInput
                            label="Email"
                            labelPlacement="floating"
                            type="email"
                            value={editEmail}
                            onIonChange={e => setEditEmail(e.detail.value!)}
                            required
                        />
                        <IonSelect
                            label="Role"
                            value={editRole}
                            onIonChange={e => setEditRole(e.detail.value!)}
                            required
                        >
                            <IonSelectOption value="admin">Admin</IonSelectOption>
                            <IonSelectOption value="superadmin">Super Admin</IonSelectOption>
                        </IonSelect>
                        <IonSelect
                            label="Barangay"
                            value={editBarangay}
                            onIonChange={e => setEditBarangay(e.detail.value!)}
                            required
                        >
                            <IonSelectOption value="Apalit">Apalit</IonSelectOption>
                            <IonSelectOption value="Gutad">Gutad</IonSelectOption>
                            <IonSelectOption value="Poblacion">Poblacion</IonSelectOption>
                        </IonSelect>
                        <IonButton expand="block" type="submit" className="ion-margin-top">
                            Save Changes
                        </IonButton>
                    </form>
                </IonContent>
            </IonModal>
            <IonModal isOpen={deleteConfirmOpen} onDidDismiss={() => setDeleteConfirmOpen(false)}>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={() => setDeleteConfirmOpen(false)}>
                                <IonIcon icon={trash} />
                            </IonButton>
                        </IonButtons>
                        <IonTitle>Confirm Delete</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <p>Are you sure you want to delete this admin?</p>
                    <IonButton color="danger" expand="block" onClick={handleDelete}>
                        Delete
                    </IonButton>
                    <IonButton expand="block" onClick={() => setDeleteConfirmOpen(false)}>
                        Cancel
                    </IonButton>
                </IonContent>
            </IonModal>
        </IonPage>
    );
};

export default adminmanagement;
