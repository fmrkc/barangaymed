/**
 * Centralized logging utility for the BarangayMed application
 * Provides structured logging for different types of events
 */

export interface LogMetadata {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface SecurityLogData extends LogMetadata {
  path?: string;
  requiredRole?: string;
  barangayId?: string;
  requiredBarangayId?: string;
}

/**
 * Logs general application events
 * @param level - Log level (info, error, warn, debug)
 * @param message - Log message
 * @param data - Additional log data
 */
export const logEvent = (
  level: 'info' | 'error' | 'warn' | 'debug',
  message: string,
  data?: LogMetadata
): void => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };

  // For now, use console logging with structured format
  switch (level) {
    case 'error':
      console.error('[LOG]', logEntry);
      break;
    case 'warn':
      console.warn('[LOG]', logEntry);
      break;
    case 'debug':
      console.debug('[LOG]', logEntry);
      break;
    default:
      console.log('[LOG]', logEntry);
  }

  // TODO: In production, send to logging service (e.g., Cloud Logging, LogRocket, etc.)
};

/**
 * Logs security-related events
 * @param userId - User ID performing the action
 * @param userEmail - User's email
 * @param userRole - User's role
 * @param eventType - Type of security event
 * @param message - Event description
 * @param data - Additional security event data
 */
export const logSecurityEvent = (
  userId: string,
  userEmail: string | undefined,
  userRole: string | undefined,
  eventType: string,
  message: string,
  data?: SecurityLogData
): void => {
  logEvent('info', `[SECURITY] ${eventType}: ${message}`, {
    userId,
    userEmail,
    userRole,
    eventType,
    securityEvent: true,
    ...data
  });
};

/**
 * Logs unauthorized access attempts
 * @param userId - User ID attempting access
 * @param userEmail - User's email
 * @param userRole - User's current role
 * @param path - Path being accessed
 * @param requiredRole - Required role for access
 */
export const logUnauthorizedAccess = (
  userId: string,
  userEmail: string | undefined,
  userRole: string | undefined,
  path: string,
  requiredRole: string
): void => {
  logSecurityEvent(
    userId,
    userEmail,
    userRole,
    'UNAUTHORIZED_ACCESS',
    `Unauthorized access attempt to ${path}`,
    {
      path,
      requiredRole,
      accessDenied: true
    }
  );
};

/**
 * Logs user login events
 * @param userId - User ID logging in
 * @param userEmail - User's email
 * @param userRole - User's role
 * @param ipAddress - User's IP address
 */
export const logLogin = (
  userId: string,
  userEmail: string,
  userRole: string,
  ipAddress: string
): void => {
  logSecurityEvent(
    userId,
    userEmail,
    userRole,
    'USER_LOGIN',
    `User logged in successfully`,
    {
      ipAddress,
      loginEvent: true
    }
  );
};

/**
 * Logs user logout events
 * @param userId - User ID logging out
 * @param userEmail - User's email
 * @param userRole - User's role
 */
export const logLogout = (
  userId: string,
  userEmail: string,
  userRole: string
): void => {
  logSecurityEvent(
    userId,
    userEmail,
    userRole,
    'USER_LOGOUT',
    `User logged out`,
    {
      logoutEvent: true
    }
  );
};

/**
 * Logs authentication failures
 * @param email - Email used in login attempt
 * @param reason - Reason for failure
 * @param ipAddress - IP address of the attempt
 */
export const logAuthFailure = (
  email: string,
  reason: string,
  ipAddress: string
): void => {
  logEvent('warn', `[AUTH_FAILURE] Login failed for ${email}: ${reason}`, {
    email,
    reason,
    ipAddress,
    authFailure: true
  });
};

/**
 * Logs failed login attempts (alias for logAuthFailure)
 * @param email - Email used in login attempt
 * @param reason - Reason for failure
 * @param ipAddress - IP address of the attempt (optional, defaults to 'unknown')
 */
export const logFailedLogin = (
  email: string,
  reason: string,
  ipAddress: string = 'unknown'
): void => {
  logAuthFailure(email, reason, ipAddress);
};

/**
 * Logs data access events for audit purposes
 * @param userId - User ID accessing data
 * @param userEmail - User's email
 * @param userRole - User's role
 * @param action - Action performed (read, write, delete)
 * @param resource - Resource being accessed
 * @param resourceId - ID of the resource
 */
export const logDataAccess = (
  userId: string,
  userEmail: string | undefined,
  userRole: string | undefined,
  action: 'read' | 'write' | 'delete' | 'update',
  resource: string,
  resourceId: string
): void => {
  logEvent('info', `[DATA_ACCESS] ${action.toUpperCase()} ${resource}: ${resourceId}`, {
    userId,
    userEmail,
    userRole,
    action,
    resource,
    resourceId,
    dataAccess: true
  });
};
