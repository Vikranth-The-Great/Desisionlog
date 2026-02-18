# Findings - Decision Log

## Technical Constraints
- **Serverless Architecture:** Deployment on Vercel requires stateless logic; background processing is limited to serverless function execution windows.
- **Supabase Free Tier:** Infrastructure must respect connection limits, storage quotas, and egress volume of the free tier.
- **No Background Jobs (v1):** All logic (locking, status updates) must be triggered by user interactions or API calls.
- **No Analytics Engine (v1):** Data is stored for retrieval and manual reflection only; no complex aggregation or automated insights.

## UX Philosophy
- **Minimal:** Interface contains only essential elements for decision recording and review.
- **Calm Interface:** Use of glassmorphism and subtle gradients to create a focus-oriented environment.
- **No Gamification:** Avoidance of streaks, points, or badges that detract from high-quality thinking.
- **No Motivational Language:** Neutral system feedback to minimize external bias in the reflection process.

## Risk Analysis
- **Hindsight Bias Misinterpretation:** Users may still misinterpret "good results" as "good reasoning" without active friction in the UI.
- **Data Consistency Risk:** Ensuring the "locking" mechanism is robust across API failures or race conditions.
- **Auth Edge Cases:** Handling session expiry during long reasoning capture sessions.

## Trade-offs
- **Simplicity over Features:** Prioritizing the core reasoning loop over social sharing or tag management complexity.
- **Manual Review over Automation:** Requiring user effort to log outcomes ensures active reflection rather than passive tracking.
- **Clean Relational Model over Denormalization:** Maintaining a strict 1:1 Decision-Outcome relationship for data integrity, even if it adds query complexity.

## Security Considerations

### Row-Level Security (RLS) Rules
- **Supabase RLS Requirements:** All tables (`decisions`, `outcomes`) must have RLS enabled by default. No "public" access is permitted.
- **User-ID Scope:** Every table includes a `user_id` column that strictly references `auth.users`. All application logic must treat this as the primary anchor for data segregation.
- **Cross-User Access Prevention:** RLS policies will ensure that a user can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` rows where the `user_id` matches the authenticated user's ID (`auth.uid()`).
- **Duplicate Outcomes Prevention:** A unique constraint on `outcomes.decision_id` ensures a strict 1:1 relationship, preventing duplicate outcome logs for the same thinking event.

### SQL Injection Prevention
- **Supabase Client:** Use of the official Supabase client (standardizes parameterized queries) effectively eliminates traditional SQL injection risks.
- **Input Sanitization:** All user-provided markdown and text fields will be treated as untrusted and sanitized before any logic is applied, ensuring that even if RLS failed, the data itself is clean.

### RLS Policy Logic (Plain English)
1. **Enable RLS:** Activate security on the table.
2. **Select Policy:** "Allow the user to see a record ONLY IF the `user_id` column in that record is equal to the ID of the person currently logged in."
3. **Insert Policy:** "Allow the user to add a record ONLY IF the `user_id` they are submitting matches their own authenticated ID."
4. **Update/Delete Policy:** "Allow the user to modify or remove a record ONLY IF they are the owner of that record."

## Assumptions
- The "Thinking Accountability" loop is the primary value driver for the target user.
- The developer has access to Vercel and Supabase for deployment.
