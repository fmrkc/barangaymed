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
  IonNote,
  IonInput
} from '@ionic/react';
import { checkmarkCircle, chevronBack, cube, home, medkit, person } from 'ionicons/icons';

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
          <p>Please review your medicine request details before submitting.</p>
        </IonText>
      </IonCardHeader>

      <IonCardContent>
        <IonList>
          
          <IonItem>
            <IonInput
            readonly
              value={userDetails.name || 'Not provided'}>
              <IonIcon slot='start' icon={person}></IonIcon>
            </IonInput>
          </IonItem>
          
         
          <IonItem>
            <IonInput
            readonly
              value={userDetails.address || 'Not provided'}>
              <IonIcon slot='start' icon={home}></IonIcon>
            </IonInput>
          </IonItem>
       

           <IonItem>
            <IonInput
       
            label='Requesting:'
            labelPlacement='floating'
            readonly
              value={selectedMedicine?.name + " (" + selectedMedicine?.type + ")" || 'Not specified'}>
              <IonIcon slot='start' icon={medkit}></IonIcon>
            </IonInput>
          </IonItem>

          <IonItem>
            <IonInput
            readonly
              value={quantity + " pcs."}
                      label='Quantity:'
            labelPlacement='floating'
            >
                
              <IonIcon slot='start' icon={cube}></IonIcon>
            </IonInput>
          </IonItem>

         <IonItem>
            <IonInput
       
            label='Will be picked up at:'
            labelPlacement='floating'
            readonly
              value={pickupDate ? formatDate(pickupDate) : 'Not selected'}>
              <IonIcon slot='start' icon={medkit}></IonIcon>
            </IonInput>
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
