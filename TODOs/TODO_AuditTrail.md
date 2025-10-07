# Audit Trail

- [ ] **Fix `logActivityV2`:** The `logActivityV2` function should be fixed to write to the top-level `logs` collection instead of the `users/{userId}/logs` subcollection.
- [ ] **Restrict Client-Side Logging:** The `firestore.rules` for the `logs` collection should be changed to `allow write: if false;` and all logs should be written by backend functions.
- [ ] **Improve Log Data:** Add the user's IP address and user agent to the log entries.
- [ ] **Create a Centralized Logging Service:** Create a centralized logging service that can be called from any backend function.
