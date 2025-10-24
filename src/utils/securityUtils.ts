/**
 * Security utility functions for enhanced authentication and authorization
 */

import { User as FirebaseUser } from 'firebase/auth';
import { logEvent, logSecurityEvent, logUnauthorizedAccess } from './logger';
import { logErrorToConsole } from './consoleErrorHandler';

/**
 * Validates if a user has the required role
 * @param userRole The user's current role
 * @param requiredRole The required role for access
 * @returns boolean indicating if access should be granted
 */
export const validateUserRole = (userRole: string | null, requiredRole: string): boolean => {
  return userRole === requiredRole;
};

/**
 * Validates if a user has access to a specific barangay
 * @param barangayId The user's barangay ID
 * @param requiredBarangayId The required barangay ID for access
 * @returns boolean indicating if access should be granted
 */
export const validateBarangayAccess = (barangayId: string | null, requiredBarangayId: string): boolean => {
  return barangayId === requiredBarangayId;
};

/**
 * Checks if a user has admin privileges for a specific barangay
 * @param userRole The user's role
 * @param barangayId The user's barangay ID
 * @param targetBarangayId The target barangay ID to check access for
 * @returns boolean indicating if admin access should be granted
 */
export const validateAdminBarangayAccess = (
  userRole: string | null,
  barangayId: string | null,
  targetBarangayId: string
): boolean => {
  const hasAccess = userRole === 'admin' && barangayId === targetBarangayId;
  
  // Log detailed access check for debugging
  if (!hasAccess) {
    logEvent('debug', 'Access denied for admin barangay access check:', {
      userRole,
      barangayId,
      targetBarangayId,
      hasAccess
    });
  }
  
  return hasAccess;
};

/**
 * Validates super admin access
 * @param userRole The user's role
 * @returns boolean indicating if super admin access should be granted
 */
export const validateSuperAdminAccess = (userRole: string | null): boolean => {
  return userRole === 'superadmin';
};

/**
 * Force refresh of Firebase ID token to ensure latest claims
 * @param user The Firebase user object
 * @returns Promise that resolves when token is refreshed
 */
export const forceTokenRefresh = async (user: FirebaseUser): Promise<void> => {
  try {
    await user.getIdToken(true); // Force refresh
  } catch (error) {
    logErrorToConsole(error, 'Error refreshing token');
    throw error;
  }
};

/**
 * Comprehensive access validation function
 * @param userRole User's current role
 * @param barangayId User's barangay ID
 * @param requiredRole Required role for access
 * @param requiredBarangayId Required barangay ID (if applicable)
 * @returns Validation result object
 */
export const validateAccess = (
  userRole: string | null,
  barangayId: string | null,
  requiredRole: string,
  requiredBarangayId?: string
): { isValid: boolean; reason?: string } => {
  // Check if user has the required role
  if (!validateUserRole(userRole, requiredRole)) {
    return {
      isValid: false,
      reason: `User role ${userRole} does not match required role ${requiredRole}`
    };
  }

  // If barangay-specific access is required, validate it
  if (requiredBarangayId && !validateBarangayAccess(barangayId, requiredBarangayId)) {
    return {
      isValid: false,
      reason: `User barangay ${barangayId} does not match required barangay ${requiredBarangayId}`
    };
  }

  return { isValid: true };
};

/**
 * Rate limiting utility to prevent brute force attacks
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxAttempts: number = 5, timeWindow: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.timeWindow = timeWindow;
  }

  /**
   * Check if an action is allowed for a specific key
   * @param key The key to check (e.g., user ID, IP address)
   * @returns boolean indicating if action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if time window has passed
    if (now - attempt.lastAttempt > this.timeWindow) {
      this.attempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if max attempts reached
    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    // Increment attempt count
    this.attempts.set(key, { count: attempt.count + 1, lastAttempt: now });
    return true;
  }

  /**
   * Reset attempt count for a specific key
   * @param key The key to reset
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Get current attempt count for a specific key
   * @param key The key to check
   * @returns The current attempt count
   */
  getAttemptCount(key: string): number {
    return this.attempts.get(key)?.count || 0;
  }
}

// Global rate limiter instance for login attempts
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
