# Verification Document Cleanup Plan

This plan outlines the server-side process for securely and reliably deleting user verification documents from Firebase Storage after they have been processed.

## Phase 1: Create a Firestore-Triggered Cloud Function

- [x] **Integrate the cleanup logic into the existing `onUserDocUpdate` Cloud Function** in `functions/src/user-claims-triggers.ts`, which already triggers on the `onUpdate` event for documents in the `users/{userId}` collection.
- [x] **Define the trigger condition:** The function should only execute when the `verificationStatus` field changes from `pending_approval` to either `verified` or `rejected`.

## Phase 2: Implement the Deletion Logic

- [x] **Extract the file URL:** Inside the function, get the `idVerificationUrl` from the updated user document.
- [x] **Parse the URL to get the file path:** Convert the public download URL into the actual file path required for the Admin SDK (e.g., `user-documents/USER_ID/file-name.pdf`).
- [x] **Delete the file from Firebase Storage:** Use the Admin Storage SDK to delete the file.
- [x] **Add robust error handling:** Wrap the deletion logic in a `try...catch` block and log any errors.

## Phase 3: Clean Up Firestore Document

- [x] **Remove URL fields:** After a successful deletion from Storage, update the corresponding user document in Firestore.
- [x] **Use `FieldValue.delete()`** to remove the `idVerificationUrl` and `idVerificationType` fields from the document. This prevents dangling references and keeps the database clean.
