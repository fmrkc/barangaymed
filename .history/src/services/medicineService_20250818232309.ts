import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, Timestamp, addDoc } from 'firebase/firestore';
import { Medicine } from '../types/medicineRequests'; // Assuming Medicine interface is here

export class MedicineService {
  private static instance: MedicineService;

  public static getInstance(): MedicineService {
    if (!MedicineService.instance) {
      MedicineService.instance = new MedicineService();
    }
    return MedicineService.instance;
  }

  /**
   * Fetches all medicines from the 'medicines' collection.
   * @returns Promise resolving to an array of Medicine objects.
   */
  public async getAllMedicines(): Promise<Medicine[]> {
    const querySnapshot = await getDocs(collection(db, 'medicines'));
    const medicines: Medicine[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      medicines.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        expiryDate: data.expiryDate.toDate(),
        location: data.location,
        barangay: data.barangay,
        createdAt: data.createdAt?.toDate(), // Assuming createdAt and updatedAt might be missing in old data
        updatedAt: data.updatedAt?.toDate(),
      } as Medicine);
    });
    return medicines;
  }

  /**
   * Fetches medicines from the 'medicines' collection filtered by barangay.
   * @param barangay The barangay to filter by.
   * @returns Promise resolving to an array of Medicine objects.
   */
  public async getMedicinesByBarangay(barangay: string): Promise<Medicine[]> {
    const q = query(
      collection(db, 'medicines'),
      where('barangay', '==', barangay)
    );
    const querySnapshot = await getDocs(q);
    const medicines: Medicine[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      medicines.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        expiryDate: data.expiryDate.toDate(),
        location: data.location,
        barangay: data.barangay,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Medicine);
    });
    return medicines;
  }

  /**
   * Fetches a single medicine by its ID.
   * @param medicineId The ID of the medicine to fetch.
   * @returns Promise resolving to a Medicine object or null if not found.
   */
  public async getMedicineById(medicineId: string): Promise<Medicine | null> {
    const docRef = doc(db, 'medicines', medicineId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        expiryDate: data.expiryDate.toDate(),
        location: data.location,
        barangay: data.barangay,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Medicine;
    } else {
      return null;
    }
  }

  /**
   * Decrements the quantity of a medicine in the 'medicines' collection.
   * @param medicineId The ID of the medicine to update.
   * @param quantityToDecrement The amount to decrement the quantity by.
   * @returns Promise resolving when the update is complete.
   */
  public async decrementMedicineQuantity(medicineId: string, quantityToDecrement: number): Promise<void> {
    const medicineRef = doc(db, 'medicines', medicineId);
    const medicineSnap = await getDoc(medicineRef);

    if (medicineSnap.exists()) {
      const currentQuantity = medicineSnap.data().quantity;
      const newQuantity = currentQuantity - quantityToDecrement;
      await updateDoc(medicineRef, { quantity: newQuantity, updatedAt: Timestamp.now() });
    } else {
      throw new Error(`Medicine with ID ${medicineId} not found.`);
    }
  }

  /**
   * Increments the quantity of a medicine in the 'medicines' collection.
   * @param medicineId The ID of the medicine to update.
   * @param quantityToIncrement The amount to increment the quantity by.
   * @returns Promise resolving when the update is complete.
   */
  public async incrementMedicineQuantity(medicineId: string, quantityToIncrement: number): Promise<void> {
    const medicineRef = doc(db, 'medicines', medicineId);
    const medicineSnap = await getDoc(medicineRef);

    if (medicineSnap.exists()) {
      const currentQuantity = medicineSnap.data().quantity;
      const newQuantity = currentQuantity + quantityToIncrement;
      await updateDoc(medicineRef, { quantity: newQuantity, updatedAt: Timestamp.now() });
    } else {
      throw new Error(`Medicine with ID ${medicineId} not found.`);
    }
  }

  /**
   * Adds a new medicine to the 'medicines' collection.
   * @param medicine The medicine object to add.
   * @returns Promise resolving to the ID of the newly added medicine.
   */
  public async addMedicine(medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'medicines'), {
      ...medicine,
      expiryDate: Timestamp.fromDate(medicine.expiryDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  /**
   * Gets the barangay of a user from their profile.
   * @param uid The user ID to get barangay for.
   * @returns Promise resolving to an object containing user data including barangay.
   */
  public async getUserBarangay(uid: string): Promise<{ barangay: string }> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return { barangay: data.barangay || '' };
    }
    return { barangay: '' };
  }
}
