import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { LogService } from './services/logService';

const config = {
  apiKey: "AIzaSyC-xkTe-o0WJcWU-NUIwdEQaxONfpMfAFc",
  authDomain: "barangaymed.firebaseapp.com",
  projectId: "barangaymed",
  storageBucket: "barangaymed.firebasestorage.app",
  messagingSenderId: "18633162801",
  appId: "1:18633162801:web:33c02d2c7996b44a31d510",
  measurementId: "G-0FYYQVYQ6Z"
};

const firebaseApp = initializeApp(config);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);

export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

export async function register(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
}

// New function to register user and add role to Firestore
export async function registerUserWithRole(email: string, password: string, role: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Add user document with role in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: role,
      createdAt: new Date()
    });
    return user;
  } catch (error) {
    console.error("Registration with role failed:", error);
    throw error;
  }
}

export async function registerUserWithFullData(
email: string, password: string, name: string, role: string, userData: { [key: string]: any; }) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Set display name in Firebase Auth
    await updateProfile(user, { displayName: name });
    
    // Create combined address string
    const addressParts = [];
    if (userData.lotBlkHouseNo) addressParts.push(`${userData.lotBlkHouseNo}`);
    if (userData.streetName) addressParts.push(`${userData.streetName}`);
    if (userData.subdivisionVillageZonePurok) addressParts.push(`${userData.subdivisionVillageZonePurok}`);
    addressParts.push(`${userData.barangay}`); // Barangay is required
    addressParts.push('Floridablanca'); // Fixed value
    addressParts.push('Pampanga'); // Fixed value
    if (userData.zipCode) addressParts.push(`${userData.zipCode}`);
    
    const combinedAddress = addressParts.join(', ');

    // Add user document with full data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      name: name,
      role: role,
      createdAt: serverTimestamp(),
      ...userData,
      address: combinedAddress // Add the combined address
    });

    // Log registration event using LogService BEFORE signing out
    const logService = LogService.getInstance();
    const logEntry = {
      action: "UserRegistration",
      userId: user.uid,
      userEmail: email,
      userName: name, // Use the 'name' parameter passed to the function
      role: role, // Use the 'role' parameter passed to the function
      details: {
        barangay: userData.barangay, // Access from userData
        contactNumber: userData.contactNumber, // Access from userData
        address: combinedAddress, // Use the combined address
        lotBlkHouseNo: userData.lotBlkHouseNo,
        streetName: userData.streetName,
        subdivisionVillageZonePurok: userData.subdivisionVillageZonePurok,
        zipCode: userData.zipCode
      }
    };
    console.log("Log Entry being sent to Cloud Function:", JSON.stringify(logEntry));
    await logService.logActivity(logEntry);

    await signOut(auth); // Sign out the user immediately after registration

    return user;
  } catch (error) {
    console.error("Registration with full data failed:", error);
    throw error;
  }
}

// Import and export the createAdmin Cloud Function
export const createAdmin = httpsCallable(functions, 'createAdmin');
