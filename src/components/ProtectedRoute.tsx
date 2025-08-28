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
  additionalValidation?: (user: any, userRole: string | null, userBarangayId: string | null) => boolean;
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
  const { currentUser, userRole, userBarangayId, loading, refreshUserClaims } = useAuth();
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
        const accessValidation = validateAccess(userRole, userBarangayId, requiredRole, requiredBarangayId);
        if (!accessValidation.isValid) {
          setValidationError(accessValidation.reason || 'Access validation failed');
          logUnauthorizedAccess(
            currentUser.uid,
            location.pathname,
            userRole || 'unknown',
            requiredRole
          );
          return;
        }

        // Additional custom validation if provided
        if (additionalValidation && !additionalValidation(currentUser, userRole, userBarangayId)) {
          setValidationError('Additional validation failed');
          logSecurityEvent(
            currentUser.uid,
            'ACCESS_DENIED',
            `Custom validation failed for route requiring ${requiredRole}`,
            { path: location.pathname }
          );
          return;
        }

      } catch (error) {
        console.error('Security validation error:', error);
        setValidationError('Security validation failed');
        logSecurityEvent(
          currentUser.uid,
          'SECURITY_VALIDATION_ERROR',
          `Error during security validation: ${error}`,
          { path: location.pathname }
        );
      } finally {
        setIsValidating(false);
      }
    };

    validateAccessWithSecurity();
  }, [currentUser, loading, requiredRole, requiredBarangayId, refreshUserClaims, additionalValidation, enableTokenRefresh, location.pathname, userRole, userBarangayId]);

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
      'UNAUTHENTICATED_ACCESS',
      `Attempted access to protected route: ${location.pathname}`,
      { requiredRole, path: location.pathname }
    );
    return <Redirect to={`/user/login?returnUrl=${encodeURIComponent(location.pathname)}`} />;
  }

  // If validation error occurred, redirect with appropriate message
  if (validationError) {
    logSecurityEvent(
      currentUser.uid,
      'ACCESS_DENIED',
      `Access denied for ${location.pathname}: ${validationError}`,
      { 
        userRole, 
        requiredRole, 
        userBarangayId, 
        requiredBarangayId,
        path: location.pathname 
      }
    );
    return <Redirect to={redirectTo} />;
  }

  // If user doesn't have the required role, log and redirect
  const accessCheck = validateAccess(userRole, userBarangayId, requiredRole, requiredBarangayId);
  if (!accessCheck.isValid) {
    logUnauthorizedAccess(
      currentUser.uid,
      location.pathname,
      userRole || 'unknown',
      requiredRole
    );
    return <Redirect to={redirectTo} />;
  }

  // Access granted - log successful access
  logSecurityEvent(
    currentUser.uid,
    'ACCESS_GRANTED',
    `User successfully accessed protected route: ${location.pathname}`,
    { 
      userRole, 
      requiredRole, 
      userBarangayId, 
      requiredBarangayId,
      path: location.pathname 
    }
  );

  return <>{children}</>;
};

export default ProtectedRoute;
