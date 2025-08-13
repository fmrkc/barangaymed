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
import { bag, chevronBack, chevronForward, cube } from 'ionicons/icons';

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
              <IonInput
              readonly
              value={selectedMedicine.name}
              > <IonIcon slot="start" icon={bag} aria-hidden="true" /></IonInput>
            </IonItem>

            <IonItem>
              <IonInput
              disabled
              value={selectedMedicine.quantity + " units available."}
              > <IonIcon slot="start" icon={cube} aria-hidden="true" /></IonInput>
            </IonItem>

       
          </div>
        )}

        <IonItem>
          <IonInput
           className='ion-margin-top'
            fill='outline'
            type="number"
            label='Quantity:'
            labelPlacement='floating'
            value={quantity}
            min={1}
            max={Math.min(maxQuantity, 12)}
            onIonChange={(e) => {
              const val = parseInt(e.detail.value!);
              const clampedVal = Math.max(1, Math.min(val, Math.min(maxQuantity, 12)));
              onQuantityChange(clampedVal);
            }}
            placeholder="Enter quantity"
          />
          <IonNote slot="helper">Maximum: {Math.min(maxQuantity, 12)} units (1-12 pcs allowed)</IonNote>
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Pickup Date</IonLabel>
          <IonDatetime
          className='ion-margin-top'
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
