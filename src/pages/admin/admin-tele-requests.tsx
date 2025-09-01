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
import { TeleconsultationService } from '../../services/teleconsultationService';
import { useAuth } from '../../contexts/AuthContext';
import { calendarClear, checkmark, close, ellipsisHorizontal, open, person } from 'ionicons/icons';
import './admin-medicine-requests.css';

const teleconsultationService = TeleconsultationService.getInstance();

interface TeleconsultationRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userBarangay: string;
  preferredDate: Date;
  preferredTime: string;
  symptoms: string;
  additionalNotes?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  requestDate: Date;
  confirmedDate?: Date;
  completedDate?: Date;
  doctorAssigned?: string;
  meetingLink?: string;
  notes?: string;
}

const AdminTeleRequests: React.FC = () => {
  const { currentUser, userBarangayId } = useAuth();
  const [requests, setRequests] = useState<TeleconsultationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TeleconsultationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showApproveAlert, setShowApproveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  const [filter, setFilter] = useState<string>('pending'); // default PENDING

  // Fetch data filtered by admin's barangay
  useEffect(() => {
    const fetchRequests = async () => {
      if (!userBarangayId) return;
      const requestsByBarangay = await teleconsultationService.getTeleconsultationRequestsByBarangay(userBarangayId);
      setRequests(requestsByBarangay);
    };
    fetchRequests();
  }, [userBarangayId]);

  // Update status in Firestore
  const updateStatus = async (status: 'approved' | 'cancelled' | 'completed') => {
    if (selectedRequest && currentUser) {
      await teleconsultationService.updateRequestStatus(selectedRequest.id, status);
      setRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id ? { ...req, status: status } : req
        )
      );
      setShowModal(false);
      setSelectedRequest(null);
    }
  };

  // Filtered requests by status
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
          <IonTitle>Teleconsultation Requests</IonTitle>
        </IonToolbar>
        {/* Status Filter */}
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
          <IonList key={req.id}>
            <IonItem className="request-item">
              <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <IonLabel className="request-info">
                    <h2>{req.userName}</h2>
                    <p className="user-name">Barangay: {req.userBarangay}</p>
                    <p className="pickup-date">Requested: {req.requestDate?.toDateString?.()}</p>
                    {req.doctorAssigned && <p>Doctor: {req.doctorAssigned}</p>}
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
                    <IonButtons>
                      <IonButton
                        color="primary"
                        className="view-details-btn"
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowModal(true);
                        }}
                      >
                        <IonIcon icon={open} />
                      </IonButton>
                    </IonButtons>
                  )}
                </div>
              </div>
            </IonItem>
          </IonList>
        ))}

        {/* Teleconsultation Request Details Modal */}
        <IonModal
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
          className="medicine-request-modal"
        >
          <IonCard>
            <IonToolbar>
              <IonCardHeader>
                <IonCardTitle>Teleconsultation Request Details</IonCardTitle>
              </IonCardHeader>
              <IonButtons slot="end">
                <IonButton shape="round" onClick={() => setShowModal(false)}>
                  <IonIcon color="primary" icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>

            <IonCardContent>
              {selectedRequest && (
                <div>
                  <IonItem>
                    <IonInput label="Resident Name" labelPlacement="floating" readonly value={selectedRequest.userName}></IonInput>
                    <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
                  </IonItem>

                  <IonItem>
                    <IonInput label="Barangay" labelPlacement="floating" readonly value={selectedRequest.userBarangay}></IonInput>
                  </IonItem>

                  <IonItem>
                    <IonInput label="Request Date" labelPlacement="floating" readonly value={selectedRequest.requestDate?.toDateString()}></IonInput>
                    <IonIcon slot="start" icon={calendarClear} aria-hidden="true"></IonIcon>
                  </IonItem>

                  <IonItem>
                    <IonInput label="Doctor Assigned" labelPlacement="floating" readonly value={selectedRequest.doctorAssigned || 'N/A'}></IonInput>
                    <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
                  </IonItem>

                  <IonItem>
                    <IonInput label="Symptoms" labelPlacement="floating" readonly value={selectedRequest.symptoms}></IonInput>
                  </IonItem>

                  <IonItem>
                    <IonInput label="Additional Notes" labelPlacement="floating" readonly value={selectedRequest.additionalNotes || 'N/A'}></IonInput>
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
          message={`Are you sure you want to approve this teleconsultation request for ${selectedRequest?.userName}?`}
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
          message={`Are you sure you want to reject this teleconsultation request for ${selectedRequest?.userName}?`}
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

export default AdminTeleRequests;
