import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { logLogin, logLogout } from '../utils/logger';
import { doc, getDoc } from 'firebase/firestore';

// Define the shape of our auth context
interface AuthContextType {
  currentUser: FirebaseUser | null;
  userRole: string | null;
  barangayId: string | null;
  cityMunicipalityId: string | null;
  emailVerified: boolean;
  verificationStatus: string | null;
  loading: boolean;
  login: (user: FirebaseUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserClaims: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  barangayId: null,
  cityMunicipalityId: null,
  emailVerified: false,
  verificationStatus: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshUserClaims: async () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [barangayId, setBarangayId] = useState<string | null>(null);
  const [cityMunicipalityId, setCityMunicipalityId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to extract user data from Firestore
  const extractUserData = async (user: FirebaseUser | null) => {
    if (!user) {
      setUserRole(null);
      setBarangayId(null);
      setCityMunicipalityId(null);
      setEmailVerified(false);
      setVerificationStatus(null);
      return;
    }

    try {
      setEmailVerified(user.emailVerified);

      // Fetch role, barangayId, cityMunicipalityId, verificationStatus from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role || null);
        setBarangayId(data.barangayId || null);
        setCityMunicipalityId(data.cityMunicipalityId || null);
        setVerificationStatus(data.verificationStatus || null);

        console.log("AuthContext: Firestore role:", data.role);
      } else {
        console.warn("AuthContext: User doc not found in Firestore for UID:", user.uid);
        setUserRole(null);
        setBarangayId(null);
        setCityMunicipalityId(null);
        setVerificationStatus(null);
      }
    } catch (error) {
      console.error("Error extracting user data:", error);
      setUserRole(null);
      setBarangayId(null);
      setCityMunicipalityId(null);
      setEmailVerified(false);
      setVerificationStatus(null);
    }
  };

  // Function to refresh user data manually
  const refreshUserClaims = async () => {
    if (currentUser) {
      await currentUser.reload();
      await extractUserData(currentUser);
    }
  };

  // Function to handle user login
  const fetchUserIP = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "unknown";
    } catch (error) {
      console.error("Failed to fetch IP address:", error);
      return "unknown";
    }
  };

  const login = async (user: FirebaseUser) => {
    const userIP = await fetchUserIP();
    setCurrentUser(user);
    await extractUserData(user);

    logLogin(user.uid, user.email || "Unknown", userRole || "Unknown", userIP);
    return Promise.resolve();
  };

  // Function to handle user logout
  const logout = async () => {
    try {
      if (currentUser) {
        logLogout(currentUser.uid, currentUser.email || "Unknown", userRole || "Unknown");
      }

      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setBarangayId(null);
      setCityMunicipalityId(null);
      setVerificationStatus(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        setCurrentUser(user);
        await extractUserData(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setBarangayId(null);
        setCityMunicipalityId(null);
        setVerificationStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    barangayId,
    cityMunicipalityId,
    emailVerified,
    verificationStatus,
    loading,
    login,
    logout,
    refreshUserClaims,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};