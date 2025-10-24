# Phase 3 Notification Refactoring Tasks

- [x] Refactor `submitFullRegistrationV2` in `functions/src/index.ts`: Remove direct notification addition and publish 'user.registration.submitted' event using PubSub.
- [x] Refactor `reviewUserRegistration` in `functions/src/index.ts`: Remove direct notification addition and publish 'user.registration.approved' or 'user.registration.rejected' events using PubSub.
- [x] Update `onBarangayMedEvent` in `functions/src/notifications.ts`: Add handler for 'user.registration.submitted' and 'user.registration.rejected' events to send in-app notifications.
- [ ] Deploy Firebase functions to apply the changes.
- [ ] Update `TODOs/TODO_Notifications.md` to mark Phase 3 tasks as completed.
- [ ] Test the notification flow to ensure events trigger notifications correctly.
