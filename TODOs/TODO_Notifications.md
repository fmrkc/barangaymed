# Notification System Implementation Plan

This file outlines the plan for implementing a new notification system in the BarangayMed project.

## Phase 1: Infrastructure Setup

- [x] **Create a Pub/Sub Topic:** Create a new Pub/Sub topic in the Google Cloud project named `barangaymed-events`.
- [x] **Create a Notification Service:** Create a new Cloud Function that will act as the notification service. This function will be triggered by messages published to the `barangaymed-events` topic.

## Phase 2: Implement the Notification Service

- [x] **Event Handler:** The notification service will have a central event handler that will receive events from the event bus. This handler will look at the event type (e.g., `user.registration.approved`) and decide which notifications to send.
- [x] **In-App Notifications:** Create a module for in-app notifications that will create a new document in the `users/{userId}/notifications` collection in Firestore.
- [ ] **Email Notifications:** Create a module for email notifications that will use the existing `sendEmail` function.
- [ ] **SMS Notifications:** Create a module for SMS notifications that will use a third-party service like Twilio.

## Phase 3: Refactor the Existing Code

- [ ] **Publish Events:** Refactor the existing code to publish events to the event bus instead of sending notifications directly.
- [ ] **Remove Direct Notification Logic:** Remove the code that sends notifications directly from the business logic.
