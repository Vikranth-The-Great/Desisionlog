# Technical SOP: Decision History

## Purpose
Provide a comprehensive, user-scoped view of all past intentions and results, optimized for identifying patterns and reviewing due reflecting tasks.

## Inputs
- Filter: `status` (`all`, `pending`, `completed`).
- Sort: Default (`status` pending -> `created_at` desc).

## Outputs
- List of combined `Decision` + `Outcome` (if exists) records.

## Edge Cases
- **No Data:** "Empty state" screen with a call-to-action to create the first decision.
- **Orphaned Decisions:** History must show decisions that are overdue for review with a high-priority "Due" indicator.

## Failure Handling
- **Fetch Failure:** "Retry" button with friendly error messaging.
- **Late Loading:** Skeleton loaders for glassmorphic cards.

## Database Interactions
- `SELECT * FROM decisions LEFT JOIN outcomes ON decisions.id = outcomes.decision_id WHERE decisions.user_id = auth.uid() ORDER BY decisions.status DESC, decisions.created_at DESC`.

## Security Rules
- RLS: Ensure `user_id` constraint is injected into the Supabase query.

## UI Expectations
- Infinite scroll or "Load More" button for history.
- Card labels for `Good Reasoning` vs `Good Result`.
- Filter chips for status.
- Search functionality (optional v1) by `title`.
