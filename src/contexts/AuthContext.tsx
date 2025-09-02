import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { logLogin, logLogout } from '../utils/logger';

// Define the shape of our auth context
interface AuthContextType {
  currentUser: FirebaseUser | null;
  userRole: string | null;
  barangayId: string | null;
  emailVerified: boolean;
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
  emailVerified: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshUserClaims: async () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [barangayId, setbarangayId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false); // Added
  const [loading, setLoading] = useState(true);

  // Function to extract claims from user
  const extractUserClaims = async (user: FirebaseUser | null) => {
    if (!user) {
      setUserRole(null);
      setbarangayId(null);
      setEmailVerified(false); // Added
      return;
    }

    try {
      const tokenResult = await getIdTokenResult(user, true); // Force refresh to get latest claims
      const claims = tokenResult.claims;
      
      setUserRole(claims.role as string || null);
      setbarangayId(claims.barangayId as string || null);
      setEmailVerified(user.emailVerified); // Added
      console.log('AuthContext: extractUserClaims - Role:', claims.role); // ADDED LOG
      
      return claims;
    } catch (error) {
      console.error('Error extracting user claims:', error);
      setUserRole(null);
      setbarangayId(null);
      setEmailVerified(false); // Added
    }
  };

  // Function to refresh user claims
  const refreshUserClaims = async () => {
    if (currentUser) {
      await currentUser.reload(); // Explicitly reload the user object
      await extractUserClaims(currentUser);
    }
  };

  // Function to handle user login
  const fetchUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.error('Failed to fetch IP address:', error);
      return 'unknown';
    }
  };

  const login = async (user: FirebaseUser) => {
    const userIP = await fetchUserIP();
    setCurrentUser(user);
    const claims = await extractUserClaims(user);
    console.log('AuthContext: login function - Role after extractUserClaims:', claims?.role); // ADDED LOG
    
    // Log the login event
    logLogin(user.uid, user.email || 'Unknown', claims?.role as string || 'Unknown', userIP);
    
    return Promise.resolve();
  };

  // Function to handle user logout
  const logout = async () => {
    try {
      // Log the logout event before signing out
      if (currentUser) {
        logLogout(currentUser.uid, currentUser.email || 'Unknown', userRole || 'Unknown');
      }
      
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserRole(null);
      setbarangayId(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload(); // Reload the user to get the latest profile data
        setCurrentUser(user);
        await extractUserClaims(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setbarangayId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    barangayId,
    emailVerified, // Added
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
