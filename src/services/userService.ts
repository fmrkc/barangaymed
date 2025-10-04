import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserData } from '../types/users'; // Import the shared UserData type

export class UserService {
  private static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Gets complete user data from Firestore
   * @param uid The user ID to get data for
   * @returns Promise resolving to UserData object
   */
  public async getUserData(uid: string): Promise<UserData> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
      return {
        firstName: data.firstName || '',
        middleName: data.middleName || '',
        lastName: data.lastName || '',
        suffix: data.suffix || '',
        birthdate: data.birthdate || '',
        gender: data.gender || '',
        lotBlkHouseNo: data.lotBlkHouseNo || '',
        streetName: data.streetName || '',
        subdivisionVillageZonePurok: data.subdivisionVillageZonePurok || '',
        zipCode: data.zipCode || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        barangayId: data.barangayId || '',
        selectedRegion: data.selectedRegion || '',
        selectedProvince: data.selectedProvince || '',
        selectedCityMunicipality: data.selectedCityMunicipality || '',
        idVerificationUrl: data.idVerificationUrl || '',
        idVerificationType: data.idVerificationType || '',
        address: data.address || ''
      };
      }
      return this.getEmptyUserData();
    } catch (error) {
      console.error('Error fetching user data:', error);
      return this.getEmptyUserData();
    }
  }

  /**
   * Returns empty user data structure
   * @returns Empty UserData object
   */
  private getEmptyUserData(): UserData {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      birthdate: '',
      gender: '',
      lotBlkHouseNo: '',
      streetName: '',
      subdivisionVillageZonePurok: '',
      zipCode: '',
      contactNumber: '',
      email: '',
      barangayId: '',
      selectedRegion: '',
      selectedProvince: '',
      selectedCityMunicipality: '',
      idVerificationUrl: '',
      idVerificationType: '',
      address: ''
    };
  }

  /**
   * Gets all users in a specific barangay
   * @param barangayId The barangay to filter users by
   * @returns Promise resolving to array of user IDs and emails
   */
  public async getUsersByBarangay(barangayId: string): Promise<{ uid: string; email: string }[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('barangayId', '==', barangayId)
      );
      const querySnapshot = await getDocs(q);
      const users: { uid: string; email: string }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          email: data.email || ''
        });
      });
      return users;
    } catch (error) {
      console.error('Error fetching users by barangay:', error);
      return [];
    }
  }
}
