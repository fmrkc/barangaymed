import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
   * Logs an activity to the 'logs' collection in Firestore.
   * @param logEntry The log entry object.
   */
  public async logActivity(logEntry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, 'logs'), {
        ...logEntry,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
}
