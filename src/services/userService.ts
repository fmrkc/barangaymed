import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export interface UserData {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  address: string;
  contactNumber: string;
  email: string;
  barangay: string;
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
          address: data.address || '',
          contactNumber: data.contactNumber || '',
          email: data.email || '',
          barangay: data.barangay || ''
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
      address: '',
      contactNumber: '',
      email: '',
      barangay: ''
    };
  }
}
