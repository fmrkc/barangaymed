# Teleconsultation Feature Implementation

## Completed Tasks ✅

1. **Created Types** - `src/types/teleconsultationRequests.ts`
   - Defined `TeleconsultationRequest` interface with all necessary fields
   - Defined `TeleconsultationRequestFormData` interface for form handling
   - Included comprehensive status tracking: pending, cancelled, accepted, rejected, scheduled, completed, no show
   - Added optional fields: scheduledDate, meetingLink, adminNotes

2. **Created Service** - `src/services/teleconsultationService.ts`
   - Implemented `TeleconsultationService` singleton class
   - Added `createRequest` method to store requests in Firestore
   - Added `getUserRequests` method for future use
   - Integrated with existing user service for user data

3. **Updated Teleconsultation Modal** - `src/pages/user/user-tele-request.tsx`
   - Replaced unavailable message with functional form
   - Added textarea for reason input (500 character limit)
   - Added form validation and submission handling
   - Added success/error toast notifications
   - Added loading states during submission

4. **Enabled Button in User Home** - `src/pages/user/user-home.tsx`
   - Added state management for teleconsultation modal
   - Enabled the teleconsultation card button functionality
   - Removed "Feature temporarily disabled" message
   - Added proper modal integration

5. **Updated Firestore Rules** - `firestore.rules`
   - Updated teleconsultationRequests collection rules to align with new status system
   - Added proper validation for create operations
   - Implemented correct status transition rules
   - Ensured consistency with TypeScript interfaces

## Data Storage Structure

The teleconsultation requests are stored in Firestore collection: `teleconsultationRequests`

Each document contains:
- `userId`: Firebase user ID
- `userEmail`: User's email address
- `userName`: User's full name
- `reason`: Reason for teleconsultation request
- `status`: Request status (pending, cancelled, accepted, rejected, scheduled, completed, no show)
- `createdAt`: Timestamp when request was created
- `updatedAt`: Timestamp when request was last updated
- `barangayId`: User's barangay ID
- `scheduledDate`: Optional scheduled appointment date
- `meetingLink`: Optional meeting link for scheduled appointments
- `adminNotes`: Optional notes from administrators

## Firestore Security Rules

### Create Rules:
- Only verified users can create requests
- Must include required fields: userId, reason, status, timestamps, userEmail, userName
- Status must be set to 'pending' initially

### Read Rules:
- Users can only read their own requests
- Superadmins can read all requests

### Update Rules:
- Users can cancel pending requests or mark accepted requests as completed
- Superadmins can update any request to any valid status
- All status transitions are properly validated

## ⚠️ IMPORTANT: Custom Claims Configuration Required

### Required Custom Claims for Proper Security Rules:
The Firestore security rules now rely on custom claims stored in Firebase Auth tokens. The following claims must be set for each user:

**For Regular Users:**
```javascript
{
  role: 'user',
  verificationStatus: 'verified', // or 'unverified', 'rejected'
  barangayId: 'string' // User's barangay ID
}
```

**For Admins:**
```javascript
{
  role: 'admin',
  verificationStatus: 'verified',
  barangayId: 'string' // Admin's assigned barangay ID
}
```

**For Super Admins:**
```javascript
{
  role: 'superadmin',
  verificationStatus: 'verified'
  // Note: Super admins can access all barangays
}
```

### Why Custom Claims Are Required:
1. **Performance**: Rules can access `request.auth.token` directly without fetching from Firestore
2. **Security**: No dependency on user documents existing or being properly formatted
3. **Reliability**: Rules work even if user documents are corrupted or missing
4. **Consistency**: All user attributes needed for authorization are in one place

### Implementation Notes:
- Custom claims should be set when users register or when their status changes
- Use Firebase Admin SDK to set custom claims server-side
- Claims are automatically included in all Firestore security rule evaluations
- Consider using Firebase Cloud Functions to manage custom claims updates

## Next Steps for Testing

1. **Test the complete flow:**
   - Click the "Book Teleconsultation" button
   - Fill out the reason form
   - Submit the request
   - Verify data is stored in Firestore

2. **Verify user experience:**
   - Form validation works correctly
   - Success/error messages display properly
   - Modal opens and closes correctly
   - Button is only enabled for verified users

3. **Check data integrity:**
   - Verify requests are stored with correct user information
   - Confirm status is set to "pending"
   - Check timestamps are properly set

4. **Test Firestore rules:**
   - Verify users cannot create requests without proper validation
   - Test that users can only read their own requests
   - Confirm superadmins can manage all requests
