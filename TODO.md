# Update Database Column: barangay → barangayId

## Type Definitions Updates
- [x] src/types/medicineRequests.ts: Update Medicine interface `barangay` → `barangayId`
- [x] src/types/teleconsultationRequests.ts: Update TeleconsultationRequest `barangayId` → `barangayId` (already correct)
- [x] src/types/announcements.ts: Update Announcement interface `barangay` → `barangayId`

## Service Layer Updates
- [x] src/services/userService.ts: Standardize on `barangayId`
- [x] src/services/teleconsultationService.ts: Update queries to use `barangayId`
- [x] src/services/medicineService.ts: Update medicine queries to use `barangayId`
- [ ] src/services/announcementsService.ts: Update queries to use `barangayId`

## Component Updates
- [ ] src/pages/user/user-register.tsx: Store `barangayId` in user document
- [ ] Update all components using `barangay` to use `barangayId`
- [ ] Update form handling and data passing in components

## Firestore Rules Updates
- [ ] firestore.rules: Update announcements collection to use `barangayId`
- [ ] firestore.rules: Update rhuInventory read rule to use `barangayId`

## Data Migration
- [ ] Update existing user documents to use `barangayId` instead of `barangay`
- [ ] Update existing announcements, medicines, etc. to use `barangayId`

## Testing
- [ ] Test all updated functionality
- [ ] Verify Firestore security rules work correctly
- [ ] Ensure no breaking changes in data flow
