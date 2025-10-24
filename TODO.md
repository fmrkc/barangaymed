### Refactor Plan for Auto-Refreshing Pages

**Objective:** Fix the bug where the loading indicator gets stuck on the second visit to pages with auto-refreshing data.

**Root Cause:** The issue is caused by a mismatch between React's `useEffect` hook and Ionic's stack-based navigation model. `useEffect` is not re-running on subsequent page visits because its dependencies do not change, leaving the `loading` state as `true` indefinitely.

**Solution:** Implement Ionic's lifecycle hooks (`useIonViewWillEnter`, `useIonViewDidLeave`) to manage data fetching and cleanup, ensuring listeners are correctly attached and detached based on the page's visibility.

---

### Phase 1: Refactor `user-med-request-list.tsx` & `user-tele-request-list.tsx`

- [ ] **Isolate Data Fetching:** Create a dedicated `subscribeToRequests()` function to encapsulate the `onSnapshot` listener logic.
- [ ] **Manage Listener State:** Use a state variable (`useState<Function | null>`) to hold the `unsubscribe` function for the Firestore listener.
- [ ] **Implement Ionic Lifecycle Hooks:**
    - [ ] Use `useIonViewWillEnter` to call `subscribeToRequests()` to initiate data fetching.
    - [ ] Use `useIonViewDidLeave` to call the `unsubscribe()` function to prevent memory leaks.
- [ ] **Fix Manual Refresh:** Update `handleRefresh` to properly re-fetch data by unsubscribing and re-subscribing.

---

### Phase 2: Refactor `user-notifications.tsx` & `useNotifications` Hook

- [ ] **Modify `useNotifications` Hook:**
    - [ ] Add a new boolean `isActive` parameter to the hook.
    - [ ] Add `isActive` to the `useEffect` dependency array.
    - [ ] Only set up the listener `if (isActive && currentUser)`.
- [ ] **Modify `user-notifications.tsx` Component:**
    - [ ] Create a state variable `isPageActive`.
    - [ ] Use `useIonViewWillEnter` to set `isPageActive` to `true`.
    - [ ] Use `useIonViewDidLeave` to set `isPageActive` to `false`.
    - [ ] Pass the `isPageActive` state to the `useNotifications(isPageActive)` hook.
