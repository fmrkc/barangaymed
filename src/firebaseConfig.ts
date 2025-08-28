import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

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
    
    // Add user document with full data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      name: name,
      role: role,
      createdAt: new Date(),
      ...userData
    });
    return user;
  } catch (error) {
    console.error("Registration with full data failed:", error);
    throw error;
  }
}

// Import and export the createAdmin Cloud Function
import { httpsCallable } from 'firebase/functions';
export const createAdmin = httpsCallable(functions, 'createAdmin');
