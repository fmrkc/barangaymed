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
  IonMenuButton,
  IonModal,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonInput,
  IonCardSubtitle
} from '@ionic/react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // your firebase config import
import { logMedicineRequestStatusUpdate } from '../../utils/logger';
import './admin-medicine-requests.css';
import { calendarClear, checkmark, close, cube, ellipsisHorizontal, open, person } from 'ionicons/icons';

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
  const [showModal, setShowModal] = useState(false);
  const [showApproveAlert, setShowApproveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [newStatus, setNewStatus] = useState<'approved' | 'cancelled' | 'completed' | null>(null);

  const [filter, setFilter] = useState<string>('pending'); // default PENDING

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
  const updateStatus = async (status: 'approved' | 'cancelled') => {
    if (selectedRequest) {
      const docRef = doc(db, 'medicineRequests', selectedRequest.id);
      
      // Log the status change
      const adminUserId = 'admin-user-id'; // Replace with actual admin user ID
      const adminEmail = 'admin@example.com'; // Replace with actual admin email
      const adminRole = 'admin';
      
      logMedicineRequestStatusUpdate(
        adminUserId,
        adminEmail,
        adminRole,
        selectedRequest.id,
        selectedRequest.status,
        status
      );
      
      await updateDoc(docRef, { status: status });
      setRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id ? { ...req, status: status } : req
        )
      );
      
      setShowModal(false);
      setSelectedRequest(null);
    }
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
          <IonSegment scrollable={true} value={filter} onIonChange={(e) => setFilter(e.detail.value as string)}>
            <IonSegmentButton value="pending">PENDING</IonSegmentButton>
            <IonSegmentButton value="approved">APPROVED</IonSegmentButton>
            <IonSegmentButton value="completed">COMPLETED</IonSegmentButton>
            <IonSegmentButton value="cancelled">CANCELLED</IonSegmentButton>
            <IonSegmentButton value="all">ALL</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {filteredRequests.map((req) => (
        <IonList>
            <IonItem key={req.id} className="request-item">
              
          <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
            <div>
<IonLabel className="request-info">
                  <h2>
                    <span className="medicine-name">{req.medicineName}</span> 
                    <span className="quantity"> ({req.quantity})</span>
                  </h2>
                  <p className="user-name">Requested by: {req.userName}</p>
                  <p className="pickup-date">Pickup: {req.pickupDate?.toDate?.().toLocaleString?.()}</p>
                </IonLabel>
            </div>
      
            <div>
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
            </div>
            <div>
                
                {req.status === 'pending' && (
                  <button 
                    className="view-details-btn"
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowModal(true);
                    }}
                  >
                    <IonIcon icon={open} slot="start" />
                    
                  </button>
                )}
            </div>
          </div>
          
                
             
              </IonItem>
            
          </IonList>
          ))}


        {/* Medicine Request Details Modal */}
        <IonModal 
          isOpen={showModal} 
          onDidDismiss={() => setShowModal(false)}
          className="medicine-request-modal"
        >
          <IonCard>
            <IonToolbar>
               <IonCardHeader>
              <IonCardTitle>Medicine Request Details</IonCardTitle>
            </IonCardHeader>
            <IonButtons slot="end">
              <IonButton shape='round' onClick={() => setShowModal(false)}>
                <IonIcon color='primary' icon={close} />
              </IonButton>
            </IonButtons>
            </IonToolbar>
           
            <IonCardContent>
              {selectedRequest && (
                <div>

                  <IonItem>
                    <IonInput label='Medicine Name' labelPlacement='floating' readonly value={selectedRequest.medicineName}></IonInput>
                    <IonIcon slot="start" icon={cube} aria-hidden="true"></IonIcon>
                  </IonItem>

                  <IonItem>
                    <IonInput label='Quantity' labelPlacement='floating' readonly value={selectedRequest.quantity}></IonInput>
                    <IonIcon slot="start" icon={cube} aria-hidden="true"></IonIcon>
                  </IonItem>

                  <IonItem>
                    <IonInput label='Requested By' labelPlacement='floating' readonly value={selectedRequest.userName}></IonInput>
                    <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
                  </IonItem>

                  <IonItem>
                    <IonInput color={'medium'} label='Pickup Date' labelPlacement='floating' readonly value={selectedRequest.pickupDate?.toDate?.().toLocaleString?.()}></IonInput>
                    <IonIcon slot="start" icon={calendarClear} aria-hidden="true"></IonIcon>
                  </IonItem>

                <IonItem>
                  <IonLabel><p>Current Status</p></IonLabel>
                     <div className={`status-badge ${selectedRequest.status}`}>
                      {selectedRequest.status.toUpperCase()}
                    </div>
                    <IonIcon slot="start" icon={ellipsisHorizontal} aria-hidden="true"></IonIcon>
                  </IonItem>
                </div>
              )}
            </IonCardContent>
          </IonCard>
          
          <div className="modal-actions">
            <IonButton 
              color="medium" 
              fill="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </IonButton>
            <div>
              <IonButton 
                color="danger" 
                onClick={() => setShowCancelAlert(true)}
                style={{ marginRight: '10px' }}
              >
                Reject
                <IonIcon icon={close} slot="start" />
              </IonButton>
              <IonButton 
                color="success" 
                onClick={() => setShowApproveAlert(true)}
              >
                Approve
                <IonIcon icon={checkmark} slot="end" />
              </IonButton>
            </div>
          </div>
        </IonModal>

        {/* Approve Confirmation Alert */}
        <IonAlert
          isOpen={showApproveAlert}
          onDidDismiss={() => setShowApproveAlert(false)}
          header="Confirm Approval"
          message={`Are you sure you want to approve this medicine request for ${selectedRequest?.medicineName}?`}
          buttons={[
            {
              text: 'No',
              role: 'cancel'
            },
            {
              text: 'Yes, Approve',
              handler: () => {
                updateStatus('approved');
              }
            }
          ]}
        />

        {/* Cancel Confirmation Alert */}
        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header="Confirm Rejection"
          message={`Are you sure you want to reject this medicine request for ${selectedRequest?.medicineName}?`}
          buttons={[
            {
              text: 'No',
              role: 'cancel'
            },
            {
              text: 'Yes, Reject',
              role: 'destructive',
              handler: () => {
                updateStatus('cancelled');
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminMedicineRequests;
