import React, { useState, useEffect } from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText, IonCardTitle, IonSelect, IonSelectOption, IonCardSubtitle, IonIcon } from '@ionic/react';
import { arrowBack, arrowForward, call, chevronBack, chevronBackCircle, chevronForward, home, phoneLandscape } from 'ionicons/icons';
import { MaskitoOptions, maskitoTransform } from '@maskito/core';
import { useMaskito } from '@maskito/react';
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
}) => {
  const phoneMaskOptions: MaskitoOptions = {
    mask: ['+', '(', '6', '3', ')', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/],
  };
  const phoneMask = useMaskito({ options: phoneMaskOptions });

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
        Step 2: Enter your address and contact number.
      </IonCardTitle>

      <div className="ion-margin-top">
        <IonCardSubtitle>Region *</IonCardSubtitle>
        <IonSelect
          fill="outline"
          value={selectedRegion}
          placeholder="Select Region"
          onIonChange={(e) => onChange('selectedRegion', e.detail.value!)}
        >
          {regions.map((region) => (
            <IonSelectOption key={region.code} value={region.code}>
              {region.name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Province *</IonCardSubtitle>
        <IonSelect
          fill="outline"
          value={selectedProvince}
          placeholder="Select Province"
          onIonChange={(e) => onChange('selectedProvince', e.detail.value!)}
          disabled={!selectedRegion}
        >
          {provinces.map((province) => (
            <IonSelectOption key={province.code} value={province.code}>
              {province.name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>City/Municipality *</IonCardSubtitle>
        <IonSelect
          fill="outline"
          value={selectedCityMunicipality}
          placeholder="Select City/Municipality"
          onIonChange={(e) => onChange('selectedCityMunicipality', e.detail.value!)}
          disabled={!selectedProvince}
        >
          {citiesMunicipalities.map((cityMun) => (
            <IonSelectOption key={cityMun.code} value={cityMun.code}>
              {cityMun.name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Lot/Blk/House No. (optional)</IonCardSubtitle>
        <IonInput
          placeholder="Blk 12, Lot 7"
          fill="outline"
          value={lotBlkHouseNo}
          onIonChange={(e) => onChange("lotBlkHouseNo", e.detail.value!)}
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
        >
          <IonIcon slot="start" icon={home}></IonIcon>
        </IonInput>
      </div>

      <div className="ion-margin-top">
        <IonCardSubtitle>Contact Number *</IonCardSubtitle>
        <IonInput
          ref={(phoneInput) => {
            if (phoneInput) {
              phoneInput.getInputElement().then((input) => {
                phoneMask(input);
              });
            }
          }}
          fill="outline"
          value={contactNumber}
          onIonInput={(e) => onChange("contactNumber", e.detail.value || "")}
          placeholder="+(63) 123-456-7890"
        >
          <IonIcon slot="start" icon={call}></IonIcon>
        </IonInput>
      </div>
    </>
  );
};

export default FullRegistrationStep1;
