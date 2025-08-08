import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonBadge,
  IonChip,
  IonLoading,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

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
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');

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
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requestData.push({
          id: doc.id,
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

  return (
  <>
      <IonHeader>
        <IonToolbar>
          
          <IonTitle>My Medicine Requests</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={loading} message="Loading..." />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        <IonSegment
          value={selectedSegment}
          onIonChange={(e) => setSelectedSegment(String(e.detail.value))}
          
        >
          <IonSegmentButton value="all">All</IonSegmentButton>
          <IonSegmentButton value="pending">Pending</IonSegmentButton>
          <IonSegmentButton value="approved">Approved</IonSegmentButton>
          <IonSegmentButton value="completed">Completed</IonSegmentButton>
        </IonSegment>

        <IonGrid>
          <IonRow>
            {filteredRequests.length === 0 ? (
              <IonCol size="12">
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonText color="medium">
                      <p>No medicine requests found</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ) : (
              filteredRequests.map((request) => (
                <IonCol size="12" sizeMd="6" sizeLg="4" key={request.id}>
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>{request.medicineName}</IonCardTitle>
                      <IonChip color={getStatusColor(request.status)} slot="end">
                        <IonLabel>{request.status.toUpperCase()}</IonLabel>
                      </IonChip>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonList>
                        <IonItem>
                          <IonLabel>
                            <p>Type</p>
                            <h3>{request.medicineType}</h3>
                          </IonLabel>
                        </IonItem>

                        <IonItem>
                          <IonLabel>
                            <p>Quantity</p>
                            <h3>{request.quantity} unit{request.quantity !== 1 ? 's' : ''}</h3>
                          </IonLabel>
                        </IonItem>

                        <IonItem>
                          <IonLabel>
                            <p>Pickup Date</p>
                            <h3>{formatDate(request.pickupDate)}</h3>
                          </IonLabel>
                        </IonItem>

                        <IonItem>
                          <IonLabel>
                            <p>Request Date</p>
                            <h3>{formatDate(request.requestDate)}</h3>
                          </IonLabel>
                        </IonItem>

                        {request.approvedDate && (
                          <IonItem>
                            <IonLabel>
                              <p>Approved Date</p>
                              <h3>{formatDate(request.approvedDate)}</h3>
                            </IonLabel>
                          </IonItem>
                        )}

                        {request.completedDate && (
                          <IonItem>
                            <IonLabel>
                              <p>Completed Date</p>
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
                      </IonList>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))
            )}
          </IonRow>
        </IonGrid>
      </IonContent>
    
    </>
  );
};

export default UserRequests
