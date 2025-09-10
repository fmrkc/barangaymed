import React, { useEffect, useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logSecurityEvent, logUnauthorizedAccess } from '../utils/logger';
import { validateAccess, forceTokenRefresh } from '../utils/securityUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
  redirectTo: string;
  requiredBarangayId?: string;
  additionalValidation?: (user: any, userRole: string | null, barangayId: string | null) => boolean;
  enableTokenRefresh?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  redirectTo,
  requiredBarangayId,
  additionalValidation,
  enableTokenRefresh = true
}) => {
  const { currentUser, userRole, barangayId, emailVerified, loading, refreshUserClaims } = useAuth(); // Added emailVerified
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const location = useLocation();

  // Enhanced security validation with token refresh
  useEffect(() => {
    const validateAccessWithSecurity = async () => {
      if (!currentUser || loading) {
        setIsValidating(false);
        return;
      }

      try {
        // Force token refresh to ensure we have the latest claims
        if (enableTokenRefresh) {
          await forceTokenRefresh(currentUser);
        }
        
        // Refresh context claims
        await refreshUserClaims();

        // Validate basic access requirements
        const accessValidation = validateAccess(userRole, barangayId, requiredRole, requiredBarangayId);
        if (!accessValidation.isValid) {
          setValidationError(accessValidation.reason || 'Access validation failed');
          logUnauthorizedAccess(
            currentUser.uid,
            currentUser.email || undefined,
            userRole ?? undefined,
            location.pathname,
            requiredRole
          );
          return;
        }

        // Additional custom validation if provided
        if (additionalValidation && !additionalValidation(currentUser, userRole, barangayId)) {
          setValidationError('Additional validation failed');
          logSecurityEvent(
            currentUser.uid,
            currentUser.email || undefined,
            userRole ?? undefined,
            'ACCESS_DENIED',
            `Custom validation failed for route requiring ${requiredRole}`,
            {
              path: location.pathname,
              userEmail: currentUser.email || 'unknown',
              userRole: userRole ?? 'unknown'
            }
          );
          return;
        }

      } catch (error) {
        console.error('Security validation error:', error);
        setValidationError('Security validation failed');
        logSecurityEvent(
          currentUser.uid,
          currentUser.email || undefined,
          userRole ?? undefined,
          'SECURITY_VALIDATION_ERROR',
          `Error during security validation: ${error}`,
          {
            path: location.pathname,
            userEmail: currentUser.email || 'unknown',
            userRole: userRole ?? 'unknown'
          }
        );
      } finally {
        setIsValidating(false);
      }
    };

    validateAccessWithSecurity();
  }, [currentUser, loading, requiredRole, requiredBarangayId, refreshUserClaims, additionalValidation, enableTokenRefresh, location.pathname, userRole, barangayId]);

  // Show loading state while validating
  if (loading || isValidating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Verifying access permissions...
      </div>
    );
  }

  // If user is not authenticated, redirect to login with return URL
  if (!currentUser) {
    logSecurityEvent(
      'unknown',
      undefined,
      undefined,
      'UNAUTHENTICATED_ACCESS',
      `Attempted access to protected route: ${location.pathname}`,
      {
        requiredRole,
        path: location.pathname,
        userEmail: 'unknown', // Not available for unauthenticated users
        userRole: 'unknown'    // Not available for unauthenticated users
      }
    );
    return <Redirect to={`/user/login?returnUrl=${encodeURIComponent(location.pathname)}`} />;
  }

  // NEW: Check for email verification
  if (!currentUser.emailVerified) {
    logSecurityEvent(
      currentUser.uid,
      currentUser.email || undefined,
      userRole || undefined,
      'EMAIL_NOT_VERIFIED',
      `Attempted access to protected route with unverified email: ${location.pathname}`,
      {
        requiredRole,
        path: location.pathname,
        userEmail: currentUser.email || 'unknown', // Added
        userRole: userRole || 'unknown' // Added
      }
    );
    return <Redirect to="/user/verify-email" />; // Redirect to email verification page
  }

  // If validation error occurred, redirect with appropriate message
  if (validationError) {
    logSecurityEvent(
      currentUser.uid,
      currentUser.email || undefined,
      userRole ?? undefined,
      'ACCESS_DENIED',
      `Access denied for ${location.pathname}: ${validationError}`,
      {
        userRole: userRole ?? undefined,
        requiredRole,
        barangayId: barangayId ?? undefined,
        requiredBarangayId,
        path: location.pathname,
        userEmail: currentUser.email || 'unknown', // Added
      }
    );
    return <Redirect to={redirectTo} />;
  }

  // If user doesn't have the required role, log and redirect
  const accessCheck = validateAccess(userRole, barangayId, requiredRole, requiredBarangayId);
  if (!accessCheck.isValid) {
    logUnauthorizedAccess(
      currentUser.uid,
      currentUser.email || undefined,
      userRole || 'unknown',
      location.pathname,
      requiredRole
    );
    return <Redirect to={redirectTo} />;
  }

  // Access granted - log successful access
  logSecurityEvent(
    currentUser.uid,
    currentUser.email || undefined,
    userRole ?? undefined,
    'ACCESS_GRANTED',
    `User successfully accessed protected route: ${location.pathname}`,
    {
      userRole: userRole ?? undefined,
      requiredRole,
      barangayId: barangayId ?? undefined,
      requiredBarangayId,
      path: location.pathname,
      userEmail: currentUser.email || 'unknown', // Added
    }
  );

  return <>{children}</>;
};

export default ProtectedRoute;
