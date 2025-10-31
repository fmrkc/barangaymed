# TODO: Superadmin Create Resident Account

This is a to-do list for implementing the feature where a superadmin can create a resident's (user) account.

## Page 1: User Information

### Name
- [ ] First Name
- [ ] Middle Name (Optional)
- [ ] Last Name
- [ ] Suffix (Optional)

### Personal Details
- [ ] Birthdate (Must be a valid date and the user must be at least 18 years old)
- [ ] Sex (Dropdown, Male or Female)

## Page 2: Address and Contact Details

### Location Details
- [ ] Region (Dropdown, auto-populated from addressService)
- [ ] Province (Dropdown, auto-populated from addressService, dependent on Region)
- [ ] City/Municipality (Dropdown, auto-populated from addressService, dependent on Province)
- [ ] Barangay (Dropdown, auto-populated from addressService, dependent on City/Municipality)
- [ ] Zip Code (Disabled, auto-filled based on Barangay selection)

### Specific Address Details and Contact Info
- [ ] Lot/Block/House No. (Optional)
- [ ] Street Name
- [ ] Subdivision/Village/Zone/Purok (Optional)
- [ ] Contact Number (Must be a valid 10-digit number, prefixed with +63)

## Page 3: Account Credentials and Document Upload

### Account Credentials
- [ ] Email
- [ ] Password

### Document Uploads
- [ ] ID Type (National ID, Barangay ID, PhilHealth ID)
- [ ] ID File (image or PDF upload)

## General TODOs
- [ ] Create a new page/route for superadmin to create user accounts (sa-register-resident.tsx).
- [ ] Implement the multi-page form UI.
- [ ] Handle form state management.
- [ ] Implement user creation logic in Firebase Authentication.
- [ ] Save user data to Firestore.
- [ ] Add navigation link in the superadmin dashboard.
- [ ] Write tests for the new feature.
- [ ] Use @src/pages/user/registration/verify-email.tsx and @src/pages/user/registration/complete-profile.tsx as reference for the process.
- [ ] Implement form validation to ensure all required fields are filled before proceeding to the next step or submitting.
