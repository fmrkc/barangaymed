import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

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
  private logActivityFunction: any;

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  constructor() {
    // Initialize the Cloud Function callable
    this.logActivityFunction = httpsCallable(functions, 'logActivity');
  }

  /**
   * Logs an activity using Cloud Function for secure server-side logging.
   * @param logEntry The log entry object.
   */
  public async logActivity(logEntry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    try {
      // Call the Cloud Function instead of writing directly to Firestore
      await this.logActivityFunction(logEntry);
    } catch (error) {
      console.error('Error logging activity via Cloud Function:', error);
      // Fallback to console logging if Cloud Function fails
      console.log('Activity log (fallback):', logEntry);
    }
  }
}
