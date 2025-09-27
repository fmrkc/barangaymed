# TODO for Fixing Permissions Error in Admin Verification

## Steps:

1. **Edit firestore.rules**:
   - Added rule to allow admins to update verificationStatus and rejectionReason for users in their barangay.

2. **Deploy rules**:
   - Ran `firebase deploy --only firestore:rules` to apply the changes.

3. **Test the changes**:
   - Verify that approving/rejecting a user no longer throws permissions errors.
   - Check console logs and functionality.

4. **Cleanup**:
   - Remove or archive this TODO.md once complete.
