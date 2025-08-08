import React from 'react';
import {
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonButton,
  IonIcon,
  IonText,
  IonNote
} from '@ionic/react';
import { chevronBack, chevronForward } from 'ionicons/icons';

interface Page2Props {
  selectedMedicine: any;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  pickupDate: string;
  onPickupDateChange: (date: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const Page2: React.FC<Page2Props> = ({
  selectedMedicine,
  quantity,
  onQuantityChange,
  pickupDate,
  onPickupDateChange,
  onNext,
  onBack
}) => {
  const maxQuantity = selectedMedicine?.quantity || 0;

  return (
    <div>
      <IonCardHeader>
        <IonCardTitle>Step 2: Request Details</IonCardTitle>
        <IonText color="medium">
          <p>Specify the quantity and your pick-up date.</p>
        </IonText>
      </IonCardHeader>

      <IonCardContent>
        {selectedMedicine && (
          <div>
            <IonItem>
              <IonLabel position="stacked">Selected Medicine</IonLabel>
              <IonText>
                <h3>{selectedMedicine.name}</h3>
                <p>Type: {selectedMedicine.type}</p>
              </IonText>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Available Quantity</IonLabel>
              <IonText>
                <IonNote>{selectedMedicine.quantity} units available</IonNote>
              </IonText>
            </IonItem>
          </div>
        )}

        <IonItem>
          <IonLabel position="stacked">Quantity Needed</IonLabel>
          <IonInput
            type="number"
            value={quantity}
            min={1}
            max={maxQuantity}
            onIonChange={(e) => {
              const val = parseInt(e.detail.value!);
              onQuantityChange(val > 0 ? val : 1);
            }}
            placeholder="Enter quantity"
          />
          <IonNote slot="helper">Maximum: {maxQuantity} units</IonNote>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Pickup Date</IonLabel>
          <IonDatetime
            presentation="date"
            min={new Date().toISOString()}
            value={pickupDate}
            onIonChange={(e) => {
              const value = e.detail.value;
              if (Array.isArray(value)) {
                onPickupDateChange(value[0] || "");
              } else {
                onPickupDateChange(value || "");
              }
            }}
          />
          <IonNote slot="helper">Select when you'll pick up your medicine</IonNote>
        </IonItem>

        <div className="ion-margin-top">
          <IonButton expand="block" onClick={onNext}>
            Next
            <IonIcon icon={chevronForward} slot="end" />
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

export default Page2;
