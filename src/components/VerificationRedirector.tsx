import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerificationRedirector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userRole, verificationStatus, loading } = useAuth();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (loading || !currentUser) {
      return; // Wait for loading to complete or if no user is logged in
    }

    const currentPath = location.pathname;

    // Define paths that this component should manage
    const userVerificationPaths = [
      '/user/pending-verification',
      '/user/rejected-verification',
      '/user/complete-profile',
    ];

    // --- Redirection Logic for 'user' role ---
    if (userRole === 'user') {
      if (verificationStatus === 'rejected') {
        if (currentPath !== '/user/rejected-verification') {
          history.push('/user/rejected-verification');
        }
      } else if (verificationStatus === 'pending') {
        if (currentPath !== '/user/pending-verification') {
          history.push('/user/pending-verification');
        }
      } else if (verificationStatus === null || verificationStatus === undefined || verificationStatus === 'unverified') {
        // User has not completed profile or is unverified
        if (currentPath !== '/user/complete-profile') {
          history.push('/user/complete-profile');
        }
      } else if (verificationStatus === 'verified') {
        // If user is verified and on a verification-related page, redirect to user dashboard
        if (userVerificationPaths.includes(currentPath)) {
          history.push('/user/dashboard');
        }
      }
    }
    // --- Redirection Logic for 'admin' and 'superadmin' roles ---
    else if (userRole === 'admin' || userRole === 'superadmin') {
      // If admin/superadmin is on a user-specific verification page, redirect them to their dashboard
      if (userVerificationPaths.includes(currentPath)) {
        // Determine the correct dashboard based on role
        const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/superadmin/dashboard';
        if (currentPath !== dashboardPath) { // Prevent unnecessary redirects if already on correct dashboard
          history.push(dashboardPath);
        }
      }
    }
    // Add a default redirect for authenticated users without a specific role or if they are on a login/register page
    // This prevents authenticated users from staying on public routes
    else if (currentUser && !userRole && (currentPath === '/' || currentPath === '/login' || currentPath === '/user/register')) {
        history.push('/user/complete-profile'); // Default for new users who haven't set a role yet
    }


  }, [loading, currentUser, userRole, verificationStatus, history, location.pathname]);

  return <>{children}</>;
};

export default VerificationRedirector;