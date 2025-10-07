# BarangayMed Project

This document provides a comprehensive overview of the BarangayMed project, a web and mobile application designed to streamline medicine requests and health services for barangays.

## Project Overview

BarangayMed is a platform that connects residents, barangay health workers (BHWs), and rural health units (RHUs). It aims to digitize and simplify the process of requesting medicines, managing inventory, and disseminating health-related announcements. The system has different user roles with specific functionalities:

*   **Residents:** Can request medicines, either selecting through over-the-counter medicines or uploading their prescription. Can book appointments through teleconsultation requests. Can also create simple medical record to be used as context in requesting medicines and consultations. Can view announcements, and manage their accounts.

*   **Admins (Barangay Health Workers):** Manage resident accounts, handle medicine and teleconsultation requests, manage teleconsultation appointments, and post announcements for their barangay. Can also request medicines from the RHU.

*   **Super Admins (RHU):** Manage central RHU medicine inventory and other barangays' inventories. Can move medicines across barangays through 'Medicine Transfer'. Can see and manage requests from various barangays. Can also manage admin accounts.

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

## Building for iOS

To build the iOS app, you will need a Mac with Xcode and CocoaPods installed.

1.  **Install Xcode:**
    *   Install Xcode from the Mac App Store.

2.  **Install CocoaPods:**
    *   Open the Terminal app and run the following command:
        ```bash
        sudo gem install cocoapods
        ```

3.  **Install iOS Dependencies:**
    *   In the `ios` directory, run the following command:
        ```bash
        pod install
        ```

4.  **Open the Xcode Project:**
    *   Open the `ios/App/App.xcworkspace` file in Xcode.

5.  **Build the App:**
    *   In Xcode, select your target device and click the "Run" button to build and run the app.
