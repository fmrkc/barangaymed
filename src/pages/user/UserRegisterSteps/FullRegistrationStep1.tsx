import React, { useState, useEffect } from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText, IonCardTitle, IonSelect, IonSelectOption, IonCardSubtitle, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { call, home } from 'ionicons/icons';
import { getRegions, getProvincesByRegion, getCitiesMunicipalitiesByProvince, Region, Province, CityMunicipality } from '../../../services/addressService';

interface FullRegistrationStep1Props {
  lotBlkHouseNo: string;
  streetName: string;
  subdivisionVillageZonePurok: string;
  contactNumber: string;
  selectedRegion: string;
  selectedProvince: string;
  selectedCityMunicipality: string;
  onChange: (field: string, value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  error: string | null;
}

const FullRegistrationStep1: React.FC<FullRegistrationStep1Props> = ({
  lotBlkHouseNo,
  streetName,
  subdivisionVillageZonePurok,
  contactNumber,
  selectedRegion,
  selectedProvince,
  selectedCityMunicipality,
  onChange,
  error,
}) => {


  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState<CityMunicipality[]>([]);

    useEffect(() => {
    const loadRegions = async () => {
      setRegions(await getRegions());
    };
    loadRegions();
  }, []);

    useEffect(() => {
    const loadProvinces = async () => {
      if (selectedRegion) {
        const provincesData = await getProvincesByRegion(selectedRegion);
        setProvinces(provincesData);
        // Clear dependent selections if region changes
        if (selectedProvince && !provincesData.some(p => p.code === selectedProvince)) {
          onChange('selectedProvince', '');
          onChange('selectedCityMunicipality', '');
        }
      } else {
        setProvinces([]);
        onChange('selectedProvince', '');
        onChange('selectedCityMunicipality', '');
      }
    };
    loadProvinces();
  }, [selectedRegion, selectedProvince, onChange]);

    useEffect(() => {
    const loadCitiesMunicipalities = async () => {
      if (selectedProvince) {
        const citiesMunicipalitiesData = await getCitiesMunicipalitiesByProvince(selectedProvince);
        setCitiesMunicipalities(citiesMunicipalitiesData);
        // Clear dependent selections if province changes
        if (selectedCityMunicipality && !citiesMunicipalitiesData.some(c => c.code === selectedCityMunicipality)) {
          onChange('selectedCityMunicipality', '');
        }
      } else {
        setCitiesMunicipalities([]);
        onChange('selectedCityMunicipality', '');
      }
    };
    loadCitiesMunicipalities();
  }, [selectedProvince, selectedCityMunicipality, onChange]);

  return (
    <>
      <IonCardTitle className="ion-padding-vertical">
        Step 3: Enter your address and contact number.
      </IonCardTitle>

      <IonItem className="ion-margin-top">
        <IonLabel position="stacked">Region *</IonLabel>
        <IonSelect
          key={regions.length}
          fill="outline"
          value={selectedRegion}
          placeholder="Select Region"
          onIonChange={(e) => onChange('selectedRegion', e.detail.value!)}
          interface="popover"
          className={`${!selectedRegion && 'ion-invalid ion-touched'}`}
        >
          {regions.map((region) => (
            <IonSelectOption key={region.code} value={region.code}>
              {region.name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      <IonItem className="ion-margin-top">
        <IonLabel position="stacked">Province *</IonLabel>
        <IonSelect
          key={provinces.length}
          fill="outline"
          value={selectedProvince}
          placeholder="Select Province"
          onIonChange={(e) => onChange('selectedProvince', e.detail.value!)}
          disabled={!selectedRegion}
          interface="popover"
          className={`${!selectedProvince && 'ion-invalid ion-touched'}`}
        >
          {provinces.map((province) => (
            <IonSelectOption key={province.code} value={province.code}>
              {province.name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      <IonItem className="ion-margin-top">
        <IonLabel position="stacked">City/Municipality *</IonLabel>
        <IonSelect
          key={citiesMunicipalities.length}
          fill="outline"
          value={selectedCityMunicipality}
          placeholder="Select City/Municipality"
          onIonChange={(e) => onChange('selectedCityMunicipality', e.detail.value!)}
          disabled={!selectedProvince}
          interface="popover"
          className={`${!selectedCityMunicipality && 'ion-invalid ion-touched'}`}
        >
          {citiesMunicipalities.map((cityMun) => (
            <IonSelectOption key={cityMun.code} value={cityMun.code}>
              {cityMun.name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      <div className="ion-margin-top">
        <IonCardSubtitle>Lot/Blk/House No. (optional)</IonCardSubtitle>
        <IonInput
          placeholder="Blk 12, Lot 7"
          fill="outline"
          value={lotBlkHouseNo}
          onIonChange={(e) => onChange("lotBlkHouseNo", e.detail.value!)}
          autocomplete="address-line1"
        >
          <IonIcon slot="start" icon={home}></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Street Name *</IonCardSubtitle>
        <IonInput
          placeholder="Mabini Street"
          fill="outline"
          value={streetName}
          onIonChange={(e) => onChange("streetName", e.detail.value!)}
          className={`${!streetName.trim() && 'ion-invalid ion-touched'}`}
          errorText="Street name is required"
          autocomplete="address-line2"
        >
          <IonIcon slot="start" icon={home}></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Subdivision/Village/Zone/Purok (optional)</IonCardSubtitle>
        <IonInput
          placeholder="Purok 3"
          fill="outline"
          value={subdivisionVillageZonePurok}
          onIonChange={(e) => onChange("subdivisionVillageZonePurok", e.detail.value!)}
          autocomplete="address-line3"
        >
          <IonIcon slot="start" icon={home}></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Contact Number *</IonCardSubtitle>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ padding: '0 10px', fontWeight: 'bold', fontSize: '1.2em' }}>+63</div>
          <IonInput
            fill="outline"
            value={contactNumber}
            onIonInput={(e) => {
              let val = e.detail.value || '';
              // Ensure the first digit is 9 and only digits allowed
              if (val.length === 1 && val !== '9') {
                val = '';
              }
              val = val.replace(/[^0-9]/g, '');
              onChange("contactNumber", val);
            }}
            placeholder="9XX XXX XXXX"
            maxlength={10}
            minlength={10}
            inputmode="numeric"
            pattern="[9][0-9]{9}"
            className={`${(!contactNumber || contactNumber.length !== 10) && 'ion-invalid ion-touched'}`}
            errorText="Contact number must start with 9 and be 10 digits long"
            autocomplete="tel"
          >
            <IonIcon slot="start" icon={call}></IonIcon>
          </IonInput>
        </div>
      </div>
    </>
  );
};

export default FullRegistrationStep1;
