## Summary

- **What changed:** [Describe what was modified]
- **Why it changed:** [Explain the motivation and impact]
- **Linked issue:** #1252
- **Acceptance criteria covered:** Corrected the typo and verified routing consistency
- **Risk area touched:** `ui`
- **Reviewer focus:** Verify footer links now navigate correctly to `/career-privacy-policy`

## Validation

- [x] Verified the route `/career-privacy-policy` matches the existing careers privacy policy page
- [x] Confirmed that the typo `/carrer-privacy-policy` (4 r's) has been corrected to `/career-privacy-policy` (3 r's) in all three files
- [x] Tested that the footer link now correctly routes to the careers privacy policy

### Ran
- Manual verification of all route references
- Confirmed consistent updates across routing configuration, route policy, and footer component

### Did not run
- none

### Reviewer should verify
- Footer link in the deployed site now navigates to the correct careers privacy policy page without 404 errors
- The route consistency is maintained across all three modified files

## Notes

- **Deployment impact:** Minimal - fixes a typo in the route path that was causing 404 errors
- **Migration or env requirements:** None
- **Rollback or release notes:** This fix resolves a user-facing issue where the "Careers Site Privacy Notice" footer link returned a 404 error
- **Follow-up work if any:** None
- **Reviewer callouts or codeowners you expect to review this:** None
