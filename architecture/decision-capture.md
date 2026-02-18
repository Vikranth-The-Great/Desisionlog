# Technical SOP: Decision Capture

## Purpose
Provide a high-fidelity interface for the immutable capture of decision reasoning and context, ensuring thinking accountability by locking the core logic immediately upon submission.

## Inputs
- `title`: String (3-100 chars).
- `context`: Markdown (Problem statement, background).
- `reasoning`: Markdown (Why this path?).
- `options`: Array of objects (`text`, `rationale`).
- `chosen_option_id`: UUID (matching one of the options).
- `prediction`: Markdown (Expected outcome).
- `confidence`: Integer (1-5).
- `review_date`: ISO 8601 Date (Future).
- `tags`: Array of strings.

## Outputs
- `201 Created`: Full `Decision` object.
- Persisted `Decision` record in Supabase.
- Local draft cleared.

## Edge Cases
- **Session Timeout:** Draft must be saved to `localStorage` every 30 seconds.
- **Incomplete Options:** UI prevents submission if fewer than 2 options are defined.
- **Past Review Date:** UI prevents selection of dates in the past.

## Failure Handling
- **API Offline:** Store intent in `IndexedDB` and retry when online status returns.
- **Validation Error:** Highlight specific field constraints (e.g., character counts).

## Database Interactions
- `INSERT INTO decisions`: Full row creation with `user_id` from auth context.
- RLS ensures the operation only succeeds if the bearer token matches the `user_id`.

## Security Rules
- All string inputs sanitized via standard markdown sanitization library.
- Character limits enforced at both UI and API levels.

## UI Expectations
- Glassmorphic card design.
- Stepper or focus-mode layout to prevent distraction.
- Visual confirmation that "Reasoning" and "Context" will be locked forever after clicking "Save".
- Real-time character counters.
