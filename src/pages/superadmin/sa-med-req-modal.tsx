import React from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText, IonButtons, IonBadge, IonItem, IonLabel, IonFooter, IonCardSubtitle, IonItemDivider, IonIcon } from '@ionic/react';
import { close, open } from 'ionicons/icons';

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
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonTitle>Request Details</IonTitle>
          <IonButtons slot="end">
            <IonButton shape='round' onClick={onClose}>
              <IonIcon color='primary' icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Brgy. {request.barangay} is requesting:</h2>
          <IonText color={'primary'}><h2> {request.medicineName} ({request.medicineType})</h2></IonText>
        </IonText>

        <br />
        {request.notes && (
          <IonItem>
            <IonLabel>
              <p>Notes</p>
              <h3>{request.notes}</h3>
            </IonLabel>
          </IonItem>
        )}

        <IonItem>
          <IonLabel>
            <p>Current Stock of {request.medicineName} ({request.medicineType}) in {request.barangay}:</p>
            <h3>{request.currentQuantity} units</h3>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <p>Requested by:</p>
            <h3>{request.adminEmail}</h3>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <p>Requested:</p>
            <h3>{new Date(request.requestDate?.toDate()).toLocaleDateString()}</h3>
          </IonLabel>
        </IonItem>
        <IonItem>
          Current Status:
          <IonBadge slot='end' color={getStatusColor(request.status)} style={{ margin: '8px 0' }}>
            {request.status}
          </IonBadge>

        </IonItem>

      </IonContent>
      <IonFooter className='ion-text-right'>

        <IonButton

          color="danger"
          disabled={request.status !== 'pending'}
          style={{ marginLeft: '8px' }}
        >
          Reject
          <IonIcon icon={close} slot='start' />
        </IonButton>
        <IonButton
          color="success"
          disabled={request.status !== 'pending'}
        >
          Process Request
          <IonIcon icon={open} slot='end' />
        </IonButton>

      </IonFooter>
    </IonModal>
  );
};

export default SA_Med_Request_Modal;
