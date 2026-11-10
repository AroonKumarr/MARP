# Multi-Agent Market Research Platform (MARP)
## Architecture Decision Records (ADRs)

**Document Version:** 1.0  
**Status:** Approved  
**Phase:** Core Architecture & Modules 01, 02, 03  

---

### ADR-001: Modular Monolith Architecture over Microservices

- **Context:** The MARP system requires deep relational integrity across users, workspaces, questionnaires, campaigns, locations, advertisements, and field assignments. Introducing separate microservices at this stage would introduce distributed transaction overhead, eventual consistency complexities, and network latency without tangible scaling benefits for the first three modules.
- **Decision:** Adopt a **Modular Monolith** architecture implemented in Python using FastAPI. The backend is structured into domain packages:
  - `app/modules/users/` (Auth, Workspaces, Users, RBAC, Devices, Audit)
  - `app/modules/questionnaires/` (Questionnaires, Questions, Branching, Translations, Versioning, Eligibility)
  - `app/modules/campaigns/` (Campaigns, Locations, Advertisements, Competitors, Assignments, Evidence)
  - `app/core/` (Configuration, Security, Exceptions, Dependencies)
  - `app/database/` (Session lifecycle, Base model, Engine configuration)
  - `app/common/` (Shared schemas, pagination, utilities)
- **Consequences:** Provides strict compile-time type safety via Pydantic v2, atomic database transactions across domain boundaries, zero inter-service network latency, and simple local Docker Compose deployment, while keeping module boundaries clean for future microservice extraction if needed.

---

### ADR-002: Tenant Isolation Strategy (Multi-Tenancy)

- **Context:** Market research data involves sensitive enterprise information (proprietary surveys, billboard contract dimensions, competitor audits). Data from Company A must never be accessible or modifiable by Company B.
- **Decision:** Implement **Logical Multi-Tenancy with a Company Discriminator** (`company_id`) on all tenant-owned entities.
  - Every incoming API request passes through the `get_current_active_user` and `get_current_company` dependency.
  - Repository and service layers inject `company_id` into all queries (`WHERE company_id = :current_company_id`) and enforce it on insertions and updates.
  - Foreign key relations prevent referencing entities from foreign workspaces.
- **Consequences:** Avoids database-per-tenant migration complexity while guaranteeing cryptographic and logical isolation. No user can access or mutate cross-company records simply by altering query parameters or URL path variables.

---

### ADR-003: Database Persistence, ORM & Migrations

- **Context:** The system demands foreign keys, check constraints, composite unique indexes, cascaded soft-deletes, and audit logging.
- **Decision:** Utilize **PostgreSQL 15+** managed via **SQLAlchemy 2.0 (Declarative Base)** and **Alembic** for schema migrations.
  - All models inherit from an abstract `TimestampedUUIDModel` providing an indexed UUIDv4 primary key (`id`) and UTC timestamps (`created_at`, `updated_at`).
  - Strict foreign keys with `ON DELETE CASCADE` or `RESTRICT` rules to enforce referential integrity.
- **Consequences:** Clean schema evolution, reproducible test databases, and automated migrations runnable via `alembic upgrade head`.

---

### ADR-004: UI/UX Architecture & Exact Reference Video Reproduction

- **Context:** The project requires a bespoke, modern SaaS aesthetic matching the reference video and screenshot (`references/SCR-20261110-ndni.png`), avoiding standard Bootstrap or generic template looks.
- **Decision:**
  - Outer background: Warm taupe canvas (`#E6E2D8`).
  - Inner workspace: Rounded ivory canvas (`#F7F5EC` / `#FAF8F3`) with 32px corner radius.
  - Sidebar: Narrow jet-black container (`#111111`) with circular/squircle navigation icons and active-state pill indicators.
  - Cards: High-contrast white cards (`#FFFFFF`) with 20px corner radius, soft natural shadows (`box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05)`).
  - Accent Color Tokens: Lime Accent (`#D9F66A`), Periwinkle Blue (`#91ACF8`), Lavender (`#B6A0F3`), Mint Green (`#9DD9C7`), Soft Orange (`#F2B77C`).
  - Component System: Built using Tailwind CSS with custom design tokens registered in `design-system/tokens.css` and Next.js 14 App Router.
