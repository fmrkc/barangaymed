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

    // --- Redirection Logic ---
    if (userRole === 'user') {
      const targetPath = (() => {
        if (verificationStatus === 'rejected') {
          return '/user/rejected-verification';
        } else if (verificationStatus === 'pending_approval') {
          return '/user/pending-verification';
        } else if (verificationStatus === null || verificationStatus === undefined || verificationStatus === 'unverified') {
          return '/user/complete-profile';
        } else if (verificationStatus === 'verified') {
          if (userVerificationPaths.includes(currentPath)) {
            return '/user/dashboard';
          }
          return null;
        }
        return null;
      })();

      if (targetPath && currentPath !== targetPath) {
        console.log(`VerificationRedirector: Redirecting user from ${currentPath} to ${targetPath} (status: ${verificationStatus})`);
        history.push(targetPath);
      }
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      if (userVerificationPaths.includes(currentPath)) {
        const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/superadmin/dashboard';
        if (currentPath !== dashboardPath) {
          console.log(`VerificationRedirector: Redirecting ${userRole} to ${dashboardPath}`);
          history.push(dashboardPath);
        }
      }
    } else if (!userRole && (currentPath === '/' || currentPath === '/login' || currentPath === '/user/register')) {
      console.log('VerificationRedirector: Redirecting to /user/complete-profile (no role yet)');
      history.push('/user/complete-profile');
    }


  }, [loading, currentUser, userRole, verificationStatus, history, location.pathname]);

  return <>{children}</>;
};

export default VerificationRedirector;