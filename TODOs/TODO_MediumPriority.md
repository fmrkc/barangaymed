# Medium Priority

- [ ] **Fix `medicineRequests` and `teleconsultationRequests` Read Access:** Admins cannot read medicine or teleconsultation requests from their own barangay. This appears to be a bug and needs to be fixed.
- [ ] **Tighten `logs` Collection Rules:** The `logs` collection is too open. Log creation should be restricted to backend functions, and read access should be limited. Logs should also be immutable from the client-side.
