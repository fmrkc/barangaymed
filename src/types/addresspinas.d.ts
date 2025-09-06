declare module 'addresspinas' {
  export interface Region {
    reg_code: string;
    reg_name: string;
  }

  export interface Province {
    prov_code: string;
    prov_name: string;
    reg_code: string;
  }

  export interface CityMunicipality {
    mun_code: string;
    mun_name: string;
    prov_code: string;
    reg_code: string;
  }

  export interface Barangay {
    brgy_code: string;
    brgy_name: string;
    mun_code: string;
    prov_code: string;
    reg_code: string;
  }

  export const allData: {
    regions: Region[];
    provinces: Province[];
    citiesMunicipalities: CityMunicipality[];
    barangays: Barangay[];
  };

  export const address: {
    getProvinceOfRegion: (regionCode: string) => Province[];
    getCityMunOfProvince: (provinceCode: string) => CityMunicipality[];
    getBarangaysOfCityMun: (cityMunCode: string) => Barangay[];
    getZipcode: (barangayCode: string) => string | undefined;
  };
}