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

### Phase 2: Advanced Protection (Future Implementation)

For more advanced protection against high-volume uploads and inappropriate content, the following measures are recommended for future implementation using Cloud Functions:

-   **Upload Quotas:** A Cloud Function triggered on file upload can count the number of images within an announcement's folder and automatically delete any that exceed the established limit (e.g., 5 images).
-   **Rate Limiting:** A Cloud Function can track the frequency of uploads per user (e.g., storing timestamps in Firestore) and temporarily block users who exceed a reasonable rate.
-   **Content Moderation:** A Cloud Function can integrate with the **Google Cloud Vision API** to automatically scan images for inappropriate content (e.g., violence, adult content) and flag or delete them accordingly.