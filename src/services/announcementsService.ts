import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Announcement, AnnouncementFormData } from '../types/announcements';
import { logEvent } from '../utils/logger';

export class AnnouncementsService {
  private collectionName = 'announcements';

  /**
   * Create a new announcement
   */
  async createAnnouncement(
    data: AnnouncementFormData, 
    barangay: string, 
    userId: string, 
    userEmail: string
  ): Promise<string> {
    try {
      const announcementData = {
        title: data.title,
        content: data.content,
        barangay,
        createdBy: userId,
        createdByEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        priority: data.priority
      };

      const docRef = await addDoc(collection(db, this.collectionName), announcementData);
      
      // Log the creation
      logEvent('info', `Announcement created: ${data.title}`, {
        userId,
        userEmail,
        metadata: {
          action: 'create_announcement',
          announcementId: docRef.id,
          barangay,
          title: data.title,
          priority: data.priority
        }
      });

      return docRef.id;
    } catch (error) {
      logEvent('error', 'Failed to create announcement', {
        userId,
        userEmail,
        metadata: {
          action: 'create_announcement_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          barangay,
          title: data.title
        }
      });
      throw error;
    }
  }

  /**
   * Get all announcements for a specific barangay
   */
  async getAnnouncementsByBarangay(barangay: string): Promise<Announcement[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('barangay', '==', barangay),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const announcements: Announcement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        announcements.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          barangay: data.barangay,
          createdBy: data.createdBy,
          createdByEmail: data.createdByEmail,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          isActive: data.isActive,
          priority: data.priority
        });
      });

      return announcements;
    } catch (error) {
      logEvent('error', 'Failed to fetch announcements', {
        metadata: {
          action: 'fetch_announcements_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          barangay
        }
      });
      throw error;
    }
  }

  /**
   * Get all announcements for admin management (includes inactive ones)
   */
  async getAllAnnouncementsForBarangay(barangay: string): Promise<Announcement[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('barangay', '==', barangay),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const announcements: Announcement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        announcements.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          barangay: data.barangay,
          createdBy: data.createdBy,
          createdByEmail: data.createdByEmail,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          isActive: data.isActive,
          priority: data.priority
        });
      });

      return announcements;
    } catch (error) {
      logEvent('error', 'Failed to fetch all announcements for management', {
        metadata: {
          action: 'fetch_all_announcements_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          barangay
        }
      });
      throw error;
    }
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(
    announcementId: string, 
    data: Partial<AnnouncementFormData>, 
    userId: string, 
    userEmail: string
  ): Promise<void> {
    try {
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, this.collectionName, announcementId), updateData);

      // Log the update
      logEvent('info', `Announcement updated: ${data.title || 'Untitled'}`, {
        userId,
        userEmail,
        metadata: {
          action: 'update_announcement',
          announcementId,
          updatedFields: Object.keys(data)
        }
      });
    } catch (error) {
      logEvent('error', 'Failed to update announcement', {
        userId,
        userEmail,
        metadata: {
          action: 'update_announcement_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          announcementId
        }
      });
      throw error;
    }
  }

  /**
   * Delete (soft delete) an announcement by setting isActive to false
   */
  async deleteAnnouncement(
    announcementId: string, 
    userId: string, 
    userEmail: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, announcementId), {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      // Log the deletion
      logEvent('info', 'Announcement deleted', {
        userId,
        userEmail,
        metadata: {
          action: 'delete_announcement',
          announcementId
        }
      });
    } catch (error) {
      logEvent('error', 'Failed to delete announcement', {
        userId,
        userEmail,
        metadata: {
          action: 'delete_announcement_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          announcementId
        }
      });
      throw error;
    }
  }

  /**
   * Reactivate a deleted announcement
   */
  async reactivateAnnouncement(
    announcementId: string, 
    userId: string, 
    userEmail: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, announcementId), {
        isActive: true,
        updatedAt: serverTimestamp()
      });

      // Log the reactivation
      logEvent('info', 'Announcement reactivated', {
        userId,
        userEmail,
        metadata: {
          action: 'reactivate_announcement',
          announcementId
        }
      });
    } catch (error) {
      logEvent('error', 'Failed to reactivate announcement', {
        userId,
        userEmail,
        metadata: {
          action: 'reactivate_announcement_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          announcementId
        }
      });
      throw error;
    }
  }
}

export const announcementsService = new AnnouncementsService();
