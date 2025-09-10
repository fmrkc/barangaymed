# TODO: Remove Modules from BarangayMed System

## 1. Update firestore.rules
- [x] Remove rules for medicineRequests, medicineTransfers, teleconsultationRequests, teleconsultationSchedules, medicalRecords, medicines, rhuInventory
- [x] Keep rules for users, announcements, logs

## 2. Remove Files
### Pages
- [x] Admin: admin-med-inventory.css, admin-med-inventory.tsx, admin-medicine-requests.css, admin-medicine-requests.tsx, admin-tele-requests.tsx
- [x] Superadmin: sa-med-inventory.tsx, sa-med-req-modal.tsx, sa-med-requests.tsx
- [x] User: user-med-list.css, user-med-list.tsx, user-med-request.tsx, user-requests.css, user-requests.tsx, user-tele-list.css, user-tele-list.tsx, user-tele-request.tsx, UserMedRequestSteps/, UserTeleconsultationSteps/

### Components
- [x] AdminMedicineRequestMonitor.tsx, RHUMedicineModal.tsx

### Services
- [x] medicineService.ts, teleconsultationService.ts

### Types
- [x] medicineRequests.ts, teleconsultationRequests.ts

## 3. Update Menus
- [x] src/pages/admin/admin-menu.tsx: Remove imports, paths, routes for removed features
- [x] src/pages/superadmin/sa-menu.tsx: Remove imports, paths, routes for removed features
- [x] src/pages/user/user-menu.tsx: Remove imports, routes, and requests tab

## 4. Update App.tsx
- [x] Remove unused imports for removed pages

## 5. Verify
- [x] Check for any remaining references in kept files
- [ ] Test the app
