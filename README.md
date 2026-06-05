# DevDesk API

A production-grade multi-tenant team collaboration REST API modeled on tools like Linear and Jira.
Teams sign up as workspaces, invite members, manage projects and tasks, and subscribe to plans.
Built to demonstrate advanced backend engineering patterns.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| Payments | Stripe |
| Validation | Zod |
| Logging | Pino |
| Container | Docker + Docker Compose |
| Deployment | Render |

## Key Engineering Concepts

**Multi-Tenancy**
All data is scoped to a workspace. Every repository method receives `workspaceId`
as its first parameter — tenant isolation is enforced at the query level, not just
the route level.

**Workspace-Scoped RBAC**
Users have roles (OWNER, ADMIN, MEMBER) per workspace, not globally.
The JWT carries `workspaceId` and `role` after workspace selection.
Fine-grained permissions stored as JSON allow per-user capability overrides.

**Internal Event Bus**
Services emit typed events via a singleton EventEmitter.
Side effects (notifications, emails, audit logs) are handled by listeners —
never inside the service that triggered them.

**Idempotency**
Mutating endpoints accept an `Idempotency-Key` header.
Middleware checks Redis before processing — duplicate requests return
the cached response without re-executing business logic.

**Outbound Webhooks + HMAC Signing**
Workspace owners register HTTPS endpoints to receive platform events.
Payloads are signed with HMAC-SHA256. BullMQ handles delivery with
exponential backoff retry. Every attempt is logged in `WebhookDelivery`.

**Cursor Pagination**
All list endpoints use cursor-based pagination instead of offset.
Stable results under concurrent inserts, efficient at scale.

**Audit Logging**
Immutable append-only log of every meaningful action.
Written by event listeners, never by services directly.
Stores before/after state for change tracking.

**Per-Tenant Rate Limiting**
Redis sliding window rate limiter scoped per workspace.
Free and Pro plans have different request limits.
Standard `X-RateLimit-*` headers on every response.

**RFC 7807 Error Responses**
All errors follow a consistent machine-readable format.
Includes `code`, `message`, `details`, and `requestId` for tracing.

## Features

### Authentication
- JWT access tokens + refresh token rotation
- Workspace selection flow (separate token with workspaceId + role)
- Email verification
- Password reset

### Workspace Management
- Create and manage workspaces
- Invite members by email (token-based, 48hr expiry)
- Role management (OWNER, ADMIN, MEMBER)
- Granular permission overrides per member
- Plan-based feature limits

### Projects & Tasks
- Full project CRUD with archive support
- Task management with status, priority, assignee, due date
- Optimistic locking on concurrent task updates
- Event-driven side effects on assignment and status changes

### Notifications
- In-app notifications created by event listeners
- Mark as read / mark all as read
- Cursor-paginated notification feed

### Billing (Stripe)
- Workspace-level subscriptions (FREE / PRO)
- Seat-based plan enforcement
- Full webhook handling with idempotency
- Plan downgrade enforcement

### Outbound Webhooks
- Register HTTPS endpoints per workspace (Pro plan)
- HMAC-SHA256 payload signing
- BullMQ retry with exponential backoff
- Delivery history and manual test ping

### Audit Logs
- Immutable action history per workspace
- Filterable by resource type and resource ID
- Admin-only access, cursor paginated

## API Documentation
