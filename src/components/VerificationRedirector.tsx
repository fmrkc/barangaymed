import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerificationRedirector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userRole, verificationStatus, loading, emailVerified } = useAuth();
  const history = useHistory();
  const location = useLocation();

  const getUserRedirectPath = (currentPath: string): string | null => {
    const userVerificationPaths = [
      '/user/pending-verification',
      '/user/rejected-verification',
      '/user/complete-profile',
    ];

    if (!emailVerified) {
      return '/user/verify-email';
    }

    switch (verificationStatus) {
      case 'rejected':
        return '/user/rejected-verification';
      case 'pending_approval':
        return '/user/pending-verification';
      case null:
      case undefined:
      case 'unverified':
        return '/user/complete-profile';
      case 'verified':
        if (userVerificationPaths.includes(currentPath)) {
          return '/user/dashboard';
        }
        return null;
      default:
        return null;
    }
  };

  const getAdminRedirectPath = (currentPath: string): string | null => {
    const userVerificationPaths = [
      '/user/pending-verification',
      '/user/rejected-verification',
      '/user/complete-profile',
    ];

    if (userVerificationPaths.includes(currentPath)) {
      return userRole === 'admin' ? '/admin/dashboard' : '/superadmin/dashboard';
    }
    return null;
  };

  useEffect(() => {
    if (loading || !currentUser) {
      return; // Wait for loading to complete or if no user is logged in
    }

    const currentPath = location.pathname;
    let targetPath: string | null = null;

    if (userRole === 'user') {
      targetPath = getUserRedirectPath(currentPath);
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      targetPath = getAdminRedirectPath(currentPath);
    } else if (!userRole && (currentPath === '/' || currentPath === '/login' || currentPath === '/user/register')) {
      targetPath = '/user/complete-profile';
    }

    if (targetPath && currentPath !== targetPath) {
      history.push(targetPath);
    }
  }, [loading, currentUser, userRole, verificationStatus, emailVerified, history, location.pathname]);

  return <>{children}</>;
};

export default VerificationRedirector;