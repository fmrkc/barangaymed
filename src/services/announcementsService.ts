import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../firebaseConfig';
import { Announcement, AnnouncementFormData, AnnouncementImage } from '../types/announcements';
import { logEvent } from '../utils/logger';
import { UserService } from './userService';

export class AnnouncementsService {
  private collectionName = 'announcements';
  private maxImagesPerAnnouncement = 5;
  private maxImageSize = 5 * 1024 * 1024; // 5MB

  /**
   * Upload images to Firebase Storage and return their URLs
   */
  private async uploadImages(images: File[], barangay: string, announcementId: string, userId: string, userEmail: string): Promise<AnnouncementImage[]> {
    if (!images || images.length === 0) return [];

    // Validate image count
    if (images.length > this.maxImagesPerAnnouncement) {
      throw new Error(`Maximum ${this.maxImagesPerAnnouncement} images allowed per announcement`);
    }

    const uploadedImages: AnnouncementImage[] = [];

    for (const image of images) {
      // Validate image size
      if (image.size > this.maxImageSize) {
        throw new Error(`Image "${image.name}" exceeds maximum size of ${this.maxImageSize / (1024 * 1024)}MB`);
      }

      // Validate image type
      if (!image.type.startsWith('image/')) {
        throw new Error(`File "${image.name}" is not a valid image`);
      }

      try {
        // Create storage path
        const timestamp = Date.now();
        const imageName = `${timestamp}_${image.name}`;
        const storagePath = `announcements/${barangay}/${announcementId}/${imageName}`;
        const storageRef = ref(storage, storagePath);

        // Upload image
        const snapshot = await uploadBytes(storageRef, image);
        const downloadURL = await getDownloadURL(snapshot.ref);

        uploadedImages.push({
          url: downloadURL,
          name: image.name,
          size: image.size,
          uploadedAt: new Date()
        });

        // Log successful upload
        logEvent('info', 'Image uploaded successfully', {
          userId,
          userEmail,
          userRole: 'admin', // Assuming image uploads are done by admins
          metadata: {
            action: 'image_upload',
            announcementId,
            imageName: image.name,
            imageSize: image.size,
            storagePath
          }
        });
      } catch (error) {
        logEvent('error', 'Failed to upload image', {
          userId,
          userEmail,
          userRole: 'admin', // Assuming image uploads are done by admins
          metadata: {
            action: 'image_upload_failed',
            announcementId,
            imageName: image.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        throw error;
      }
    }

    return uploadedImages;
  }

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
      
      // Upload images if any
      let uploadedImages: AnnouncementImage[] = [];
      if (data.images && data.images.length > 0) {
        uploadedImages = await this.uploadImages(data.images, barangay, docRef.id, userId, userEmail);
        
        // Update the announcement with image URLs
        await updateDoc(doc(db, this.collectionName, docRef.id), {
          images: uploadedImages
        });
      }

      // Log the creation
      logEvent('info', `Announcement created: ${data.title}`, {
        userId,
        userEmail,
        userRole: 'admin', // Assuming announcements are created by admins
        metadata: {
          action: 'create_announcement',
          announcementId: docRef.id,
          barangay,
          title: data.title,
          priority: data.priority,
          imageCount: uploadedImages.length
        }
      });

      // Create notifications for all users in the barangay
      this.createNotificationsForAnnouncement(docRef.id, data.title, barangay);

      return docRef.id;
    } catch (error) {
      logEvent('error', 'Failed to create announcement', {
        userId,
        userEmail,
        userRole: 'admin', // Assuming announcements are created by admins
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
   * Get all announcements for the current user's barangay using Cloud Function
   */
  async getAnnouncementsByBarangay(userId?: string, userEmail?: string, userRole?: string): Promise<Announcement[]> {
    try {
      const getAnnouncementsFunction = httpsCallable(functions, 'getAnnouncementsByBarangay');
      const result = await getAnnouncementsFunction();
      const announcements = (result.data as any).announcements as Announcement[];

      // Log successful fetch
      logEvent('info', 'Announcements fetched successfully', {
        userId,
        userEmail,
        userRole,
        metadata: {
          action: 'fetch_announcements',
          count: announcements.length
        }
      });

      return announcements;
    } catch (error) {
      logEvent('error', 'Failed to fetch announcements', {
        userId,
        userEmail,
        userRole,
        metadata: {
          action: 'fetch_announcements_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
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
          priority: data.priority,
          images: data.images || []
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
   * Get all ACTIVE announcements for a given barangay (for user view)
   */
  async getActiveAnnouncementsForBarangay(barangay: string): Promise<Announcement[]> {
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
          priority: data.priority,
          images: data.images || []
        });
      });

      return announcements;
    } catch (error) {
      logEvent('error', 'Failed to fetch active announcements for user', {
        metadata: {
          action: 'fetch_active_announcements_failed',
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
    data: Partial<AnnouncementFormData> & { existingImages?: AnnouncementImage[], newImages?: File[] }, 
    userId: string, 
    userEmail: string
  ): Promise<void> {
    try {
      const { existingImages, newImages, ...otherData } = data;

      const updateData: any = {
        ...otherData,
        images: existingImages, // Update with the potentially filtered list of existing images
        updatedAt: serverTimestamp()
      };

      // Upload new images if any
      if (newImages && newImages.length > 0) {
        const announcementDoc = await getDoc(doc(db, this.collectionName, announcementId));
        const announcementData = announcementDoc.data();

        if (!announcementData) {
          throw new Error('Announcement not found');
        }
        const barangay = announcementData.barangay;
        const uploadedImages = await this.uploadImages(newImages, barangay, announcementId, userId, userEmail);
        
        updateData.images = (updateData.images || []).concat(uploadedImages);
      }

      await updateDoc(doc(db, this.collectionName, announcementId), updateData);

      // Log the update
      logEvent('info', `Announcement updated: ${data.title || 'Untitled'}`, {
        userId,
        userEmail,
        userRole: 'admin', // Assuming announcements are updated by admins
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
        userRole: 'admin', // Assuming announcements are updated by admins
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
        userRole: 'admin', // Assuming announcements are deleted by admins
        metadata: {
          action: 'delete_announcement',
          announcementId
        }
      });
    } catch (error) {
      logEvent('error', 'Failed to delete announcement', {
        userId,
        userEmail,
        userRole: 'admin', // Assuming announcements are deleted by admins
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
        userRole: 'admin', // Assuming announcements are reactivated by admins
        metadata: {
          action: 'reactivate_announcement',
          announcementId
        }
      });
    } catch (error) {
      logEvent('error', 'Failed to reactivate announcement', {
        userId,
        userEmail,
        userRole: 'admin', // Assuming announcements are reactivated by admins
        metadata: {
          action: 'reactivate_announcement_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          announcementId
        }
      });
      throw error;
    }
  }

  /**
   * Create notifications for all users in the barangay when a new announcement is created
   */
  private async createNotificationsForAnnouncement(announcementId: string, announcementTitle: string, barangay: string): Promise<void> {
    try {
      const userService = UserService.getInstance();
      const users = await userService.getUsersByBarangay(barangay);

      // Create a log entry for each user to trigger notification
      for (const user of users) {
        logEvent('info', `New announcement: ${announcementTitle}`, {
          userId: user.uid,
          userEmail: user.email,
          userRole: 'user', // Recipients are users
          metadata: {
            action: 'new_announcement',
            announcementId,
            announcementTitle
          }
        });
      }
    } catch (error) {
      console.error('Error creating notifications for announcement:', error);
      // Don't throw error to avoid breaking announcement creation
    }
  }
}

export const announcementsService = new AnnouncementsService();