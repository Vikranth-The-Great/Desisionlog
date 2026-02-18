# Gemini - Project Constitution (Decision Log)

## Data Schema

### 1. Decision
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "ISO-8601 string",
  "updated_at": "ISO-8601 string",
  "title": "string",
  "context": "string",
  "reasoning": "string",
  "options": [
    {
      "id": "uuid",
      "text": "string",
      "rationale": "string"
    }
  ],
  "chosen_option_id": "uuid",
  "prediction": "string",
  "confidence": "integer (1-5)",
  "status": "enum: pending | completed | abandoned",
  "review_date": "ISO-8601 string",
  "tags": ["string"]
}
```

### 2. Outcome
```json
{
  "id": "uuid",
  "decision_id": "uuid",
  "user_id": "uuid",
  "created_at": "ISO-8601 string",
  "updated_at": "ISO-8601 string",
  "result": "enum: good | bad | mixed",
  "impact_score": "integer (1-5)",
  "lessons_learned": "string",
  "was_correct_choice": "boolean"
}
```

## REST API Contracts

### 1. POST /api/decisions
Creates a new decision locked for accountability.
- **Auth:** Required (JWT)
- **Validation Rules:**
  - `title`: string (3-100 chars)
  - `context`: string (max 2000 chars)
  - `reasoning`: string (max 5000 chars)
  - `options`: array (2-5 items)
  - `confidence`: int (1-5)
  - `review_date`: ISO 8601 (must be in future)
- **Input JSON:**
```json
{
  "user_id": "uuid",
  "title": "string",
  "context": "string",
  "reasoning": "string",
  "options": [{ "text": "string", "rationale": "string" }],
  "chosen_option_id": "uuid",
  "prediction": "string",
  "confidence": "integer (1-5)",
  "review_date": "ISO-8601 string",
  "tags": ["string"]
}
```
- **Response JSON (201 Created):** Full `Decision` object.
- **Error Cases:**
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: Missing/invalid token.

### 2. GET /api/decisions
Retrieves user's decision history including outcomes.
- **Auth:** Required (JWT)
- **Input:** None (User identity derived from JWT).
- **Response JSON (200 OK):**
```json
[
  {
    "id": "uuid",
    "...": "decision fields",
    "outcome": { "id": "uuid", "...": "outcome fields" } | null
  }
]
```
- **Error Cases:**
  - `401 Unauthorized`: Missing/invalid token.

### 3. POST /api/outcomes
Logs the outcome for an existing decision.
- **Auth:** Required (JWT)
- **Validation Rules:**
  - `decision_id`: uuid (must exist, must be user-owned)
  - `result`: "good" | "bad" | "mixed"
  - `impact_score`: int (1-5)
  - `was_correct_choice`: boolean
- **Input JSON:**
```json
{
  "user_id": "uuid",
  "decision_id": "uuid",
  "result": "enum: good | bad | mixed",
  "impact_score": "integer (1-5)",
  "lessons_learned": "string",
  "was_correct_choice": "boolean"
}
```
- **Response JSON (201 Created):** Full `Outcome` object.
- **Error Cases:**
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: Missing/invalid token.
  - `404 Not Found`: Decision ID not found for user.
  - `409 Conflict`: Outcome already exists for this decision.

### 4. DELETE /api/decisions/:id
Hard deletes a decision and cascaded outcome.
- **Auth:** Required (JWT)
- **Input:** `id` in path.
- **Response:** `204 No Content`.
- **Error Cases:**
  - `401 Unauthorized`: Missing/invalid token.
  - `404 Not Found`: Decision ID not found for user.

## Database Structure (Supabase)

### Table: `decisions`
- `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
- `user_id`: `uuid` (Required, references `auth.users`)
- `created_at`: `timestamptz` (default: `now()`)
- `updated_at`: `timestamptz` (default: `now()`)
- `title`: `text` (Required)
- `context`: `text` (Required)
- `reasoning`: `text` (Required, Immutable after creation)
- `options`: `jsonb` (Required, Array of `{id: uuid, text: string, rationale: string}`)
- `chosen_option_id`: `uuid` (Required)
- `prediction`: `text` (Required)
- `confidence`: `int2` (Constraint: `confidence BETWEEN 1 AND 5`)
- `status`: `text` (Constraint: `status IN ('pending', 'completed', 'abandoned')`, default: `'pending'`)
- `review_date`: `timestamptz` (Required)
- `tags`: `text[]` (default: `'{}'`)

### Table: `outcomes`
- `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
- `decision_id`: `uuid` (Required, Unique, references `decisions.id`)
- `user_id`: `uuid` (Required, references `auth.users`)
- `created_at`: `timestamptz` (default: `now()`)
- `updated_at`: `timestamptz` (default: `now()`)
- `result`: `text` (Constraint: `result IN ('good', 'bad', 'mixed')`)
- `impact_score`: `int2` (Constraint: `impact_score BETWEEN 1 AND 5`)
- `lessons_learned`: `text` (Required)
- `was_correct_choice`: `boolean` (Required)

### Relationships & Rules
- **Foreign Keys**: Strict references to `auth.users` for data isolation.
- **Cascade**: `outcomes.decision_id` ON DELETE CASCADE.
- **Index**: 
  - `idx_decisions_user_id`
  - `idx_outcomes_user_id`
  - `idx_decisions_status`

## Behavioral Rules

### 1. Editability & Immutability
- **Decisions:** Once submitted, `context`, `reasoning`, `choices`, and `predictions` are permanently locked. Only `title`, `tags`, and `review_date` can be edited to maintain organization.
- **Outcomes:** Outcomes can be edited for 24 hours after submission to fix typos. After 24 hours, they are locked permanently to prevent rewriting history based on hindsight bias.

### 2. Deletion Policy
- **Hard Delete:** Deleting a decision performs a hard delete from the database.
- **Cascade:** Deleting a decision triggers an automatic `ON DELETE CASCADE` for the associated outcome.

### 3. State & Edge Cases
- **Decision without Outcome:** Valid (Status: `pending`).
- **Outcome without Decision:** Impossible (FK constraint enforced).
- **Auth Session Expiry:** System must save drafts to `localStorage` during creation/review to mitigate data loss on session timeout.

### 4. History & Sorting
- **Pagination:** v1 will load all decisions (infinite scroll or simple list). No page-based pagination.
- **Sorting Rule:** 
  - **Primary:** `status` (Pending first).
  - **Secondary:** `created_at` (Descending - Newest first).

## Architectural Invariants
1. **Reasoning Immutability**: Decision reasoning and context cannot be modified after initial creation. This is a core v1 rule to prevent hindsight bias software manipulation.
2. **Outcome Cardinality**: A decision has exactly zero or one outcome.
3. **No Analytics**: No aggregation, scoring, or automated analytics engines allowed in v1.
4. **User Scoping**: Every database operation and API call MUST be scoped to the authenticated `user_id`.
5. **Strict Data Compliance**: All data entering or leaving the system must strictly match the JSON schemas and ISO 8601 formatting.

## Security Rules
- **RLS Enforcement**: Row Level Security must be enabled on all tables, granting access only if `auth.uid() = user_id`.
- **Sanitization**: All text inputs must be sanitized to prevent XSS.

## Naming Conventions
- **Tables**: plural snake_case.
- **Columns**: snake_case.
- **Files**: lowercase-hyphenated.
- **Variables**: camelCase.
- **Constants:** UPPER_SNAKE_CASE.

## Constitution Lock
“This document governs all architectural decisions. Code must follow this schema. If schema changes, gemini.md must be updated first.”
