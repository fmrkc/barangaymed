import React from 'react';
import { IonButton, IonList, IonItem, IonLabel, IonText, IonGrid, IonRow, IonCol, IonCardTitle, IonIcon, IonInput } from '@ionic/react';
import { arrowBack, arrowForward, at, call, home, mail, map, person, personAdd } from 'ionicons/icons';

interface Page5Props {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  lotBlkHouseNo: string;
  streetName: string;
  subdivisionVillageZonePurok: string;
  zipCode: string;
  contactNumber: string;
  email: string;
  password: string;
  barangayId: string;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

const Page5: React.FC<Page5Props> = ({
  firstName,
  middleName,
  lastName,
  suffix,
  lotBlkHouseNo,
  streetName,
  subdivisionVillageZonePurok,
  zipCode,
  contactNumber,
  email,
  barangayId,
  onBack,
  onSubmit,
  loading,
  error
}) => {
  // Combine address fields for display
  const addressParts = [
  lotBlkHouseNo,
  streetName,
  subdivisionVillageZonePurok,
  barangayId,
  "Floridablanca",
  "Pampanga",
  zipCode
];

// Filter out empty/undefined values and join them with commas
const fullAddress = addressParts.filter(part => part && part.trim() !== "").join(", ");


  return (
    <>
      <IonCardTitle className="ion-padding-vertical">
        Step 5: Review all of your information before submitting.
      </IonCardTitle>

      <IonList>
        <IonItem>
          <IonIcon slot="start" icon={person} aria-hidden="true"></IonIcon>
          <IonInput
            readonly
            value={`${firstName} ${middleName} ${lastName} ${suffix}`}
          ></IonInput>
        </IonItem>

        <IonItem>
          <IonIcon slot="start" icon={call} aria-hidden="true"></IonIcon>
          <IonInput
            
            readonly
            value={contactNumber}
          ></IonInput>
        </IonItem>

        <IonItem>
          <IonIcon slot="start" icon={home} aria-hidden="true"></IonIcon>
          <IonInput readonly value={fullAddress}></IonInput>
        </IonItem>

        <IonItem>
          <IonIcon slot="start" icon={map} aria-hidden="true"></IonIcon>
          <IonInput readonly value={barangayId}></IonInput>
        </IonItem>

        <IonItem>
          <IonIcon slot="start" icon={mail} aria-hidden="true"></IonIcon>
          <IonInput readonly value={email}></IonInput>
        </IonItem>
      </IonList>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
    </>
  );
};

export default Page5;
