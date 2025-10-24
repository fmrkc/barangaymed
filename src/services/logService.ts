import { auth } from '../firebaseConfig';

export interface LogEntry {
  action: string;
  userId: string;
  userEmail: string;
  userName?: string;
  role?: string;
  details?: Record<string, any>;
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
        console.error('[LogService] User not authenticated. Cannot log activity.');
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
      console.error('[LogService] Failed to log activity:', error);
      throw error;
    }
  }
}
