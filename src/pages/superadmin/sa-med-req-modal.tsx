import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonButtons, IonBadge, IonItem, IonLabel, IonFooter } from '@ionic/react';

interface SA_Med_Request_ModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any; // Define a more specific type if possible
}

const SA_Med_Request_Modal: React.FC<SA_Med_Request_ModalProps> = ({ isOpen, onClose, request }) => {
  if (!request) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'medium';
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Request Details</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>{request.medicineName}</h2>
          <IonBadge color={getStatusColor(request.status)} style={{ margin: '8px 0' }}>
            {request.status}
          </IonBadge>
        </IonText>

        <IonItem>
          <IonLabel>
            <h3>Barangay</h3>
            <p>{request.barangay}</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Medicine Type</h3>
            <p>{request.medicineType}</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Current Stock</h3>
            <p>{request.currentQuantity} units</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Admin</h3>
            <p>{request.adminEmail}</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Request Date</h3>
            <p>{new Date(request.requestDate?.toDate()).toLocaleDateString()}</p>
          </IonLabel>
        </IonItem>

        {request.notes && (
          <IonItem>
            <IonLabel>
              <h3>Notes</h3>
              <p>{request.notes}</p>
            </IonLabel>
          </IonItem>
        )}
      </IonContent>
      <IonFooter className='ion-text-right'>

        <IonButton
          
          color="danger"
          disabled={request.status !== 'pending'}
          style={{ marginLeft: '8px' }}
        >
          Reject
        </IonButton>
        <IonButton
          color="success"
          disabled={request.status !== 'pending'}
        >
          Approve
        </IonButton>

      </IonFooter>
    </IonModal>
  );
};

export default SA_Med_Request_Modal;
