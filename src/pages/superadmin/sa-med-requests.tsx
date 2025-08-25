import { 
  IonButtons, 
  IonContent, 
  IonHeader, 
  IonMenuButton, 
  IonPage, 
  IonTitle, 
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
  IonSpinner,
  IonChip,
  IonIcon
} from '@ionic/react';
import SA_Med_Request_Modal from './sa-med-req-modal';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { close, open } from 'ionicons/icons';

const SA_Med_Requests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState('pending');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    setLoading(true);
    
    const requestsQuery = query(
      collection(db, 'adminMedicineRequests'),
      orderBy('requestDate', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'adminMedicineRequests', requestId), {
        status: newStatus,
        updatedAt: new Date()
      });
      setToastMessage(`Request ${newStatus} successfully`);
      setShowToast(true);
    } catch (error) {
      console.error('Error updating request:', error);
      setToastMessage('Error updating request');
      setShowToast(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  };

  const filteredRequests = selectedSegment === 'all' 
    ? requests 
    : requests.filter(req => req.status === selectedSegment);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Medicine Requests</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonSegment value={selectedSegment} onIonChange={(e) => setSelectedSegment(String(e.detail.value))}>
        
          <IonSegmentButton value="pending">
            <IonLabel>Pending</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="approved">
            <IonLabel>Approved</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="rejected">
            <IonLabel>Rejected</IonLabel>
          </IonSegmentButton>
            <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        <br />
        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p>Loading requests...</p>
            </IonText>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="ion-text-center ion-padding">
            <IonText color="medium">
              <h3>No requests found</h3>
              <p>{selectedSegment === 'all' ? 'No medicine requests yet.' : `No ${selectedSegment} requests.`}</p>
            </IonText>
          </div>
        ) : (
          
          <IonGrid>
            <IonRow>
              {filteredRequests.map((request) => (
                <IonCol size="12" size-md="6" key={request.id}>
                  <IonCard button onClick={() => { setSelectedRequest(request); setIsModalOpen(true); }}>
                    <IonCardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <IonCardTitle>
                          <IonText color={'primary'}>
                            {request.medicineName} ({request.medicineType})
                          </IonText>
                        </IonCardTitle>
                        <IonChip color={getStatusColor(request.status)}>
                          {request.status}
                        </IonChip>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonText color="medium">
                        <IonText color="medium">
                          <p>Requesting from: Brgy. {request.barangay}</p>
                          <p></p>
                          <p>Brgy. {request.barangay} currently has: {request.currentQuantity} units</p>
                        </IonText>
                      </IonText>
                      <div style={{ marginTop: '16px', textAlign: 'right' }}>
                        <IonButton
                          size="small"
                          color="danger"
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(request.id, 'rejected'); }}
                          disabled={request.status !== 'pending'}
                          style={{ marginLeft: '8px' }}
                        >
                          Reject
                          <IonIcon icon={close} slot='start' />
                        </IonButton>
                        <IonButton
                          size="small"
                          color="success"
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(request.id, 'approved'); }}
                          disabled={request.status !== 'pending'}
                        >
                          Process Request
                          <IonIcon icon={open} slot='end' />
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        <SA_Med_Request_Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          request={selectedRequest} 
        />
      </IonContent>
    </IonPage>
  );
};

export default SA_Med_Requests;
