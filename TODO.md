# TODO for Fixing Teleconsultation Request Permission Error

## Problem:
Teleconsultation request fails with "Insufficient or Missing Permission" error. Root cause: User profile lacks barangayId (not fully verified/registered), violating Firestore rules requiring barangayId as string.

## Steps:

1. **Update teleconsultationService.ts**:
   - Add validation to check if barangayId is set before creating request.
   - Throw user-friendly error if barangayId is missing.

2. **Update user-tele-request.tsx**:
   - Add checks using useAuth for barangayId and emailVerified.
   - Disable submit button or show message if profile incomplete.

3. **Update full-registration-modal.tsx**:
   - Sync verificationStatus in main user doc with subcollection status (pending when submitted).

4. **Test the changes**:
   - Attempt request as unverified user (expect app-level error message).
   - Complete user verification and test successful request.
   - Check console logs for any auth/claims issues.

5. **Cleanup**:
   - Remove or archive this TODO.md once complete.
