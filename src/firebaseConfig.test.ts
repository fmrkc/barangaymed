import { vi } from 'vitest';
import { auth, db, registerUserWithFullData } from './firebaseConfig';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(),
}));

describe('Firebase Configuration', () => {
  test('should export auth instance', () => {
    expect(auth).toBeDefined();
  });

  test('should export db instance', () => {
    expect(db).toBeDefined();
  });

  test('registerUserWithFullData should be defined', () => {
    expect(registerUserWithFullData).toBeDefined();
  });

  test('registerUserWithFullData should be a function', () => {
    expect(typeof registerUserWithFullData).toBe('function');
  });
});
