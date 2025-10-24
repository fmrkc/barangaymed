import { auth } from '../firebaseConfig';
import { logErrorToConsole } from '../utils/consoleErrorHandler';

export interface LogEntry {
  action: string;
  userId: string;
  userEmail: string;
  userName?: string;
  role?: string;
  details?: Record<string, unknown>;
}

export class LogService {
  private static instance: LogService;

  private constructor() {}

  static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  /**
   * Logs an activity to Firebase
   * @param logEntry - The log entry to record
   */
  async logActivity(logEntry: LogEntry): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        logErrorToConsole('[LogService] User not authenticated. Cannot log activity.', 'logActivity');
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch('/api/logActivityV2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to log activity');
        } catch (e) {
          throw new Error(text || 'Failed to log activity');
        }
      }

    } catch (error) {
      logErrorToConsole(error, '[LogService] Failed to log activity');
      throw error;
    }
  }
}
