# Technical SOP: Authentication Flow

## Purpose
Manage secure, isolated user sessions to ensure that decision data is private and that the `user_id` invariant is maintained across all operations.

## Inputs
- Provider: Supabase Auth (Email/Password or OAuth).
- Session Callback: JWT token.

## Outputs
- Authenticated state in application context.
- `user_id` available for all API/Supabase calls.

## Edge Cases
- **Expired Token:** Automatic redirect to login or silent token refresh.
- **Unauthenticated Access:** Middleware protection for all routes except `/login` and `/signup`.

## Failure Handling
- **Login Failure:** Clear feedback on incorrect credentials or network issues.

## Database Interactions
- Supabase automatically manages the `auth.users` table.
- All application tables reference `auth.users.id`.

## Security Rules
- **RLS:** Mandatory `ENABLE ROW LEVEL SECURITY` on `decisions` and `outcomes`.
- All queries must use the Supabase client authenticated with the user's JWT.

## UI Expectations
- Minimal, clean login screen.
- User profile/logout button in the app header (once logged in).
- Smooth transition from login to dashboard.
