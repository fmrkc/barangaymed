import zipCodeData from '../data/philippine-zip-codes.json';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

// Interfaces (no changes)
export interface Region { code: string; name: string; }
export interface Province { code: string; name: string; regionCode: string; }
export interface CityMunicipality { code: string; name: string; provinceCode: string; regionCode: string; }
export interface Barangay { code: string; name: string; cityMunCode: string; provinceCode: string; regionCode: string; }
export interface ZipCode { zip_code: string; municipality_city: string; }
interface BarangayData { code: string; name: string; }
interface CityMunData { name: string; barangay_list: BarangayData[]; }
interface ProvinceData { name: string; municipality_list: { [key: string]: CityMunData }; }
interface RegionData { region_name: string; province_list: { [key:string]: ProvinceData }; }
interface AddressesDataType { [key: string]: RegionData; }

// Cache for parsed data
let regionsCache: Region[] = [];
let provincesCache: { [regionCode: string]: Province[] } = {};
let citiesMunicipalitiesCache: { [provinceCode: string]: CityMunicipality[] } = {};
let barangaysCache: { [cityMunCode: string]: Barangay[] } = {};

// New, more efficient caches
let barangayMap: Map<string, Barangay> = new Map();
let cityMunMap: Map<string, CityMunicipality> = new Map();
let regionMap: Map<string, string> = new Map();
let provinceMap: Map<string, string> = new Map();
let zipCodeMap: Map<string, string> = new Map(); // Maps municipality/city name to zip code

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Initialize caches from API data
async function initializeCaches() {
  if (isInitialized) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      const response = await fetch('https://us-central1-barangaymed.cloudfunctions.net/api/getPhilippineAddresses');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const addressesData = await response.json() as AddressesDataType;

      if (!addressesData) {
        console.error("Failed to load addresses data from API.");
        return;
      }

      // Process regions
      regionsCache = Object.keys(addressesData).map((regionCode: string) => ({
        code: regionCode,
        name: addressesData[regionCode].region_name,
      })).sort((a: Region, b: Region) => a.name.localeCompare(b.name));
      // Populate regionMap
      Object.keys(addressesData).forEach((regionCode: string) => {
        regionMap.set(regionCode, addressesData[regionCode].region_name);
      });

      // Process provinces, cities/municipalities, barangays
      Object.keys(addressesData).forEach((regionCode: string) => {
        const regionData = addressesData[regionCode];
        const provinceList = regionData.province_list;
        provincesCache[regionCode] = [];

        Object.keys(provinceList).forEach((provinceCode: string) => {
          const provinceData = provinceList[provinceCode];
          provincesCache[regionCode].push({
            code: provinceCode,
            name: provinceData.name,
            regionCode: regionCode,
          });
          provinceMap.set(provinceCode, provinceData.name);
          const municipalityList = provinceData.municipality_list;
          citiesMunicipalitiesCache[provinceCode] = [];

          Object.keys(municipalityList).forEach((munCode: string) => {
            const munData = municipalityList[munCode];
            const cityMun: CityMunicipality = {
              code: munCode,
              name: munData.name,
              provinceCode: provinceCode,
              regionCode: regionCode,
            };
            citiesMunicipalitiesCache[provinceCode].push(cityMun);
            cityMunMap.set(munCode, cityMun); // Populate cityMunMap

            const brgys = munData.barangay_list.map((brgy: { code: string, name: string }) => {
              const fullBrgy: Barangay = {
                ...brgy,
                cityMunCode: munCode,
                provinceCode: provinceCode,
                regionCode: regionCode,
              };
              barangayMap.set(fullBrgy.code, fullBrgy); // Populate barangayMap
              return fullBrgy;
            });
            barangaysCache[munCode] = brgys.sort((a: Barangay, b: Barangay) => a.name.localeCompare(b.name));
          });
          citiesMunicipalitiesCache[provinceCode].sort((a, b) => a.name.localeCompare(b.name));
        });
        provincesCache[regionCode].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Process zip codes from the imported JSON
      (zipCodeData as any[]).forEach(item => {
        // Normalize key for better matching
        const key = item['MUNICIPALITY/CITY'].toUpperCase();
        zipCodeMap.set(key, item['ZIPCODE']);
      });

      isInitialized = true;
    } catch (error) {
      console.error("Error initializing address caches:", error);
      isInitialized = false; // Reset on error
    } finally {
      initializationPromise = null;
    }
  })();
  return initializationPromise;
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

// Rewritten for O(1) lookup
export const getBarangayNameByCode = async (barangayCode: string): Promise<string | undefined> => {
  await initializeCaches();
  const barangay = barangayMap.get(barangayCode);
  if (!barangay) {
    console.warn(`Barangay name not found for code: ${barangayCode}`);
  }
  return barangay?.name;
};

// Rewritten for O(1) lookup
export const getZipCodeByBarangay = async (barangayCode: string): Promise<string | undefined> => {
    await initializeCaches();
    const barangay = barangayMap.get(barangayCode);
    if (!barangay) {
        console.warn(`Barangay not found for zip code lookup: ${barangayCode}`);
        return undefined;
    }
    const cityMun = cityMunMap.get(barangay.cityMunCode);
    if (!cityMun) {
        console.warn(`City/Municipality not found for barangay code: ${barangayCode}`);
        return undefined;
    }
    // Normalize key for lookup
    const zip = zipCodeMap.get(cityMun.name.toUpperCase());
    if (!zip) {
      console.warn(`Zip code not found for city: ${cityMun.name}`);
    }
    return zip;
};

// Get region name by code
export const getRegionNameByCode = async (code: string): Promise<string | undefined> => {
  await initializeCaches();
  return regionMap.get(code);
};

// Get province name by code
export const getProvinceNameByCode = async (code: string): Promise<string | undefined> => {
  await initializeCaches();
  return provinceMap.get(code);
};

// Get city/municipality name by code
export const getCityMunNameByCode = async (code: string): Promise<string | undefined> => {
  await initializeCaches();
  const cityMun = cityMunMap.get(code);
  return cityMun?.name;
};
