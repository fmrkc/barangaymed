
import zipCodeData from '../data/philippine-zip-codes.json';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export interface Region {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  regionCode: string;
}

export interface CityMunicipality {
  code: string;
  name: string;
  provinceCode: string;
  regionCode: string;
}

export interface Barangay {
  code: string;
  name: string;
  cityMunCode: string;
  provinceCode: string;
  regionCode: string;
}

export interface ZipCode {
  zip_code: string;
  municipality_city: string;
}

interface BarangayData {
  code: string;
  name: string;
}

interface CityMunData {
  name: string;
  barangay_list: BarangayData[];
}

interface ProvinceData {
  name: string;
  municipality_list: { [key: string]: CityMunData };
}

interface RegionData {
  region_name: string;
  province_list: { [key: string]: ProvinceData };
}

interface AddressesDataType {
  [key: string]: RegionData;
}

// Cache for parsed data
let regionsCache: Region[] = [];
let provincesCache: { [regionCode: string]: Province[] } = {};
let citiesMunicipalitiesCache: { [provinceCode: string]: CityMunicipality[] } = {};
let barangaysCache: { [cityMunCode: string]: Barangay[] } = {};
let zipCodeMap: { [municipalityCity: string]: string } = {};

let addressesData: AddressesDataType | null = null; // Will be populated from API

// Initialize caches from API data
async function initializeCaches() {
  if (regionsCache.length > 0) return; // Already initialized

  try {
    const response = await fetch('https://us-central1-barangaymed.cloudfunctions.net/api/getPhilippineAddresses');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    addressesData = await response.json() as AddressesDataType;

    if (!addressesData) {
      console.error("Failed to load addresses data from API.");
      return;
    }

    // Process regions
        regionsCache = Object.keys(addressesData!).map((regionCode: string) => ({
      code: regionCode,
      name: addressesData![regionCode].region_name,
    })).sort((a: Region, b: Region) => a.name.localeCompare(b.name));

    // Process provinces, cities/municipalities, barangays
    Object.keys(addressesData!).forEach((regionCode: string) => {
      const regionData = addressesData![regionCode];
      const provinceList = regionData.province_list;
      provincesCache[regionCode] = [];

      Object.keys(provinceList).forEach((provinceCode: string) => {
        const provinceData = provinceList[provinceCode];
        provincesCache[regionCode].push({
          code: provinceCode,
          name: provinceData.name,
          regionCode: regionCode,
        });
        const municipalityList = provinceData.municipality_list;
        citiesMunicipalitiesCache[provinceCode] = [];

        Object.keys(municipalityList).forEach((munCode: string) => {
          const munData = municipalityList[munCode];
          citiesMunicipalitiesCache[provinceCode].push({
            code: munCode,
            name: munData.name,
            provinceCode: provinceCode,
            regionCode: regionCode,
          });
          barangaysCache[munCode] = munData.barangay_list.map((brgy: { code: string, name: string }) => ({
            ...brgy,
            cityMunCode: munCode,
            provinceCode: provinceCode,
            regionCode: regionCode,
          })).sort((a: Barangay, b: Barangay) => a.name.localeCompare(b.name));
        });
        citiesMunicipalitiesCache[provinceCode].sort((a, b) => a.name.localeCompare(b.name));
      });
      provincesCache[regionCode].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Process zip codes
    (zipCodeData as any[]).forEach(item => {
      zipCodeMap[item['MUNICIPALITY/CITY']] = item['ZIPCODE'];
    });
  } catch (error) {
    console.error("Error initializing address caches:", error);
  }
}

export const getRegions = async (): Promise<Region[]> => {
  await initializeCaches();
  return regionsCache;
};

export const getProvincesByRegion = async (regionCode: string): Promise<Province[]> => {
  await initializeCaches();
  return provincesCache[regionCode] || [];
};

export const getCitiesMunicipalitiesByProvince = async (provinceCode: string): Promise<CityMunicipality[]> => {
  await initializeCaches();
  return citiesMunicipalitiesCache[provinceCode] || [];
};

export const getBarangaysByCityMunicipality = async (cityMunCode: string): Promise<Barangay[]> => {
  await initializeCaches();
  return barangaysCache[cityMunCode] || [];
};

export const getZipCodeByBarangay = async (barangayCode: string): Promise<string | undefined> => {
    await initializeCaches();

    let cityMunCode = '';
    for (const code in barangaysCache) {
        if (barangaysCache[code].some(b => b.code === barangayCode)) {
            cityMunCode = code;
            break;
        }
    }

    if (cityMunCode) {
        for (const provCode in citiesMunicipalitiesCache) {
            const cityMun = citiesMunicipalitiesCache[provCode].find(c => c.code === cityMunCode);
            if (cityMun) {
                return zipCodeMap[cityMun.name];
            }
        }
    }

    console.warn(`Zip code not found for barangay code: ${barangayCode}`);
    return undefined;
};
''