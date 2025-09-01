import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize clients
const visionClient = new ImageAnnotatorClient();

/**
 * Moderates uploaded announcement images for inappropriate content and enforces upload quotas.
 * 
 * Triggered when a new file is uploaded to Firebase Storage.
 */
export const moderateAnnouncementImage = functions.storage.bucket('barangaymed.firebasestorage.app').object().onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    const bucket = object.bucket;

    // Exit if this is not an announcement image
    if (!filePath || !contentType || !contentType.startsWith('image/') || !filePath.startsWith('announcements/')) {
        console.log(`Skipping moderation for ${filePath} as it is not an announcement image.`);
        return null;
    }

    // Exit if this is a folder creation event
    if (object.size === '0') {
        console.log(`Skipping moderation for folder creation event: ${filePath}`);
        return null;
    }

    const parts = filePath.split('/');
    // announcements/{barangayId}/{announcementId}/{imageName}
    if (parts.length !== 4) {
        console.log(`Skipping moderation for ${filePath} as it does not match the expected path structure.`);
        return null;
    }

    const barangayId = parts[1];
    const announcementId = parts[2];

    console.log(`Starting moderation for image: ${filePath}`);

    // --- 1. Safe Search Content Moderation ---
    try {
        const [safeSearchResult] = await visionClient.safeSearchDetection(`gs://${bucket}/${filePath}`);
        const safeSearch = safeSearchResult.safeSearchAnnotation;

        if (safeSearch) {
            const isAdult = safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY';
            const isViolent = safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY';

            if (isAdult || isViolent) {
                console.log(`Inappropriate image detected: ${filePath}. Deleting.`);
                
                // Delete the inappropriate image
                await admin.storage().bucket(bucket).file(filePath).delete();
                
                // Log the moderation event for auditing purposes
                await admin.firestore().collection('audit_logs').add({
                    type: 'inappropriate_image_deleted',
                    filePath,
                    announcementId,
                    detectionResult: safeSearch,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });
                
                console.log(`Successfully deleted and logged inappropriate image: ${filePath}`);
                return null; // Stop further processing
            }
        }
    } catch (error) {
        console.error(`Failed to perform Safe Search detection on ${filePath}.`, error);
        // We will not block the upload for a detection failure, but the error is logged.
    }

    // --- 2. Enforce Upload Quota ---
    try {
        const directory = `announcements/${barangayId}/${announcementId}`;
        const [files] = await admin.storage().bucket(bucket).getFiles({ prefix: directory });
        
        const MAX_IMAGES = 5;
        if (files.length > MAX_IMAGES) {
            console.log(`Image quota exceeded for announcement ${announcementId}. Deleting newest file: ${filePath}.`);
            
            // Delete the file that just exceeded the quota
            await admin.storage().bucket(bucket).file(filePath).delete();

            // Log the quota enforcement event
            await admin.firestore().collection('audit_logs').add({
                type: 'image_quota_exceeded',
                filePath,
                announcementId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`Successfully deleted quota-exceeding image: ${filePath}`);
            return null; // Stop further processing
        }
    } catch (error) {
        console.error(`Failed to enforce image quota for ${filePath}.`, error);
    }

    console.log(`Finished moderation for image: ${filePath}`);
    return null;
});
