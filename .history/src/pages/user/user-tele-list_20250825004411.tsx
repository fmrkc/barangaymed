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
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonButtons, 
  IonButton,
  IonModal,
  IonList,
  IonItem,
  IonAlert
} from '@ionic/react';
import { person, home, notifications, albums, chevronBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationService } from '../../services/teleconsultationService';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';

const UserRequestTele: React.FC = () => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const teleconsultationService = TeleconsultationService.getInstance();

  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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

      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Teleconsultation Requests</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonTabBar>
              <IonTabButton tab="all" onClick={() => handleStatusChange('all')}>
                <IonLabel>All</IonLabel>
              </IonTabButton>
              <IonTabButton tab="pending" onClick={() => handleStatusChange('pending')}>
                <IonLabel>Pending</IonLabel>
              </IonTabButton>
              <IonTabButton tab="approved" onClick={() => handleStatusChange('approved')}>
                <IonLabel>Approved</IonLabel>
              </IonTabButton>
              <IonTabButton tab="completed" onClick={() => handleStatusChange('completed')}>
                <IonLabel>Completed</IonLabel>
              </IonTabButton>
              <IonTabButton tab="cancelled" onClick={() => handleStatusChange('cancelled')}>
                <IonLabel>Cancelled</IonLabel>
              </IonTabButton>
            </IonTabBar>
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
      </IonContent>

      {/* Navigation Menu Bar */}
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" onClick={() => history.push('/user/dashboard/home')}>
          <IonIcon icon={home} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="user_requests" onClick={() => history.push('/user/dashboard/requests')}>
          <IonIcon icon={albums} />
          <IonLabel>Requests</IonLabel>
        </IonTabButton>  
        <IonTabButton tab="notifications" onClick={() => history.push('/user/dashboard/notifications')}>
          <IonIcon icon={notifications} />
          <IonLabel>Notifications</IonLabel>
        </IonTabButton>
        <IonTabButton tab="account" onClick={() => history.push('/user/dashboard/account')}>
          <IonIcon icon={person} />
          <IonLabel>Account</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </>
  );
};

export default UserRequestTele;