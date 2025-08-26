import React, { useEffect, useState } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonIcon, 
  IonLabel, 
  IonButtons, 
  IonButton,
  IonModal,
  IonList,
  IonItem,
  IonAlert,
  IonSegment,
  IonSegmentButton,
  IonTabBar,
  IonTabButton
} from '@ionic/react';
import { person, home, notifications, albums, chevronBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationService } from '../../services/teleconsultationService';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import './user-tele-list.css';

const UserRequestTele: React.FC = () => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const teleconsultationService = TeleconsultationService.getInstance();

  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<TeleconsultationRequest | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (currentUser) {
        const userRequests = await teleconsultationService.getUserRequestsByStatus(currentUser.uid, selectedStatus);
        setRequests(userRequests);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [currentUser, selectedStatus]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setLoading(true);
  };

  const handleViewDetails = (request: TeleconsultationRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleMarkAsCompleted = async (requestId: string | undefined) => {
    if (!requestId) return;
    await teleconsultationService.updateRequestStatus(requestId, 'completed');
    setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'completed' } : req));
  };

  const handleCancelRequest = (request: TeleconsultationRequest) => {
    setRequestToCancel(request);
    setShowCancelAlert(true);
  };

  const confirmCancelRequest = async () => {
    if (requestToCancel && requestToCancel.id) {
      await teleconsultationService.updateRequestStatus(requestToCancel.id, 'cancelled');
      setRequests(requests.map(req => req.id === requestToCancel.id ? { ...req, status: 'cancelled' } : req));
      setShowCancelAlert(false);
      setRequestToCancel(null);
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {/* Back Button (similar to UserRequests.tsx) */}
            <IonButton onClick={() => history.push('/user/dashboard/requests')}>
              <IonIcon icon={chevronBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>My Teleconsultation Requests</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="with-tab-padding">
         <IonSegment scrollable={true} value={selectedStatus} onIonChange={e => handleStatusChange(String(e.detail.value))}>
              
              <IonSegmentButton value="pending">
                <IonLabel>Pending</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="approved">
                <IonLabel>Approved</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="completed">
                <IonLabel>Completed</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="cancelled">
                <IonLabel>Cancelled</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="all">
                <IonLabel>All</IonLabel>
              </IonSegmentButton>
            </IonSegment>


        <IonCard>
          <IonCardContent>
           
            {loading ? (
              <p>Loading requests...</p>
            ) : (
              <IonList>
                {requests.map(request => (
                  <IonItem key={request.id}>
                    <IonLabel>
                      <h2>Status: {request.status}</h2>
                      <p>Date Sent: {request.requestDate?.toLocaleDateString()}</p>
                      {request.status === 'approved' && (
                        <p>Scheduled Date: {request.preferredDate?.toLocaleDateString()}</p>
                      )}
                    </IonLabel>
                    <IonButtons slot="end">
                      <IonButton onClick={() => handleViewDetails(request)}>VIEW DETAILS</IonButton>
                      {request.status === 'pending' && (
                        <IonButton onClick={() => handleCancelRequest(request)}>CANCEL REQUEST</IonButton>
                      )}
                      {request.status === 'approved' && request.id && (
                        <IonButton onClick={() => handleMarkAsCompleted(request.id)}>MARK AS COMPLETED</IonButton>
                      )}
                    </IonButtons>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal isOpen={showDetailsModal} onDidDismiss={() => setShowDetailsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Request Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDetailsModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedRequest && (
              <div>
                <h3>Request Details</h3>
                <p>User: {selectedRequest.userName}</p>
                <p>Symptoms: {selectedRequest.symptoms}</p>
                <p>Additional Notes: {selectedRequest.additionalNotes}</p>
                <p>Status: {selectedRequest.status}</p>
                <p>Date Sent: {selectedRequest.requestDate?.toLocaleDateString()}</p>
                {selectedRequest.status === 'approved' && (
                  <p>Scheduled Date: {selectedRequest.preferredDate?.toLocaleDateString()}</p>
                )}
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header={'Confirm Cancellation'}
          message={'Are you sure you want to cancel this teleconsultation request?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                setShowCancelAlert(false);
              }
            },
            {
              text: 'Yes, Cancel',
              handler: confirmCancelRequest
            }
          ]}
        />
      </IonContent>
    </>
  );
};

export default UserRequestTele;