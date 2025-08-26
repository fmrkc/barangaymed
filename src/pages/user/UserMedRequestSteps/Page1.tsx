import React from 'react';
import { useHistory } from 'react-router-dom';
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
import { search, chevronForward, cube, open } from 'ionicons/icons';
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
  onNext,
  hasTooManyPendingRequests = false,
  pendingRequestsCount = 0
}) => {
  const history = useHistory();
  const [searchText, setSearchText] = React.useState('');

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      

      <IonCardContent>
        {hasTooManyPendingRequests ? (
          <div style={{ height: '85vh', justifyContent: 'center', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
          
          
                                <p>You currently have <IonText style={{ fontWeight: 'bold' }} color={'primary'}>{pendingRequestsCount}</IonText> pending request/s. Please check your current pending requests for more information!</p>
                                <IonButton className='ion-padding-vertical' shape='round' expand='block' onClick={() => history.push('/user/dashboard/requests/requests_medicine')} >
                                  View My Pending Request/s
                                  <IonIcon slot="end" icon={open} />
                                </IonButton>
                              </div>
        ) : (
          <>
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
                    </IonLabel>
                    <IonChip color={medicine.quantity > 0 ? "primary" : "danger"} slot="end">
                      In stock: {medicine.quantity > 0 ? medicine.quantity : "0"}
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
          </>
        )}
      </IonCardContent>
    </div>
  );
};

export default Page1;
