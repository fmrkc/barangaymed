# To-Do List: Enhance Admin & Superadmin Registration

This document outlines the plan to update the admin and superadmin registration forms to capture more detailed user information, similar to the user registration process.

## Phase 1: Backend Update (Cloud Function)

- [ ] **Modify `provisionUser` Function (`functions/src/index.ts`)**
    - [ ] Update the function's signature to accept new parameters from the frontend: `firstName`, `lastName`, `middleName`, `suffix`, `birthdate`, and `gender`.
    - [ ] Remove the dependency on the old `fullName` parameter.
    - [ ] In the `admin.auth().createUser` call, construct the `displayName` from the new structured name fields (e.g., `${firstName} ${lastName}`).
    - [ ] In the `admin.firestore().collection('users').doc().set()` call, save the individual fields (`firstName`, `lastName`, `middleName`, `suffix`, `birthdate`, `gender`) to the new user's document, replacing the old `name` field.
    - [ ] Update the welcome email content to use the new `firstName` for a more personal greeting.

## Phase 2: Frontend Update (React Components)

- [ ] **Update BHW/Admin Registration Form (`src/pages/superadmin/sa-admin-register.tsx`)**
    - [ ] Add new state variables to manage the inputs for `firstName`, `lastName`, `middleName`, `suffix`, `birthdate`, and `gender`.
    - [ ] Replace the single "Full Name" input field with the more detailed set of name inputs, mirroring the structure in `UserRegister.tsx`.
    - [ ] Add new `IonInput` (for birthdate) and `IonSelect` (for gender) components to the form.
    - [ ] Update the `handleProvisionAdmin` function to pass the new, detailed user information to the `provisionUser` cloud function, removing the `fullName` parameter.

- [ ] **Update Superadmin Registration Form (`src/pages/superadmin/sa-superadmin-register.tsx`)**
    - [ ] Add new state variables for `firstName`, `lastName`, `middleName`, `suffix`, `birthdate`, and `gender`.
    - [ ] Replace the "Full Name" input with the same detailed name fields as above.
    - [ ] Add inputs for "Birthdate" and "Gender".
    - [ ] Update the `handleProvisionSuperAdmin` function to pass the new structured data to the `provisionUser` cloud function instead of `fullName`.
