import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { logLogin, logLogout } from '../utils/logger';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { executeWithRetry, logFirestoreError } from '../utils/firestoreErrorHandler';

// Define the shape of our auth context
interface AuthContextType {
  currentUser: FirebaseUser | null;
  userRole: string | null;
  barangayId: string | null;
  cityMunicipalityId: string | null;
  emailVerified: boolean;
  verificationStatus: string | null;
  rejectionReason: string | null;
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
  rejectionReason: null,
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
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to extract user data from Firestore with retry logic
  const extractUserData = async (user: FirebaseUser | null) => {
    if (!user) {
      setUserRole(null);
      setBarangayId(null);
      setCityMunicipalityId(null);
      setEmailVerified(false);
      setVerificationStatus(null);
      setRejectionReason(null);
      return;
    }

    try {
      setEmailVerified(user.emailVerified);

      // Fetch role, barangayId, cityMunicipalityId, verificationStatus from Firestore with retry
      const fetchUserDoc = async () => {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        return userDoc;
      };

      const userDoc = await executeWithRetry(
        fetchUserDoc,
        `getUserDoc-${user.uid}`,
        { maxRetries: 3 },
        { userId: user.uid, operation: 'extractUserData' }
      );

      const idTokenResult = await user.getIdTokenResult(true);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const role = data?.role as string | undefined;
        const barangayId = data?.barangayId as string | undefined;
        const cityMunicipalityId = data?.cityMunicipalityId as string | undefined;
        const verificationStatus = data?.verificationStatus as string | undefined;
        const rejectionReason = data?.rejectionReason as string | undefined;

        const claimsVerificationStatus = idTokenResult.claims?.verificationStatus as string | undefined;

        // Set role with fallback logic
        if (role && ['user', 'admin', 'superadmin'].includes(role)) {
          setUserRole(role);
          console.log("AuthContext: Firestore role:", role);
        } else {
          // Fallback: Check Firebase Auth custom claims for role
          const claimsRole = idTokenResult.claims?.role as string | undefined;

          if (claimsRole && ['user', 'admin', 'superadmin'].includes(claimsRole)) {
            setUserRole(claimsRole);
            console.log("AuthContext: Using claims role as fallback:", claimsRole);

            // Update Firestore document with role from claims with retry
            const updateFirestoreRole = async () => {
              await setDoc(doc(db, "users", user.uid), {
                role: claimsRole,
                updatedAt: new Date()
              }, { merge: true });
            };

            try {
              await executeWithRetry(
                updateFirestoreRole,
                `updateUserRole-${user.uid}`,
                { maxRetries: 2 },
                { userId: user.uid, operation: 'updateUserRole' }
              );
              console.log("AuthContext: Updated Firestore with role from claims");
            } catch (updateError) {
              logFirestoreError('updateUserRole', updateError, {
                userId: user.uid,
                operation: 'updateUserRole'
              });
              console.warn("AuthContext: Failed to update Firestore with role:", updateError);
            }
          } else {
            console.warn("AuthContext: No valid role found in Firestore or claims for UID:", user.uid);
            setUserRole(null);
          }
        }

        setBarangayId(barangayId || null);
        setCityMunicipalityId(cityMunicipalityId || null);
        setVerificationStatus(claimsVerificationStatus || verificationStatus || null);
        setRejectionReason(rejectionReason || null);
      } else {
        console.warn("AuthContext: User doc not found in Firestore for UID:", user.uid);

        // Fallback: Check Firebase Auth custom claims
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

          // Create Firestore document with claims data with retry
          const createUserDoc = async () => {
            await setDoc(doc(db, "users", user.uid), {
              email: user.email,
              role: claimsRole,
              barangayId: claimsBarangayId || null,
              cityMunicipalityId: claimsCityMunicipalityId || null,
              createdAt: new Date(),
              createdFromClaims: true,
              verificationStatus: 'unverified'
            });
          };

          try {
            await executeWithRetry(
              createUserDoc,
              `createUserDoc-${user.uid}`,
              { maxRetries: 2 },
              { userId: user.uid, operation: 'createUserDoc' }
            );
            console.log("AuthContext: Created Firestore document from claims");
          } catch (createError) {
            logFirestoreError('createUserDoc', createError, {
              userId: user.uid,
              operation: 'createUserDoc'
            });
            console.warn("AuthContext: Failed to create Firestore document:", createError);
          }
        } else {
          console.warn("AuthContext: No valid role found in claims for UID:", user.uid);
          setUserRole(null);
          setBarangayId(null);
          setCityMunicipalityId(null);
          setVerificationStatus(null);
          setRejectionReason(null);
        }
      }
    } catch (error) {
      logFirestoreError('extractUserData', error, {
        userId: user.uid,
        operation: 'extractUserData'
      });
      console.error("Error extracting user data:", error);
      setUserRole(null);
      setBarangayId(null);
      setCityMunicipalityId(null);
      setEmailVerified(false);
      setVerificationStatus(null);
      setRejectionReason(null);
    }
  };

  // Function to refresh user data manually
  const refreshUserClaims = async () => {
    if (currentUser) {
      try {
        await currentUser.reload();
        await extractUserData(currentUser);
      } catch (error) {
        logFirestoreError('refreshUserClaims', error, {
          userId: currentUser.uid,
          operation: 'refreshUserClaims'
        });
        console.error("Error refreshing user claims:", error);
      }
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
    try {
      const userIP = await fetchUserIP();
      setCurrentUser(user);
      await extractUserData(user);

      logLogin(user.uid, user.email || "Unknown", userRole || "Unknown", userIP);
    } catch (error) {
      logFirestoreError('login', error, {
        userId: user.uid,
        operation: 'login'
      });
      console.error("Error during login:", error);
    }
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
      setRejectionReason(null);
    } catch (error) {
      logFirestoreError('logout', error, {
        userId: currentUser?.uid,
        operation: 'logout'
      });
      console.error("Logout error:", error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
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
          setRejectionReason(null);
        }
      } catch (error) {
        logFirestoreError('onAuthStateChanged', error, {
          operation: 'onAuthStateChanged'
        });
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
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
    rejectionReason,
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
