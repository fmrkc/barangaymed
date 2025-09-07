
import React, { useState, useEffect } from 'react';
import { IonButton, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonLabel, IonText, IonCardSubtitle, IonCardTitle, IonIcon } from '@ionic/react';
import { getBarangaysByCityMunicipality, getZipCodeByBarangay, Barangay } from '../../../services/addressService';
import { arrowBack, arrowForward, cloudUpload } from 'ionicons/icons';

interface FullRegistrationStep2Props {
  barangayId: string;
  selectedCityMunicipality: string;
  onAddressChange: (barangayCode: string, zipCode: string) => void;
  error: string | null;
}

const FullRegistrationStep2: React.FC<FullRegistrationStep2Props> = ({ barangayId, selectedCityMunicipality, onAddressChange, error }) => {
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  useEffect(() => {
    const loadBarangays = async () => {
      if (selectedCityMunicipality) {
        try {
          const barangaysData = await getBarangaysByCityMunicipality(selectedCityMunicipality);
          setBarangays(barangaysData);
        } catch (error) {
          console.error('Error loading barangays:', error);
          setBarangays([]);
        }
      } else {
        setBarangays([]);
      }
    };
    loadBarangays();
  }, [selectedCityMunicipality]);

  const handleBarangayChange = async (brgyCode: string) => {
    try {
      const zipCode = await getZipCodeByBarangay(brgyCode);

      onAddressChange(brgyCode, zipCode ?? '');
    } catch (error) {
      console.error('Error fetching zip code:', error);
      onAddressChange(brgyCode, '');
    }
  };

  return (
    <>
      <IonCardTitle className="ion-padding-vertical">
        Step 4: Select your Barangay.
      </IonCardTitle>
    
      <IonGrid>
        <IonRow className="ion-justify-content-center ion-margin-bottom">
          <IonCol size="12" sizeMd="6" className="ion-text-center">
            <IonSelect
              label='Barangay'
              value={barangayId}
              placeholder="Select Barangay"
              onIonChange={e => handleBarangayChange(e.detail.value)}
              className={`${!barangayId.trim() && 'ion-invalid ion-touched'}`}
              disabled={!selectedCityMunicipality}
            >
              {barangays.map((brgy) => (
                <IonSelectOption key={brgy.code} value={brgy.code}>
                  {brgy.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonCol>
        </IonRow>
        <IonRow className="ion-justify-content-center ion-margin-bottom">
          <IonCol size="12" sizeMd="6" className="ion-text-center">
            <IonButton shape='round' expand="block">
              <IonIcon icon={cloudUpload} slot="start" />
              Barangay I.D.
            </IonButton>
          </IonCol>
        </IonRow>
       
        <IonRow className="ion-justify-content-center ion-margin-bottom">
          <IonCol size="12" sizeMd="6" className="ion-text-center">
            <IonButton shape='round' expand="block">
              <IonIcon icon={cloudUpload} slot="start" />
              Barangay Certificate
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default FullRegistrationStep2;
