import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonAlert,
  IonSegment,
  IonSegmentButton,
  IonButtons,
  IonMenuButton
} from '@ionic/react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // your firebase config import
import { logMedicineRequestStatusUpdate } from '../../utils/logger';

interface MedicineRequest {
  id: string;
  medicineName: string;
  quantity: number;
  status: string;
  userName: string;
  pickupDate: any;
}

const AdminMedicineRequests: React.FC = () => {
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [showChoiceAlert, setShowChoiceAlert] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [newStatus, setNewStatus] = useState<'approved' | 'cancelled' | 'completed' | null>(null);

  const [filter, setFilter] = useState<string>('all'); // default ALL

  // Fetch data
  useEffect(() => {
    const fetchRequests = async () => {
      const querySnapshot = await getDocs(collection(db, 'medicineRequests'));
      const data: MedicineRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as MedicineRequest);
      });
      setRequests(data);
    };
    fetchRequests();
  }, []);

  // Update status in Firestore
  const updateStatus = async () => {
    if (selectedRequest && newStatus) {
      const docRef = doc(db, 'medicineRequests', selectedRequest.id);
      
      // Log the status change
      // Note: For admin updates, we need to get the current user info
      // This is a simplified approach - in a real app, you'd get the admin user info
      const adminUserId = 'admin-user-id'; // Replace with actual admin user ID
      const adminEmail = 'admin@example.com'; // Replace with actual admin email
      const adminRole = 'admin';
      
      logMedicineRequestStatusUpdate(
        adminUserId,
        adminEmail,
        adminRole,
        selectedRequest.id,
        selectedRequest.status,
        newStatus
      );
      
      await updateDoc(docRef, { status: newStatus });
      setRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id ? { ...req, status: newStatus } : req
        )
      );
    }
    setSelectedRequest(null);
    setNewStatus(null);
  };

  // Filtered requests
  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter((req) => req.status.toLowerCase() === filter);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
                      <IonMenuButton />
                    </IonButtons>
          <IonTitle>Medicine Requests</IonTitle>
        </IonToolbar>
        {/* Category Filter */}
        <IonToolbar>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as string)}>
            <IonSegmentButton value="all">ALL</IonSegmentButton>
            <IonSegmentButton value="pending">PENDING</IonSegmentButton>
            <IonSegmentButton value="approved">APPROVED</IonSegmentButton>
            <IonSegmentButton value="completed">COMPLETED</IonSegmentButton>
            <IonSegmentButton value="cancelled">CANCELLED</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
            {filteredRequests.map((req) => (
              <IonItem
                key={req.id}
                button={req.status === 'pending'}
                onClick={() => {
                  if (req.status === 'pending') {
                    setSelectedRequest(req);
                    setShowChoiceAlert(true);
                  }
                  
                }}
              >
                <IonLabel>
                  <h2>{req.medicineName} ({req.quantity})</h2>
                  <p>Requested by: {req.userName}</p>
                  <p>Pickup: {req.pickupDate?.toDate?.().toLocaleString?.()}</p>
                </IonLabel>
                <IonBadge
                  color={
                    req.status === 'pending'
                      ? 'warning'
                      : req.status === 'approved'
                      ? 'success'
                      : req.status === 'cancelled'
                      ? 'danger'
                      : 'medium'
                  }
                >
                  {req.status.toUpperCase()}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>


        {/* First choice alert for PENDING */}
        <IonAlert
          isOpen={showChoiceAlert}
          onDidDismiss={() => setShowChoiceAlert(false)}
          header="Update Request"
          message="Approve or Cancel this request?"
          buttons={[
            {
              text: 'Approve',
              handler: () => {
                setNewStatus('approved');
                setShowConfirmAlert(true);
              },
            },
            {
              text: 'Cancel Request',
              role: 'destructive',
              handler: () => {
                setNewStatus('cancelled');
                setShowConfirmAlert(true);
              },
            },
            {
              text: 'Close',
              role: 'cancel'
            }
          ]}
        />

        {/* Confirmation alert */}
        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header="Confirm Action"
          message={`Are you sure you want to mark this request as ${newStatus?.toUpperCase()}?`}
          buttons={[
            {
              text: 'Yes',
              handler: () => {
                updateStatus();
              },
            },
            {
              text: 'No',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminMedicineRequests;