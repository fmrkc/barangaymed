import React from 'react';
import {
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
  IonList,
  IonNote
} from '@ionic/react';
import { checkmarkCircle, chevronBack } from 'ionicons/icons';

interface Page3Props {
  userDetails: {
    name: string;
    address: string;
    barangay: string;
  };
  selectedMedicine: any;
  quantity: number;
  pickupDate: string;
  onBack: () => void;
  onSubmit: () => void;
}

const Page3: React.FC<Page3Props> = ({
  userDetails,
  selectedMedicine,
  quantity,
  pickupDate,
  onBack,
  onSubmit
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <IonCardHeader>
        <IonCardTitle>Step 3: Review Request</IonCardTitle>
        <IonText color="medium">
          <p>Please review your medicine request details</p>
        </IonText>
      </IonCardHeader>

      <IonCardContent>
        <IonList>
          <IonItem>
            <IonLabel>
              <h3>Personal Information</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <p>Name</p>
              <h3>{userDetails.name || 'Not provided'}</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <p>Address</p>
              <h3>{userDetails.address || 'Not provided'}</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <p>Barangay</p>
              <h3>{userDetails.barangay || 'Not provided'}</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <h3>Medicine Details</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <p>Medicine Name</p>
              <h3>{selectedMedicine?.name || 'Not selected'}</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <p>Type</p>
              <h3>{selectedMedicine?.type || 'Not specified'}</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <p>Quantity Requested</p>
              <h3>{quantity} unit{quantity !== 1 ? 's' : ''}</h3>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonLabel>
              <p>Pickup Date</p>
              <h3>{pickupDate ? formatDate(pickupDate) : 'Not selected'}</h3>
            </IonLabel>
          </IonItem>
        </IonList>

        <div className="ion-margin-top">
          <IonButton expand="block" onClick={onSubmit} color="success">
            <IonIcon icon={checkmarkCircle} slot="start" />
            Submit Request
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={onBack}>
            <IonIcon icon={chevronBack} slot="start" />
            Back
          </IonButton>
        </div>
      </IonCardContent>
    </div>
  );
};

export default Page3;
