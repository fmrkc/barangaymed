import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface LogEntry {
  action: string; // e.g., 'medicine_inventory_update', 'medicine_request_status_update', 'medicine_added'
  userId?: string;
  userEmail?: string;
  userName?: string;
  role?: string; // e.g., 'admin', 'user', 'superadmin'
  details: any; // Specific details about the action
  timestamp?: any; // Firestore Timestamp
}

export class LogService {
  private static instance: LogService;

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  /**
   * Logs an activity using Cloud Function for secure server-side logging.
   * @param logEntry The log entry object.
   */
  public async logActivity(logEntry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.log('Activity log (user not authenticated):', logEntry);
        return;
      }

      // Check if user has a role (indicating they've completed full registration)
      // If role is missing, fall back to local logging to avoid CORS issues
      if (!logEntry.role || logEntry.role === 'unknown' || logEntry.role === 'undefined') {
        console.log('Activity log (user not fully verified, using fallback):', logEntry);
        return;
      }

      const idToken = await user.getIdToken();

      // Call the HTTP endpoint using the new consolidated function URL
      const response = await fetch('https://api-gy7oflie2a-uc.a.run.app/logActivityV2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Activity logged successfully:', result);
    } catch (error) {
      console.error('Error logging activity via Cloud Function:', error);
      // Fallback to console logging if Cloud Function fails
      console.log('Activity log (fallback):', logEntry);
    }
  }
}
