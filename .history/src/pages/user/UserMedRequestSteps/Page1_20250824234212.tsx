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
  IonNote,
  IonChip
} from '@ionic/react';
import { search, chevronForward, cube } from 'ionicons/icons';
import { Medicine } from '../../../types/medicineRequests';

interface Page1Props {
  medicines: Medicine[];
  selectedMedicine: Medicine | null;
  onMedicineSelect: (medicine: Medicine) => void;
  onNext: () => void;
  hasTooManyPendingRequests?: boolean;
  pendingRequestsCount?: number;
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
          <p>Choose from the available over-the-counter medicines in your barangay.</p>
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
            if (medicine && medicine.quantity > 0) onMedicineSelect(medicine);
          }}
        >
          <IonList>
            {filteredMedicines.map((medicine) => (
              <IonItem key={medicine.id} disabled={medicine.quantity <= 0}>
                <IonRadio slot="start" value={medicine.id} disabled={medicine.quantity <= 0} />
                <IonLabel>
                  <h3>{medicine.name}</h3>
                  <p>Type: {medicine.type}</p>
                  <IonNote><IonIcon  icon={cube}></IonIcon> {medicine.quantity} units</IonNote>
                </IonLabel>
                <IonChip color={medicine.quantity > 0 ? "primary" : "danger"} slot="end">
                  {medicine.quantity > 0 ? medicine.quantity : "Out of Stock"}
                </IonChip>
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
          disabled={!selectedMedicine || selectedMedicine.quantity <= 0}
          shape='round'
          className="ion-padding-vertical"
        >
          Next
          <IonIcon icon={chevronForward} slot="end" />
        </IonButton>
      </IonCardContent>
    </div>
  );
};

export default Page1;
