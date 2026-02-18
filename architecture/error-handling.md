# Architecture: Error Handling Strategy

## 1. Error Categories

### Validation Errors
- **Definition:** User input fails to meet schema constraints (e.g., character limits, missing fields, invalid confidence score).
- **API Response:** `400 Bad Request` with a structured payload:
  ```json
  {
    "error": "validation_failed",
    "details": [
      { "field": "confidence", "message": "Must be between 1 and 5" }
    ]
  }
  ```
- **Frontend Display:** In-line field validation messages and error coloring on specific form inputs.

### Auth Errors
- **Definition:** Missing JWT, expired token, or unauthorized access to a resource owned by another user.
- **API Response:** `401 Unauthorized` (identity missing) or `403 Forbidden` (identity present but permission denied via RLS).
- **Frontend Display:** Immediate redirection to `/login` with a clear "Session expired" toast notification.

### Database Constraint Errors
- **Definition:** SQL violations such as unique constraint failures (e.g., second outcome for the same decision) or foreign key failures.
- **API Response:** `409 Conflict` (for unique violations) or `400 Bad Request` (for foreign key/check constraints).
- **Frontend Display:** Logic-specific alerts (e.g., "Outcome already exists for this decision").

### Unexpected Server Errors
- **Definition:** Crashes, unhandled exceptions, or upstream service (Supabase/Vercel) outages.
- **API Response:** `500 Internal Server Error`.
- **Frontend Display:** Global error boundary showing a "Something went wrong" calm screen with a "Try again" button.

### Network Failure Behavior
- **Definition:** Client is offline or request times out before reaching the server.
- **Detection:** Navigator online status and fetch timeout.
- **Frontend Behavior:**
  - Save current form state to `localStorage` immediately.
  - Display a non-intrusive "Offline: Changes saved locally" banner.
  - Disable "Submit" buttons until connection is restored.

---

## 2. System Rules

### API Response Standard
- Every non-2xx response must return a `json` body containing an `error` code and a human-readable `message`.

### Logging Policies
- **Client-Side:** Errors must be captured with context (Route, User ID, Input Shape) and logged to a monitoring service (e.g., Sentry) in production.
- **Server-Side:** Log all `500` errors with full stack traces. Log `401/403` violations for security audit.

### User Experience
- Errors must never use technical jargon (No "Postgres Error 23505").
- Errors must always offer a recovery path (e.g., "Adjust your input", "Log in again", "Retry").
- Interface must remain "Calm" even during failure—use muted red tones and soft transitions.
