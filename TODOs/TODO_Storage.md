# Storage

- [ ] **Clarify `user-documents` Deletion Rule:** The comment in `storage.rules` for `user-documents` deletion is inconsistent with the rule itself. The comment says admins and superadmins can delete, but the rule only allows the user. This needs to be clarified and the comment or rule updated.
- [ ] **Refine `medical-history` Rules:** The `write` rule for `medical-history` should be split into separate `create`, `update`, and `delete` rules for more granular control.
- [ ] **Consistent `isAuthenticated()` Usage:** The `isAuthenticated()` helper function should be used consistently throughout the `storage.rules` file for better readability.
