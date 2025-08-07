import React from 'react';
import {
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonSearchbar,
  IonText,
  IonBadge,
  IonButton,
  IonIcon,
  IonNote
} from '@ionic/react';
import { search, chevronForward } from 'ionicons/icons';
import { Medicine } from '../../../types/medicineRequests';

interface Page1Props {
  medicines: Medicine[];
  selectedMedicine: Medicine | null;
  onMedicineSelect: (medicine: Medicine) => void;
  onNext: () => void;
}

const Page1: React.FC<Page1Props> = ({
  medicines,
  selectedMedicine,
  onMedicineSelect,
  onNext
}) => {
  const [searchText, setSearchText] = React.useState('');

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <IonCardHeader>
        <IonCardTitle>Step 1: Select Medicine</IonCardTitle>
        <IonText color="medium">
          <p>Choose from available medicines in your barangay</p>
        </IonText>
      </IonCardHeader>

      <IonCardContent>
        <IonSearchbar
          value={searchText}
          onIonChange={(e) => setSearchText(e.detail.value!)}
          placeholder="Search medicines..."
          className="ion-margin-bottom"
        />

        <IonRadioGroup
          value={selectedMedicine?.id}
          onIonChange={(e) => {
            const medicine = medicines.find(m => m.id === e.detail.value);
            if (medicine) onMedicineSelect(medicine);
          }}
        >
          <IonList>
            {filteredMedicines.map((medicine) => (
              <IonItem key={medicine.id}>
                <IonRadio slot="start" value={medicine.id} />
                <IonLabel>
                  <h3>{medicine.name}</h3>
                  <p>Type: {medicine.type}</p>
                  <IonNote>Available: {medicine.quantity} units</IonNote>
                </IonLabel>
                <IonBadge color="primary" slot="end">
                  {medicine.quantity}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        </IonRadioGroup>

        {filteredMedicines.length === 0 && (
          <IonText color="medium" className="ion-text-center">
            <p>No medicines found</p>
          </IonText>
        )}

        <IonButton
          expand="block"
          onClick={onNext}
          disabled={!selectedMedicine}
          className="ion-margin-top"
        >
          Next
          <IonIcon icon={chevronForward} slot="end" />
        </IonButton>
      </IonCardContent>
    </div>
  );
};

export default Page1;
