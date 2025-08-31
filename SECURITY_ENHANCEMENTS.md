# Security Enhancements

This document outlines the security measures implemented to protect the BarangayMed application from abuse and malicious use.

## Image Upload System

The image upload system for announcements is a potential vector for abuse. The following measures have been implemented to secure it.

### Phase 1: Server-Side Validation (Storage Rules)

Firebase Storage security rules have been enhanced to provide server-side enforcement of file constraints. This is the primary line of defense against invalid uploads.

**File Path:** `/announcements/{barangayId}/{announcementId}/{imageName}`

**Rules Implemented:**

1.  **Authorization:** Write access is restricted to authenticated users who are either a `superadmin` or an `admin` of the specific `{barangayId}`.
    -   `isAdminOfBarangay(barangayId) || isSuperAdmin()`
2.  **File Size:** The size of any uploaded file must be less than 5MB.
    -   `request.resource.size < 5 * 1024 * 1024`
3.  **File Type:** The content type of the file must be a standard image format (`jpeg`, `png`, `webp`, or `gif`).
    -   `request.resource.contentType.matches('image/(jpeg|png|webp|gif)')`

These rules are enforced by Firebase itself and cannot be bypassed by a malicious client.

### Phase 2: Advanced Protection (Implemented)

To provide a deeper layer of security, a Cloud Function (`moderateAnnouncementImage`) has been implemented. This function automatically runs every time a new image is uploaded to the `announcements/` path in Firebase Storage.

The function performs the following actions:

1.  **Content Moderation:**
    -   The image is sent to the **Google Cloud Vision API** for Safe Search analysis.
    -   If the image is flagged as `LIKELY` or `VERY_LIKELY` to contain `adult` or `violence`, it is automatically deleted from storage.
    -   A record of the deletion and the Vision API result is saved to an `audit_logs` collection in Firestore for administrative review.

2.  **Upload Quota Enforcement:**
    -   After an image passes moderation, the function checks the total number of images in the announcement's storage directory.
    -   If the number of images exceeds the maximum limit (5), the newly uploaded image is automatically deleted.
    -   This event is also logged to the `audit_logs` collection.

These server-side controls provide robust protection against users bypassing client-side rules.

### Future Enhancements

-   **Rate Limiting:** To prevent spam or abuse from a single user, a Cloud Function can be developed to track the frequency of uploads per user (e.g., storing timestamps in Firestore) and temporarily block users who exceed a reasonable rate.