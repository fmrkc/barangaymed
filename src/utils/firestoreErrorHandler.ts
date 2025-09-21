/**
 * Centralized error handling utility for Firestore operations
 * Provides retry logic, error logging, and proper error handling for Firestore operations
 */

import { logEvent } from './logger';

export interface FirestoreError {
  code: string;
  message: string;
  details?: any;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Custom error class for Firestore operations
 */
export class FirestoreOperationError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly metadata?: any;

  constructor(message: string, code: string, retryable: boolean = false, metadata?: any) {
    super(message);
    this.name = 'FirestoreOperationError';
    this.code = code;
    this.retryable = retryable;
    this.metadata = metadata;
  }
}

/**
 * Determines if an error is retryable based on Firestore error codes
 */
export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
    'unknown'
  ];

  const errorCode = error?.code || error?.name || '';
  return retryableCodes.includes(errorCode.toLowerCase());
}

/**
 * Calculates delay for exponential backoff
 */
export function calculateBackoffDelay(attempt: number, options: RetryOptions): number {
  const delay = Math.min(
    options.baseDelay * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelay
  );

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs Firestore operation errors with context
 */
export function logFirestoreError(
  operation: string,
  error: any,
  metadata?: any
): void {
  const errorInfo = {
    operation,
    errorCode: (error && typeof error === 'object' && 'code' in error) ? error.code : 'unknown',
    errorMessage: (error && typeof error === 'object' && 'message' in error) ? error.message : 'Unknown error',
    retryable: isRetryableError(error),
    metadata,
    timestamp: new Date().toISOString()
  };

  logEvent('error', `[FIRESTORE_ERROR] ${operation} failed`, errorInfo);
}

/**
 * Executes a Firestore operation with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: Partial<RetryOptions> = {},
  metadata?: any
): Promise<T> {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      // Log the attempt if it's a retry
      if (attempt > 0) {
        logEvent('info', `[FIRESTORE_RETRY] Attempting ${operationName} (attempt ${attempt + 1}/${retryOptions.maxRetries + 1})`, {
          operation: operationName,
          attempt: attempt + 1,
          maxRetries: retryOptions.maxRetries,
          metadata
        });
      }

      const result = await operation();

      // Log success if it was a retry
      if (attempt > 0) {
        logEvent('info', `[FIRESTORE_RETRY_SUCCESS] ${operationName} succeeded after ${attempt + 1} attempts`, {
          operation: operationName,
          attempts: attempt + 1,
          metadata
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      // Log the error
      logFirestoreError(operationName, error, {
        attempt: attempt + 1,
        maxRetries: retryOptions.maxRetries,
        ...metadata
      });

      // If this is the last attempt or error is not retryable, throw
      if (attempt === retryOptions.maxRetries || !isRetryableError(error)) {
        const errorMessage = (error && typeof error === 'object' && 'message' in error) ? error.message : 'Unknown error';
        const errorCode = (error && typeof error === 'object' && 'code' in error) ? String(error.code) : 'unknown';

        throw new FirestoreOperationError(
          `Operation ${operationName} failed after ${attempt + 1} attempts: ${errorMessage}`,
          errorCode,
          false,
          { attempts: attempt + 1, ...metadata }
        );
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, retryOptions);
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Wraps onSnapshot with error handling and retry logic
 */
export function wrapOnSnapshot<T>(
  query: any,
  onNext: (snapshot: T) => void,
  onError?: (error: Error) => void,
  operationName: string = 'onSnapshot'
) {
  return executeWithRetry(
    () => {
      return new Promise((resolve, reject) => {
        const unsubscribe = query.onSnapshot(
          (snapshot: T) => {
            try {
              onNext(snapshot);
            } catch (error) {
              const errorMessage = (error && typeof error === 'object' && 'message' in error) ? error.message : 'Unknown error';
              logEvent('error', `[ONSNAPSHOT_HANDLER_ERROR] Error in onNext handler for ${operationName}`, {
                operation: operationName,
                error: errorMessage
              });

              if (onError) {
                onError(error as Error);
              }
            }
          },
          (error: Error) => {
            logFirestoreError(operationName, error, { listenerError: true });
            if (onError) {
              onError(error);
            }
            reject(error);
          }
        );

        // Return unsubscribe function
        resolve(unsubscribe);
      });
    },
    operationName,
    DEFAULT_RETRY_OPTIONS,
    { isListener: true }
  );
}
