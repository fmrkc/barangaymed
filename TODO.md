# TODO: Sync Full Verification Status to 'verified'

## Steps to Complete:
1. [x] Edit src/pages/admin/admin-resident-verification.tsx: Update handleApprove to set subcollection status to 'verified', update notification message to "verified", and change sendVerificationEmail status to 'verified'.
2. [x] Edit src/pages/user/user-my-account.tsx: Update chip logic to check for 'verified' instead of 'approved' for success state; add a verified success card similar to pending.
3. [ ] Test the changes: Submit registration, approve as admin, verify UI shows 'verified' consistently.
4. [x] If needed, check/update cloud function for email messaging (updated functions/src/sendVerificationEmail.ts to handle 'verified' status).
5. [x] Deploy cloud function changes (completed successfully).
6. [x] Fix firestore.rules syntax error (removed 'change' typo).

Progress: All edits completed and deployed. Ready for testing.
