# Future-Proofing

- [ ] **Optimize Address Data:** The `philippine-addresses.json` file should be moved to a more scalable data store, such as Firestore or a separate database, to allow for more efficient querying.
- [ ] **Implement Caching for Address Data:** If moving the address data to a database is not feasible, the data should be cached in memory to avoid reading and processing the large JSON file on every function call.
- [ ] **Refactor `index.ts`:** The `index.ts` file should be refactored into smaller, more focused modules (e.g., `address.ts`, `users.ts`, etc.).
- [ ] **Use a Router:** An Express router should be used to organize the routes in `index.ts`.
- [ ] **Implement Code Splitting:** Use `React.lazy` and `Suspense` to implement code splitting for routes to improve initial load time.
- [ ] **Organize Routes:** The routes in `src/App.tsx` should be organized into separate files for each user role.
- [ ] **Upgrade `react-router-dom`:** Upgrade to `react-router-dom` v6 to take advantage of the new features and improvements.
