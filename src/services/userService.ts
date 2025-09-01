import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface UserData {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  lotBlkHouseNo: string;
  streetName: string;
  subdivisionVillageZonePurok: string;
  zipCode: string;
  contactNumber: string;
  email: string;
  barangayId: string;
  address: string;
}

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
        lotBlkHouseNo: data.lotBlkHouseNo || '',
        streetName: data.streetName || '',
        subdivisionVillageZonePurok: data.subdivisionVillageZonePurok || '',
        zipCode: data.zipCode || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        barangayId: data.barangayId || '',
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
      lotBlkHouseNo: '',
      streetName: '',
      subdivisionVillageZonePurok: '',
      zipCode: '',
      contactNumber: '',
      email: '',
      barangayId: '',
      address: ''
    };
  }

  /**
   * Gets all users in a specific barangay
   * @param barangay The barangay to filter users by
   * @returns Promise resolving to array of user IDs and emails
   */
  public async getUsersByBarangay(barangay: string): Promise<{ uid: string; email: string }[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('barangayId', '==', barangay)
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
