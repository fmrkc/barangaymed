import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth, getUserRole } from '../firebaseConfig';
import { logLogin, logLogout } from '../utils/logger';

// Define the shape of our auth context
interface AuthContextType {
  currentUser: FirebaseUser | null;
  userRole: string | null;
  loading: boolean;
  login: (user: FirebaseUser) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    const role = await getUserRole(user.uid);
    setUserRole(role);
    
    // Log the login event
    logLogin(user.uid, user.email || 'Unknown', role || 'Unknown', userIP);
    
    // Wait until role is set before resolving
    return new Promise<void>((resolve) => {
      const checkRole = () => {
        if (role) {
          resolve();
        } else {
          setTimeout(checkRole, 50);
        }
      };
      checkRole();
    });
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
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload(); // Reload the user to get the latest profile data
        console.log('User object after reload:', user);
        setCurrentUser(user);
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    logout,
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
