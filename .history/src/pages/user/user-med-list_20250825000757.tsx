import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonChip,
  IonLoading,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonAlert,
  IonButton,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonModal,
  IonButtons
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { useHistory } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import '../user/user-med-list.css';
import { bagCheck, close, chevronBack } from 'ionicons/icons';
import { logMedicineRequestStatusUpdate } from '../../utils/logger';

interface MedicineRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAddress: string;
  userBarangay: string;
  medicineId: string;
  medicineName: string;
  medicineType: string;
  quantity: number;
  pickupDate: Date;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  requestDate: Date;
  approvedDate?: Date;
  completedDate?: Date;
  notes?: string;
  adminNotes?: string;
}

const UserRequests: React.FC = () => {
  const { currentUser } = useAuth();
  const history = useHistory(); // ✅ for navigation
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('pending');
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailedRequest, setDetailedRequest] = useState<MedicineRequest | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
    }
  }, [currentUser]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'medicineRequests'),
        where('userId', '==', currentUser?.uid),
        orderBy('requestDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const requestData: MedicineRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requestData.push({
          id: docSnap.id,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          userAddress: data.userAddress,
          userBarangay: data.userBarangay,
          medicineId: data.medicineId,
          medicineName: data.medicineName,
          medicineType: data.medicineType,
          quantity: data.quantity,
          pickupDate: data.pickupDate.toDate(),
          status: data.status,
          requestDate: data.requestDate.toDate(),
          approvedDate: data.approvedDate?.toDate(),
          completedDate: data.completedDate?.toDate(),
          notes: data.notes,
          adminNotes: data.adminNotes
        });
      });
      setRequests(requestData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setToastMessage('Error loading requests');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredRequests = selectedSegment === 'all'
    ? requests
    : requests.filter(req => req.status === selectedSegment);

  const handleCardClick = (request: MedicineRequest) => {
    if (request.status === 'approved') {
      setSelectedRequest(request);
      setShowConfirmAlert(true);
    }
  };

  const handleCancelRequest = (request: MedicineRequest) => {
    if (request.status === 'pending') {
      setSelectedRequest(request);
      setShowCancelAlert(true);
    }
  };

  const markAsCompleted = async () => {
    if (selectedRequest?.id) {
      try {
        const docRef = doc(db, 'medicineRequests', selectedRequest.id);
        const now = new Date();
        logMedicineRequestStatusUpdate(
          currentUser?.uid || '',
          currentUser?.email || '',
          'user',
          selectedRequest.id,
          'approved',
          'completed'
        );
        await updateDoc(docRef, {
          status: 'completed',
          completedDate: now
        });
        setRequests(prev =>
          prev.map(req =>
            req.id === selectedRequest.id
              ? { ...req, status: 'completed', completedDate: now }
              : req
          )
        );
        setToastMessage('Request marked as completed');
        setShowToast(true);
      } catch (error) {
        console.error('Error updating request:', error);
        setToastMessage('Error marking as completed');
        setShowToast(true);
      } finally {
        setSelectedRequest(null);
        setShowConfirmAlert(false);
      }
    }
  };

  const cancelRequest = async () => {
    if (selectedRequest?.id) {
      try {
        const docRef = doc(db, 'medicineRequests', selectedRequest.id);
        const now = new Date();
        logMedicineRequestStatusUpdate(
          currentUser?.uid || '',
          currentUser?.email || '',
          'user',
          selectedRequest.id,
          'pending',
          'cancelled'
        );
        await updateDoc(docRef, {
          status: 'cancelled',
          cancelledDate: now
        });
        setRequests(prev =>
          prev.map(req =>
            req.id === selectedRequest.id
              ? { ...req, status: 'cancelled', cancelledDate: now }
              : req
          )
        );
        setToastMessage('Request cancelled successfully');
        setShowToast(true);
      } catch (error) {
        console.error('Error cancelling request:', error);
        setToastMessage('Error cancelling request');
        setShowToast(true);
      } finally {
        setSelectedRequest(null);
        setShowCancelAlert(false);
      }
    }
  };

  const handleViewDetails = async (id?: string) => {
    if (!id) return;
    setDetailsLoading(true);
    try {
      const docRef = doc(db, 'medicineRequests', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDetailedRequest({
          id: docSnap.id,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          userAddress: data.userAddress,
          userBarangay: data.userBarangay,
          medicineId: data.medicineId,
          medicineName: data.medicineName,
          medicineType: data.medicineType,
          quantity: data.quantity,
          pickupDate: data.pickupDate.toDate(),
          status: data.status,
          requestDate: data.requestDate.toDate(),
          approvedDate: data.approvedDate?.toDate(),
          completedDate: data.completedDate?.toDate(),
          notes: data.notes,
          adminNotes: data.adminNotes
        });
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      setToastMessage('Error loading details');
      setShowToast(true);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          {/*Back button to go to requests.tsx */}
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/user/dashboard/requests')}>
              <IonIcon icon={chevronBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>My Medicine Requests</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={loading || detailsLoading} message="Loading..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        <IonSegment
          scrollable={true}
          value={selectedSegment}
          onIonChange={(e) => setSelectedSegment(String(e.detail.value))}
          color={getStatusColor(selectedSegment)}
        >
          <IonSegmentButton value="pending">Pending</IonSegmentButton>
          <IonSegmentButton value="approved">Approved</IonSegmentButton>
          <IonSegmentButton value="completed">Completed</IonSegmentButton>
          <IonSegmentButton value="cancelled">Cancelled</IonSegmentButton>
          <IonSegmentButton value="all">All</IonSegmentButton>
        </IonSegment>

        <IonGrid>
          <IonRow>
            {filteredRequests.length === 0 ? (
              <IonCol size="12">
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonText color="medium">
                      <p>No medicine requests found.</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ) : (
              filteredRequests.map((request) => (
                <IonCol size="12" sizeMd="6" sizeLg="4" key={request.id}>
                  <IonCard>
                    <IonCardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <IonCardTitle style={{ fontWeight: "bold" }}>{request.medicineName}</IonCardTitle>
                          <div><span>{request.medicineType}</span></div>
                          <div><span>{request.quantity} unit{request.quantity !== 1 ? 's' : ''}</span></div>
                        </div>
                        <IonChip color={getStatusColor(request.status)} slot="end">
                          <IonLabel>{request.status.toUpperCase()}</IonLabel>
                        </IonChip>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonGrid>
                        <IonRow style={{ padding: '0px', margin: '0px' }}>
                          {request.requestDate && (
                            <IonCol>
                              <IonItem>
                                <IonLabel>
                                  <p>Requested</p>
                                  <h3>{formatDate(request.requestDate)}</h3>
                                </IonLabel>
                              </IonItem>
                            </IonCol>
                          )}
                          <IonCol>
                            <IonItem>
                              <IonLabel>
                                <p>Pickup</p>
                                <h3>{formatDate(request.pickupDate)}</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                          {request.approvedDate && (
                            <IonCol>
                              <IonItem>
                                <IonLabel>
                                  <p>Approved</p>
                                  <h3>{formatDate(request.approvedDate)}</h3>
                                </IonLabel>
                              </IonItem>
                            </IonCol>
                          )}
                          {request.completedDate && (
                            <IonItem>
                              <IonLabel>
                                <p>Completed</p>
                                <h3>{formatDate(request.completedDate)}</h3>
                              </IonLabel>
                            </IonItem>
                          )}
                          {request.adminNotes && (
                            <IonItem>
                              <IonLabel>
                                <p>Admin Notes</p>
                                <IonNote>{request.adminNotes}</IonNote>
                              </IonLabel>
                            </IonItem>
                          )}
                        </IonRow>
                      </IonGrid>
                    </IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <IonButton fill='outline' onClick={() => handleViewDetails(request.id)}>
                        View Details
                      </IonButton>
                      <IonButton onClick={() => handleCardClick(request)} color="primary" disabled={request.status !== 'approved'}>
                        <IonIcon icon={bagCheck} slot="start" />
                        Mark as Completed
                      </IonButton>
                    </div>
                  </IonCard>
                </IonCol>
              ))
            )}
          </IonRow>
        </IonGrid>

        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header="Mark as Completed?"
          message="Are you sure you want to mark this request as completed?"
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setSelectedRequest(null) },
            { text: 'Yes, Completed', handler: markAsCompleted },
          ]}
        />

        {/* Details Modal */}
        <IonModal isOpen={showDetailsModal} onDidDismiss={() => setShowDetailsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowDetailsModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {detailedRequest && (
              <IonList>
                <IonItem><IonLabel><p>Medicine</p><h3>{detailedRequest.medicineName} ({detailedRequest.medicineType})</h3></IonLabel></IonItem>
                <IonItem><IonLabel><p>Quantity</p><h3>{detailedRequest.quantity}</h3></IonLabel></IonItem>
                <IonItem><IonLabel><p>Request Date</p><h3>{formatDate(detailedRequest.requestDate)}</h3></IonLabel></IonItem>
                <IonItem><IonLabel><p>Pickup Date</p><h3>{formatDate(detailedRequest.pickupDate)}</h3></IonLabel></IonItem>
                {detailedRequest.approvedDate && <IonItem><IonLabel><p>Approved Date</p><h3>{formatDate(detailedRequest.approvedDate)}</h3></IonLabel></IonItem>}
                {detailedRequest.completedDate && <IonItem><IonLabel><p>Completed Date</p><h3>{formatDate(detailedRequest.completedDate)}</h3></IonLabel></IonItem>}
                <IonItem><IonLabel><p>Status</p><h3>{detailedRequest.status.toUpperCase()}</h3></IonLabel></IonItem>
                <IonItem><IonLabel><p>User</p><h3>{detailedRequest.userName} ({detailedRequest.userEmail})</h3></IonLabel></IonItem>
                <IonItem><IonLabel><p>Address</p><h3>{detailedRequest.userAddress}, {detailedRequest.userBarangay}</h3></IonLabel></IonItem>
                {detailedRequest.notes && <IonItem><IonLabel><p>User Notes</p><IonNote>{detailedRequest.notes}</IonNote></IonLabel></IonItem>}
                {detailedRequest.adminNotes && <IonItem><IonLabel><p>Admin Notes</p><IonNote>{detailedRequest.adminNotes}</IonNote></IonLabel></IonItem>}
              </IonList>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </>
  );
};

export default UserRequests;

