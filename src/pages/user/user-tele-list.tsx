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
  IonTabButton,
  IonItemDivider,
  IonText,
  IonInput,
  IonTextarea,
  IonChip,
  IonFooter,
  IonBackButton
} from '@ionic/react';
import { person, home, notifications, albums, chevronBack, close, open, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TeleconsultationService } from '../../services/teleconsultationService';
import { TeleconsultationRequest } from '../../types/teleconsultationRequests';
import './user-tele-list.css';

const UserRequestTele: React.FC = () => {
  const history = useHistory();
  const { currentUser } = useAuth();
  const teleconsultationService = TeleconsultationService.getInstance();
  const [selectedSegment, setSelectedSegment] = useState('pending');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
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
        <IonSegment color={getStatusColor(selectedSegment)} scrollable={true} value={selectedStatus} onIonChange={e => { handleStatusChange(String(e.detail.value)); setSelectedSegment(String(e.detail.value)); }}>

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


        <IonCard className='ion-margin'>
          <IonCardContent>

            {loading ? (
              <p>Loading requests...</p>
            ) : (
              <IonList>
                {requests.map(request => (
                  <IonItem key={request.id}>
                    <IonLabel>
                      <h2>Status: <IonText color={getStatusColor(request.status)}>{request.status}</IonText></h2>
                      <p>Date Sent: {request.requestDate?.toLocaleDateString()}</p>
                      {request.status === 'approved' && (
                        <p>Scheduled Date: {request.preferredDate?.toLocaleDateString()}</p>
                      )}
                    </IonLabel>
                    <IonButtons slot="end">
                      <IonButton fill='outline' color={'primary'} onClick={() => handleViewDetails(request)}>
                        VIEW DETAILS
                        <IonIcon icon={open} slot='end' />
                      </IonButton>
                    </IonButtons>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
        
        {loading ? (
              <p>Loading requests...</p>
            ) : ( 
              
                <IonModal isOpen={showDetailsModal} onDidDismiss={() => setShowDetailsModal(false)}>
          <IonHeader className='ion-no-border '>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton shape='round' color={'primary'} onClick={() => setShowDetailsModal(false)}>
                  <IonIcon icon={arrowBack} slot='start' />
                </IonButton>
              </IonButtons>
              <IonTitle>Request Details</IonTitle>
            </IonToolbar>
          </IonHeader>
            {selectedRequest && (
                <IonContent className='ion-padding'>

                  <IonCard>
                    <IonCardContent>
                      <IonItemDivider><IonLabel>Request ID: {selectedRequest.id}</IonLabel></IonItemDivider>
                      <IonItem>
                        <IonLabel slot='start'>Status: </IonLabel>
                        <IonChip slot='end' color={getStatusColor(selectedRequest.status)}>{selectedRequest.status}</IonChip>
                      </IonItem>
                      {selectedRequest.status === 'approved' && (
                        <>
                          <IonItemDivider><IonLabel>Approved Details</IonLabel></IonItemDivider>
                          <IonInput label='Schedule Date: ' value={selectedRequest.preferredDate?.toLocaleDateString()} />
                        </>
                      )}
                      <IonItem>
                        <IonLabel slot='start'>Request Date:</IonLabel>
                        <IonChip slot='end'>{selectedRequest.requestDate?.toLocaleDateString()}</IonChip>
                      </IonItem>
                      <IonItem>
                        <IonLabel slot='start'>AM/PM:</IonLabel>
                        <IonChip slot='end'>{selectedRequest.preferredTime}</IonChip>
                      </IonItem>
                      <IonItem>
                        <IonInput labelPlacement='floating' label='Symptom:' readonly value={selectedRequest.symptoms}></IonInput>
                      </IonItem>
                      <IonItem>
                        <IonTextarea readonly label='Additional Notes:' labelPlacement='floating' value={selectedRequest.additionalNotes}></IonTextarea>
                      </IonItem>

                      <IonItemDivider><IonLabel>Resident Details</IonLabel></IonItemDivider>
                      <IonItem>
                        <IonInput readonly label='Name:' value={selectedRequest.userName}></IonInput>
                      </IonItem>
                      <IonItem>
                        <IonInput readonly label='Contact Number:' value={selectedRequest.userPhone}></IonInput>
                      </IonItem>
                      <IonItem>
                        <IonInput readonly label='Request Sent:' value={selectedRequest.requestDate?.toLocaleDateString()}></IonInput>
                      </IonItem>
                    </IonCardContent>
                    <IonFooter>
                    </IonFooter>
                  </IonCard>
                </IonContent>
          )}
           {selectedRequest && selectedRequest.status === 'pending' && (
             <IonFooter>
              <IonToolbar>
               <div className='ion-text-right ion-padding'>
                 <IonButton color={'danger'} onClick={() => handleCancelRequest(selectedRequest)}>
                   CANCEL REQUEST
                   <IonIcon icon={close} slot='end' />
                 </IonButton>
               </div>
              </IonToolbar>
            </IonFooter>
           )}
        </IonModal>
              

            )}
        

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