- **Consequences:** Immediate visual parity with the design reference, unified layout across all three modules, and responsive adaptability across desktop, laptop, tablet, and mobile.

---

### ADR-005: Role-Based Access Control (RBAC) Model

- **Context:** The SRS and prompt demand fine-grained authorization across 5 distinct operational roles:
  1. `Company Administrator`
  2. `Research Manager`
  3. `Analyst`
  4. `Field Staff`
  5. `Evidence Reviewer`
- **Decision:** Implement a dual-layer RBAC model:
  - Relational mapping: `User` -> `user_roles` -> `Role` -> `role_permissions` -> `Permission`.
  - Backend enforcement via FastAPI dependency: `@require_permission("questionnaires:publish")` and `@require_role(["Company Administrator", "Research Manager"])`.
  - Frontend hydration: Token contains current role and granted permissions; UI selectively renders action buttons, but backend strictly validates every request.
- **Consequences:** Robust security that cannot be bypassed via browser dev tools or direct HTTP clients.

---

### ADR-006: Immutable Questionnaire Versioning & Dynamic Branching

- **Context:** Modifying a live, published questionnaire would corrupt in-flight survey responses and historical audits.
- **Decision:**
  - Questionnaires have a status of `Draft`, `Published`, or `Archived`.
  - When published, the questionnaire and all its questions, options, and rules are snapshotted into an immutable `questionnaire_versions` record with an incremented version number (`v1.0`, `v1.1`, etc.).
  - Edits to a published questionnaire automatically branch into a new `Draft` version.
  - Branching logic is modeled as first-class `BranchingRule` records evaluated deterministically by an in-memory rule engine in both backend and frontend preview modes.
- **Consequences:** Ensures audit compliance, allows field staff to complete historical surveys safely, and delivers an intuitive visual builder experience.

---

### ADR-007: Hierarchical Location Representation

- **Context:** Outdoor market research requires navigating geographic entities from country level down to specific billboard poles or retail intersections (`Pakistan -> Province -> City -> Area -> Site`).
- **Decision:** Implement an Adjacency List pattern with recursive hierarchy in the `Location` table:
  - Columns: `id`, `company_id`, `parent_id` (foreign key to `Location.id`, nullable for root), `name`, `code`, `level` (Enum: `country`, `province`, `city`, `area`, `site`), `latitude`, `longitude`, `metadata_json`.
  - Fast tree queries and ancestor path lookups.
- **Consequences:** Extremely flexible; allows arbitrary depth while strictly supporting the required 5-tier Pakistan administrative hierarchy.

---

### ADR-008: Real Database-Backed Operational Dashboard

- **Context:** The Master Prompt strictly prohibits fake hardcoded arrays, demo numbers, or inert widgets.
- **Decision:**
  - Create dedicated aggregation endpoints under `/api/v1/dashboard/`:
    - `/metrics`: Queries real counts for active campaigns, field staff, published surveys, and pending reviews.
    - `/workflow-board`: Queries real assignments mapped to `To Do` (`Scheduled`), `In Progress` (`In Progress`), and `Review` (`Completed`).
    - `/analytics/donut`: Aggregates real questionnaires by research category.
    - `/analytics/weekly`: Aggregates active field assignments and audit activity over the last 7 days.
  - For empty databases: Render zero metrics, clean empty state illustrations, and actionable "Create Campaign" / "Add User" call-to-actions.
- **Consequences:** 100% data integrity, production reliability, and zero risk of academic FYP evaluation failure due to simulated static data.

---
*Architecture baseline finalized and verified against system specifications.*
