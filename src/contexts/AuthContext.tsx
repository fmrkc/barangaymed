import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { logLogin, logLogout } from '../utils/logger';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
        const role = data?.role as string | undefined;
        const barangayId = data?.barangayId as string | undefined;
        const cityMunicipalityId = data?.cityMunicipalityId as string | undefined;
        const verificationStatus = data?.verificationStatus as string | undefined;

        // Set role with fallback logic
        if (role && ['user', 'admin', 'superadmin'].includes(role)) {
          setUserRole(role);
          console.log("AuthContext: Firestore role:", role);
        } else {
          // Fallback: Check Firebase Auth custom claims for role
          const idTokenResult = await user.getIdTokenResult();
          const claimsRole = idTokenResult.claims?.role as string | undefined;

          if (claimsRole && ['user', 'admin', 'superadmin'].includes(claimsRole)) {
            setUserRole(claimsRole);
            console.log("AuthContext: Using claims role as fallback:", claimsRole);

            // Update Firestore document with role from claims
            try {
              await setDoc(doc(db, "users", user.uid), {
                role: claimsRole,
                updatedAt: new Date()
              }, { merge: true });
              console.log("AuthContext: Updated Firestore with role from claims");
            } catch (updateError) {
              console.warn("AuthContext: Failed to update Firestore with role:", updateError);
            }
          } else {
            console.warn("AuthContext: No valid role found in Firestore or claims for UID:", user.uid);
            setUserRole(null);
          }
        }

        setBarangayId(barangayId || null);
        setCityMunicipalityId(cityMunicipalityId || null);
        setVerificationStatus(verificationStatus || null);
      } else {
        console.warn("AuthContext: User doc not found in Firestore for UID:", user.uid);

        // Fallback: Check Firebase Auth custom claims
        const idTokenResult = await user.getIdTokenResult();
        const claimsRole = idTokenResult.claims?.role as string | undefined;
        const claimsBarangayId = idTokenResult.claims?.barangayId as string | undefined;
        const claimsCityMunicipalityId = idTokenResult.claims?.cityMunicipalityId as string | undefined;

        if (claimsRole && ['user', 'admin', 'superadmin'].includes(claimsRole)) {
          setUserRole(claimsRole);
          setBarangayId(claimsBarangayId || null);
          setCityMunicipalityId(claimsCityMunicipalityId || null);
          setVerificationStatus(null);

          console.log("AuthContext: Using claims as fallback for UID:", user.uid, {
            role: claimsRole,
            barangayId: claimsBarangayId,
            cityMunicipalityId: claimsCityMunicipalityId
          });

          // Create Firestore document with claims data
          try {
            await setDoc(doc(db, "users", user.uid), {
              email: user.email,
              role: claimsRole,
              barangayId: claimsBarangayId || null,
              cityMunicipalityId: claimsCityMunicipalityId || null,
              createdAt: new Date(),
              createdFromClaims: true
            });
            console.log("AuthContext: Created Firestore document from claims");
          } catch (createError) {
            console.warn("AuthContext: Failed to create Firestore document:", createError);
          }
        } else {
          console.warn("AuthContext: No valid role found in claims for UID:", user.uid);
          setUserRole(null);
          setBarangayId(null);
          setCityMunicipalityId(null);
          setVerificationStatus(null);
        }
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
