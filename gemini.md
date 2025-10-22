# Gemini Code Assistant Project Overview

This document provides a comprehensive overview of the BarangayMed project, a web and mobile application designed to streamline medicine requests and health services for barangays.

## Project Overview

BarangayMed is a platform that connects residents, barangay health workers (BHWs), and rural health units (RHUs). It aims to digitize and simplify the process of requesting medicines, managing inventory, and disseminating health-related announcements. The system has different user roles with specific functionalities:

*   **Residents:** Can request medicines, either selecting through over-the-counter medicines or uploading their prescription. Can book appointments through teleconsultation requests. Can also create simple medical record to be used as context in requesting medicines and consultations. Can view announcements, and manage their accounts.

*   **Admins (Barangay Health Workers):** Manage resident accounts, handle medicine and teleconsultation requests, manage teleconsultation appointments, and post announcements for their barangay. Can also request medicines from the RHU.

*   **Super Admins (RHU):** Manage central RHU medicine inventory and other barangays' inventories. Can move medicines across barangays through 'Medicine Transfer'. Can see and manage requests from various barangays. Can also manage admin accounts.

## Project Structure

The repository is organized into the following key directories:

*   `src/`: Contains the source code for the React-based web application.
    *   `components/`: Reusable React components.
    *   `pages/`: Different pages of the application, organized by user role (admin, superadmin, user).
    *   `services/`: Modules for interacting with backend services (e.g., Firebase).
    *   `contexts/`: React context providers for managing global state (e.g., authentication).
*   `functions/`: Houses the Firebase Cloud Functions that form the backend of the application.
    *   `src/`: TypeScript source code for the functions.
*   `android/`: Contains the Android application project, built with Capacitor.
*   `public/`: Static assets for the web application.

## Getting Started

To set up and run the project locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Firebase:**
    *   Create a Firebase project and obtain the configuration credentials.
    *   Replace the placeholder configuration in `src/firebaseConfig.ts` with your actual Firebase config.
    *   Set up a service account for the Firebase Admin SDK in the `functions/` directory.

3.  **Run the Web Application:**
    ```bash
    npm run dev
    ```
    This will start the Vite development server and open the application in your browser.

4.  **Deploy Firebase Functions:**
    ```bash
    cd functions
    npm install
    npm run build
    firebase deploy --only functions
    ```

## Web Application (React + Vite)

The frontend is a single-page application (SPA) built with React and Vite. It uses React Router for navigation and Ionic components for the UI. The code is written in TypeScript.

### Key Libraries

*   **React:** For building the user interface.
*   **Vite:** As the build tool and development server.
*   **Ionic:** For UI components that work across web and mobile.
*   **React Router:** For handling client-side routing.
*   **Firebase:** For authentication, database, and other backend services.

## Firebase Backend

The backend logic is implemented as Firebase Cloud Functions, written in TypeScript. These functions handle:

*   **User Authentication:** Creating and managing user accounts.
*   **Database Operations:** Interacting with Firestore for data storage (e.g., medicine requests, announcements).
*   **Business Logic:** Sending invitations, managing roles, and other application-specific logic.

## Android Application

The project includes an Android application built using Capacitor. Capacitor allows the web application to be packaged as a native Android app, providing access to native device features. To build and run the Android app, you will need Android Studio and the Android SDK.

## Scripts and Commands

The `package.json` file contains several useful scripts:

*   `npm run dev`: Starts the development server for the web app.
*   `npm run build`: Builds the web app for production.
*   `npm run test`: Runs the tests using Vitest.
*   `npm run cypress:open`: Opens the Cypress test runner for end-to-end testing.
*   `npm run lint`: Lints the codebase using ESLint.

## User Rules

1. Propose a plan on how to implement the features being asked.
2. Security is top priority as this system will be going official.
3. The user does not know what is the proper and standard way of implementing features on the system. Propose what is the standard and proper way on how to implement such features.
4. On monumental tasks, create a to-do list to divide the task in phases.
5. Check if there's a free API that can help solve a problem.
6. When troubleshooting, I should first try to understand the user's context and actions to identify the root cause of the problem, which may include asking clarifying questions about their process.

## VS CODE/Firebase Rules
1. Do not use 'any' because of this rule: "Unexpected any. Specify a different type  <!-- @typescript-eslint/no-explicit-any" --> . 
2. Sometimes when importing json files, do not use assert because of this rule: "Import assertions have been replaced by import attributes. Use 'with' instead of 'assert'.ts(2880)" .
3. Another rule when importing files: " Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. "