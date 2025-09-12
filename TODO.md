# TODO: Fix Partial Registration Validation and Highlighting

## Tasks
- [ ] Update user-partial-register.tsx: Add gender to validateStep for step 1
- [ ] Add hasValidatedStep1 state in user-partial-register.tsx
- [ ] Set hasValidatedStep1 to true in onNext when step is 1
- [ ] Pass hasValidatedStep1 prop to PartialRegistrationStep1
- [ ] Update PartialRegistrationStep1.tsx: Add gender to touchedFields
- [ ] Add onIonBlur for gender IonSelect in PartialRegistrationStep1.tsx
- [ ] Update className for firstName, lastName, birthdate to use hasValidatedStep1 || touchedFields[field]
- [ ] Add className for gender IonSelect with validation logic
- [ ] Test the changes to ensure highlighting works on next click
