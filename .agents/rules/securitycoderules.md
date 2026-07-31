---
trigger: always_on
---

Authentication & Session

Authentication between frontend and backend ALWAYS via iron-session (httpOnly, secure, sameSite=lax cookies)
SESSION_SECRET must be 32+ characters long and stored exclusively in an environment variable
Frontend NEVER communicates directly with the backend — all requests pass through the authenticated proxy (Next.js API Routes)
The proxy decrypts the cookie, extracts the user_id, and forwards it to the backend via the X-User-Id header
Backend validates the X-User-Id header on ALL protected routes using dependency injection
Tokens, session IDs, and refresh tokens are NEVER exposed to the frontend (not in localStorage, sessionStorage, or JS-accessible cookies)

Row Level Security (RLS)

ALL Supabase tables MUST have RLS enabled, without exception
Every table containing user data MUST have a user_id column with an isolation policy
Mandatory policies per table: SELECT, INSERT, UPDATE, DELETE filtered by auth.uid() = user_id
Public tables (e.g., plans) MUST have an explicit read-only policy
Write operations on public tables ONLY via service_role on the backend
Test isolation: User A must NEVER access User B's data

APIs & Endpoints

ALL API routes MUST be authenticated (except for health checks and explicitly public routes)
Mandatory input validation on ALL routes using Pydantic models
Rate limiting by user_id on sensitive routes (auth, content generation, billing)
Restrictive CORS: accept requests ONLY from frontend domains
Stripe webhooks MUST validate the signature before processing
File upload: validate MIME type, extension, and maximum size before acceptance

Frontend Data Protection

NEVER expose internal IDs (user_id, session_id, company_id, subscription_id) in the browser console
NEVER log sensitive data to console.log (tokens, emails, passwords, internal IDs)
NEVER include internal IDs in visible frontend URLs — use slugs or short UUIDs when necessary
Sensitive environment variables must NEVER have the NEXT_PUBLIC_ prefix
Error messages returned to the frontend must NEVER expose stack traces, SQL queries, or internal structure

Asynchronous Code

ALL FastAPI routes and services MUST be async
ALL calls to external APIs (Supabase, Stripe, LLMs, Fal.ai) MUST be awaited — never blocking
Stream AI responses via SSE (Server-Sent Events) — never wait for the full response before sending
Database and external API connections MUST have a configured timeout

AI Agents (LangGraph)

Agents MUST be implemented using LangGraph (state machine with nodes and transitions)
Each graph node MUST have a single responsibility and typed output
Agent responses MUST use Structured Output (Pydantic models) — never free-text for structured data
Agent tools MUST have individual error handling — a tool failure must not crash the graph
Agent prompts MUST be stored in separate files, never hardcoded within the logic

Code Quality
Functions & Methods

Functions MUST do only ONE thing — if you need "and" to describe it, split it into two
Maximum of 20 lines per function; extract sub-functions if it exceeds this limit
Maximum of 3 arguments per function — group them into an object, dataclass, or Pydantic model if it exceeds this limit
Functions must NOT have hidden side effects (e.g., altering global state or modifying a mutable argument without notice)
Function names MUST be descriptive verbs: create_subscription(), validate_input() — never process(), handle(), or do()

Naming & Readability

Names MUST reveal intent: `elapsed_time_in_days` instead of `d`, `is_active_subscription` instead of `flag`
Classes/models should use noun names: `Subscription`, `UserProfile` — avoid `Manager`, `Helper`, `Data`, `Info`
No ambiguous abbreviations: `usr`, `mgr`, `tmp` — write them out in full
Consistent naming: if `get_user` is used in one module, do not use `fetch_user` in another without a reason

Error Handling

Use exceptions instead of return codes — keep logic clean
NEVER return `None`/`null` to indicate an error — raise an exception with a clear message
NEVER pass `None`/`null` as a mutable default argument
`try`/`except` blocks MUST be specific: catch `ValueError`, `HTTPException` — NEVER use a generic `except Exception` (except for a top-level catch-all)
Domain errors MUST use custom exceptions: `SubscriptionExpiredError`, `QuotaExceededError`

Structure & Organization

Law of Demeter: NEVER chain access calls like `a.get_b().get_c().do_something()` — create a direct method instead
One file, one responsibility: do not mix routes, services, and schemas in the same file
Organized imports: stdlib → third-party → local (Python) / react → libs → components → utils (TypeScript)
Dead code (unused functions, unused imports, commented-out variables) MUST be removed, not commented out

README Documentation

Every completed new feature MUST be documented in the README.md, including: feature name, a brief description, and the workflow (step-by-step explanation of how it works).
Every significant fix MUST be documented in the README.md, including: what was fixed and the expected behavior after the fix.
Document ONLY features—do not document internal refactoring, configuration changes, or style adjustments.
The README MUST include a ## Features section with an up-to-date list of features and their workflows.

Coding Standards

Python: Type hints are mandatory for all functions and variables. No generic `Any`.
TypeScript: Strict mode enabled. No `any`, no `@ts-ignore`, no `as unknown as`.
Always use standard ecosystem libraries and components (e.g., shadcn/ui, Pydantic, Supabase client)—use custom code only if explicitly requested by the user.
Domain-based organization: each module contains its own routes, services, and schemas—never mix domains.
Secrets and API keys must be stored exclusively in `.env` files—NEVER hardcoded, NEVER committed to Git.
A `.env.example` file MUST exist containing all required variables, without actual values.