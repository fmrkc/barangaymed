/**
 * Logger utility for tracking security events
 */
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { LogService } from '../services/logService';

const logService = LogService.getInstance();

// Define log levels
export type LogLevel = 'info' | 'warn' | 'error';

// Define log entry structure
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Save log entry to Firestore
 * @param logEntry The log entry to save
 */
const saveLogToFirestore = async (logEntry: LogEntry) => {
  try {
    // Filter out undefined values from details to prevent Firestore errors
    const filteredDetails = {
      level: logEntry.level,
      message: logEntry.message,
      ...(logEntry.ip && { ip: logEntry.ip }),
      ...(logEntry.userAgent && { userAgent: logEntry.userAgent }),
      ...logEntry.metadata,
    };

    console.log("Log Entry being sent to Cloud Function from logger.ts:", JSON.stringify({
      action: logEntry.metadata?.action || 'general_log',
      userId: logEntry.userId,
      userEmail: logEntry.userEmail,
      role: logEntry.userRole,
      details: filteredDetails,
    }));
    await logService.logActivity({
      action: logEntry.metadata?.action || 'general_log',
      userId: logEntry.userId,
      userEmail: logEntry.userEmail || logEntry.metadata?.userEmail, // Get from logEntry or metadata
      role: logEntry.userRole || logEntry.metadata?.userRole, // Get from logEntry or metadata
      details: filteredDetails,
    });
  } catch (error) {
    console.error('Failed to save log to Firestore:', error);
    // We don't want logging errors to break the application
  }
};

/**
 * Log an event to the console and to Firestore
 * @param level The severity level of the log
 * @param message The log message
 * @param data Additional data to include in the log
 */
export const logEvent = (level: LogLevel, message: string, data?: Partial<LogEntry>) => {
  const logEntry: LogEntry = {
    timestamp: new Date(),
    level,
    message,
    ...data
  };

  // Log to console for development
  console.log(`[${level.toUpperCase()}] ${message}`, logEntry);

  // Save to Firestore for persistent storage
  saveLogToFirestore(logEntry);
};

/**
 * Log a user login event
 * @param userId The user's ID
 * @param userEmail The user's email
 * @param userRole The user's role
 * @param ip The user's IP address (optional)
 */
export const logLogin = (userId: string, userEmail: string, userRole: string, ip?: string) => {
  logEvent('info', `User logged in: ${userEmail}`, {
    userId,
    userEmail,
    userRole,
    ip,
    metadata: {
      action: 'login'
    }
  });
};

/**
 * Log a user logout event
 * @param userId The user's ID
 * @param userEmail The user's email
 * @param userRole The user's role
 */
export const logLogout = (userId: string, userEmail: string, userRole: string) => {
  logEvent('info', `User logged out: ${userEmail}`, {
    userId,
    userEmail,
    userRole,
    metadata: {
      action: 'logout'
    }
  });
};

/**
 * Log a failed login attempt
 * @param email The email used in the failed attempt
 * @param reason The reason for failure
 */
export const logFailedLogin = (email: string, reason: string) => {
  logEvent('warn', `Failed login attempt: ${email}`, {
    userEmail: email,
    metadata: {
      action: 'failed_login',
      reason
    }
  });
};

/**
 * Log a medicine request status update
 * @param userId The ID of the user making the update
 * @param userEmail The email of the user making the update
 * @param userRole The role of the user making the update
 * @param requestId The ID of the medicine request
 * @param oldStatus The previous status of the request
 * @param newStatus The new status of the request
 */
export const logMedicineRequestStatusUpdate = (
  userId: string,
  userEmail: string,
  userRole: string,
  requestId: string,
  oldStatus: string,
  newStatus: string
) => {
  logEvent('info', `Medicine request status updated: ${requestId}`, {
    userId,
    userEmail,
    userRole,
    metadata: {
      action: 'medicine_request_status_update',
      requestId,
      oldStatus,
      newStatus
    }
  });
};

/**
 * Log security-related events for access control
 * @param userId The user's ID (use 'unknown' for unauthenticated users)
 * @param eventType The type of security event
 * @param description Detailed description of the event
 * @param additionalData Additional metadata for the event
 */
export const logSecurityEvent = (
  userId: string,
  eventType: string,
  description: string,
  additionalData?: Record<string, any>
) => {
  logEvent('info', `Security event: ${eventType} - ${description}`, {
    userId,
    metadata: {
      action: 'security_event',
      eventType,
      description,
      ...additionalData
    }
  });
};

/**
 * Log unauthorized access attempts
 * @param userId The user's ID
 * @param attemptedRoute The route the user tried to access
 * @param userRole The user's current role
 * @param requiredRole The required role for the route
 */
export const logUnauthorizedAccess = (
  userId: string,
  attemptedRoute: string,
  userRole: string,
  requiredRole: string
) => {
  logSecurityEvent(
    userId,
    'UNAUTHORIZED_ACCESS',
    `User with role ${userRole} attempted access to route requiring ${requiredRole}`,
    {
      attemptedRoute,
      userRole,
      requiredRole
    }
  );
};

/**
 * Log authentication events
 * @param userId The user's ID
 * @param eventType Type of authentication event
 * @param details Additional details about the event
 */
export const logAuthenticationEvent = (
  userId: string,
  eventType: string,
  details: string
) => {
  logSecurityEvent(
    userId,
    'AUTHENTICATION',
    `${eventType}: ${details}`,
    { eventType, details }
  );
};
