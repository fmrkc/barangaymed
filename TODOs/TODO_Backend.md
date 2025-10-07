# Backend

### High Priority

- [ ] **Fix Authorization Bypass in HTTP Functions:** Several HTTP functions (`setUserRoleV2`, `logActivityV2`, `getAnnouncementsByBarangayV2`, `adminOnlyOperationV2`) have a critical authorization bypass vulnerability. They only check for the presence of an `Authorization` header but do not validate the ID token. This needs to be fixed immediately by validating the token and using the decoded claims for authorization.

### Medium Priority

- [ ] **Secure Document Links in Emails:** The link to the ID verification document sent in the registration confirmation email is not secure. It should be replaced with a secure, time-limited link.
- [ ] **Add Barangay-Level Authorization to `setCustomClaimsOnVerification`:** The `setCustomClaimsOnVerification` function should be updated to ensure that admins can only verify users for their own barangay.
- [ ] **Add Barangay-Level Authorization to `sendAnnouncementNotification`:** The `sendAnnouncementNotification` function should be updated to ensure that admins can only send notifications to their own barangay.

### Low Priority

- [ ] **Improve Input Validation:** Add more robust input validation to all backend functions to prevent data integrity issues.
- [ ] **Investigate Redundancy of `setCustomClaimsOnVerification`:** The `setCustomClaimsOnVerification` function may be redundant and could potentially be removed. This needs to be investigated.
- [ ] **Add Authorization to `completeInvitationRegistration`:** The `completeInvitationRegistration` function should be updated to ensure that the `uid` in the request matches the `uid` of the authenticated user.
