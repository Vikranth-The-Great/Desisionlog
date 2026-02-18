# Technical SOP: Outcome Review

## Purpose
Facilitate the reflection process by allowing users to log the actual result of a previously captured decision, enforcing a strict 24-hour edit window to mitigate hindsight bias.

## Inputs
- `decision_id`: UUID (Required).
- `result`: Enum (`good`, `bad`, `mixed`).
- `impact_score`: Integer (1-5).
- `lessons_learned`: Markdown.
- `was_correct_choice`: Boolean.

## Outputs
- `201 Created`: Full `Outcome` object.
- Decision status updated to `completed`.
- Associated `Decision` record in history updated with outcome reference.

## Edge Cases
- **Hindsight Revision:** If `now() > outcome.created_at + 24 hours`, the "Edit Outcome" button is disabled/hidden.
- **Duplicate Outcome:** API returns `409 Conflict` if an outcome already exists for the `decision_id`.

## Failure Handling
- **Constraint Violation:** If the user tries to log an outcome for a non-existent decision, return `404 Not Found`.
- **Database Error:** Notify user that the state transition failed and retry.

## Database Interactions
- `INSERT INTO outcomes`: Create outcome record.
- `UPDATE decisions SET status = 'completed' WHERE id = decision_id`.
- Transactional integrity should be maintained (Atomic insert + update).

## Security Rules
- RLS: User can only create outcomes for decisions where `decisions.user_id = auth.uid()`.
- Immutability: Database `UPDATE` on specific outcome fields blocked after 24 hours via Postgres trigger or API logic.

## UI Expectations
- Simple, calm modal appearing when clicking "Log Outcome" in history.
- Comparative view: Show the original "Prediction" and "Reasoning" side-by-side with the new outcome form.
- Impact score visualization (e.g., 5-point scale).
