# Multi-Agent Market Research Platform (MARP)
## Requirements Analysis & Scope Baseline (Modules 01, 02, 03)

**Document Version:** 1.0  
**Date:** November 2026  
**Authors:** Aroon Kumar (2312466), Mudasir Ali (2312465), Abdullah Zafar Khan (2312467)  
**Supervisor:** Mr. Zubair Ahmed  
**Institution:** SZABIST Islamabad Campus — Department of Computer Science  

---

## 1. Executive Summary & Purpose

The Multi-Agent Market Research Platform (MARP) is designed to solve major industry bottlenecks in out-of-home (OOH) advertising audit and retail field research. Historically, field research organizations lose upwards of 50 staff-hours per 100 audit locations due to fragmented tools: disconnected spreadsheets, unlinked field photographs, manual survey forms, and manual verification against digital campaign registries.

While the complete MARP project architecture comprises 12 interconnected modules spanning mobile data collection, offline incremental synchronization, media quality checking, and multi-agent coordination, this delivery baseline focuses strictly on the foundational **First Three Modules**:
1. **Module 01: User Management & Company Workspace Isolation**
2. **Module 02: Questionnaire Management & Visual Builder**
3. **Module 03: Campaign Management & Hierarchical Asset Registry**

This document establishes the verified functional and non-functional requirements extracted directly from approved university documentation (Chapter 1 Introduction, Chapter 2 Literature Review, Chapter 3 Software Requirements Specification, Long Proposal, Short One-Pager, and Project Overview).

---

## 2. Requirements Extracted from Project Documentation

### 2.1 Sources of Truth
- **Chapter 1 — Introduction and Project Scope:** Outlines the high-level business problem, $9.46B OOH advertising market context, and multi-tenant operational structure.
- **Chapter 2 — Background & Literature Review:** Identifies gaps in Qualtrics, SurveyMonkey, and ODK Collect regarding campaign-linked evidence, hierarchical site structures, and billboard registries.
- **Chapter 3 — Software Requirements Specification (SRS):** Establishes FR-001 (Administrator can manage access), FR-002 (Researcher can manage surveys), FR-003 (Researcher can manage assignments), and FR-007 (Researcher can compare competitors), alongside strict quality attributes for multi-tenant data protection, localization (Urdu RTL), and sub-second response times.
- **Long Proposal & Overview:** Details the 12-module breakdown, assigning Module 01 to Aroon Kumar, Module 02 to Mudasir Ali, and Module 03 to Abdullah Zafar Khan.

---

## 3. Detailed Scope for the First Three Modules

### Module 01: User Management & Workspaces
*Lead: Aroon Kumar (2312466)*

1. **Company Workspace Isolation:**
   - Multi-tenant architecture with company-level data isolation.
   - Company workspace provisioning, profile settings (name, industry, contact email, phone, address, timezone, branding accent).
   - Strict tenant scoping on all database queries and mutations.

2. **Authentication & Account Lifecycle:**
   - User registration and invitation workflows with secure tokens.
   - Login, logout, and token revocation.
   - Secure password hashing using PBKDF2/bcrypt.
   - Password reset workflow with time-limited cryptographic tokens.
   - Full CRUD on user accounts: Add, Edit, View, Deactivate, Reactivate.
   - User profile management (avatar, display name, phone, department, bio).
   - Search, multi-role filter, status filter, and pagination.

3. **Role-Based Access Control (RBAC):**
   - 5 Standard Enterprise Roles:
     - `Company Administrator`: Workspace governance, user management, audit logs, system settings.
     - `Research Manager`: Questionnaire creation, publishing, campaign management, assignments.
     - `Analyst`: Survey inspection, competitor comparison, reporting analytics.
     - `Field Staff`: Mobile/field collection assignments, site inspection execution.
     - `Evidence Reviewer`: Submission validation, photo quality inspection, verification.
   - Explicit permission checks enforced on the backend (FastAPI security dependencies), never relying solely on frontend element hiding.

4. **Registered Device Management:**
   - Registry of field worker Android devices.
   - Device identifiers (Device ID / UUID, device model, manufacturer, OS version, app version).
   - Authorization status: `Pending Approval`, `Approved`, `Revoked`, `Deactivated`.
   - Tracking of last active timestamp and assigned user.
   - Action to revoke/deactivate lost or untrusted devices.

5. **Audit Logging & Activity Records:**
   - Comprehensive audit trail recording `actor_id`, `company_id`, `action`, `resource_type`, `resource_id`, `timestamp`, `ip_address`, and structured `metadata_json`.
   - Key recorded events: user login/logout, password changes, user provisioning/deactivation, role modifications, device approvals/revocations, questionnaire publishing, and campaign status transitions.

---

### Module 02: Questionnaire Management & Visual Builder
*Lead: Mudasir Ali (2312465)*

1. **Questionnaire Library & Taxonomy:**
   - Multi-category market research templates:
     - `Retail Surveys` (shelf presence, merchandising, store manager feedback).
     - `Billboard Surveys` (structure audit, illumination, visibility angle, physical damage).
     - `Competitor Surveys` (share of voice, pricing, competitive promotional display).
     - `Field Research Surveys` (demographics, consumer intercepts, foot-traffic counts).
   - Full lifecycle states: `Draft`, `Published`, `Archived`.
   - Search, category filter, status filter, and duplication mechanism.

2. **Visual Questionnaire Builder:**
   - Rich interactive question design canvas with drag-and-drop or reordering buttons.
   - Supported Question Types:
     - Short Answer (single line text).
     - Long Answer (multi-line text / observations).
     - Single Choice (radio options).
     - Multiple Choice / Checkboxes.
     - Dropdown select.
     - Rating Scale (1 to 5 or 1 to 10 stars/numerical scales).
     - Date and Time pickers.
     - Image / Evidence upload attachment slot.
     - Location / GPS capture field.
   - Question configuration: Required flag, helper descriptions, validation rules (min/max characters, min/max values), option lists.

3. **Conditional Branching Logic:**
   - Deterministic rule engine for dynamic questionnaires.
   - Condition triggers: e.g., `If Question [Billboard Condition] Equals [Poor] -> Show Question [Upload Damage Photograph]`.
   - Operators: `equals`, `not_equals`, `contains`, `greater_than`, `less_than`.
   - Real-time rule evaluation in preview mode.

4. **Multilingual Support (English & Urdu):**
   - Full bilingual questionnaire configuration.
   - Urdu translations for question prompts, descriptions, and answer options.
   - Right-to-Left (RTL) layout switching in preview mode with appropriate Urdu typography styling.

5. **Respondent Eligibility & OTP Controls:**
   - Access controls: Public access, invite-only, or OTP verification required.
   - Minimum age requirements, geographic targeting criteria, and respondent quota constraints.
   - Real configuration interface with status indicators and SMS/OTP gateway readiness check.

6. **Version Management & Immutability:**
   - Semantic versioning (`v1.0`, `v1.1`, `v2.0`).
   - Immutable published versions: Editing a published questionnaire automatically branches into a new draft version, safeguarding historical submission integrity.
   - Version history timeline with diffs and rollback capabilities.

---

### Module 03: Campaign Management & Asset Registry
*Lead: Abdullah Zafar Khan (2312467)*

1. **Campaign Lifecycle & Governance:**
   - Campaign attributes: Title, code, research objectives, budget, client/brand, research category, start date, end date, assigned campaign manager.
   - Statuses: `Planning`, `Active`, `In Progress`, `Completed`, `On Hold`, `Archived`.
   - Search, filter by status, filter by date range, and comprehensive detail views.

2. **Billboard & Advertisement Registry:**
   - Out-Of-Home (OOH) media registry.
   - Attributes: Name/Code, ad type (Static Billboard, Digital LED, Unipole, Gantry, Transit/Bus shelter, Wall branding), brand name, dimensions (width × height in feet), orientation, illumination type, location link, campaign association, status.
   - Media references and specification sheets.

3. **Competitor Intelligence Management:**
   - Competitor profiles (competitor name, parent corporation, brand tier, market presence).
   - Competitor campaign tracking and competitor ad registry.
   - Geographical linking to compare competing brand presence across identical cities/areas.
   - Side-by-side competitor comparison view.

4. **Hierarchical Location Management:**
   - 5-tier parent-child geographic hierarchy:
     `Country (Pakistan)` → `Province` (e.g., Punjab, Sindh, KPK, Balochistan, ICT) → `City` (e.g., Islamabad, Rawalpindi, Lahore, Karachi) → `Area` (e.g., F-6, Blue Area, Gulberg, Clifton) → `Site / Point of Interest` (specific intersection, store, or billboard pole coordinate).
   - Latitude/Longitude GPS coordinates and address metadata.
   - Tree navigation, search, and selection dialogs for campaign and ad linking.

5. **Field Staff Assignment & Scheduling:**
   - Assignment of authorized, active `Field Staff` users to specific campaigns and locations.
   - Scheduling parameters: Start date, end date, target quota, priority (`High`, `Medium`, `Low`), instructions.
   - Assignment tracking: `Scheduled`, `Dispatched`, `In Progress`, `Completed`, `Cancelled`.
   - Validation ensuring only active, verified field staff members are assignable.

6. **Relational Linking & Evidence Metadata:**
   - Strong foreign key relationships binding Campaigns, Questionnaires, Locations, Advertisements, and Field Staff.
   - Evidence metadata references (photo link, timestamp, GPS coordinate, verification status).

---

## 4. Out-of-Scope Functionality (Deferred to Sprints 2–5)

To maintain architectural integrity and prevent scope creep, the following modules from the 12-module roadmap are explicitly marked as **Out of Scope** for this phase:
1. **Module 04 (Attendance Verification):** Mobile geofence monitoring background service.
2. **Module 05 (Data Synchronization):** SQLite offline queue binary synchronization protocol.
3. **Module 06 (Field Data-Collection Mobile App):** Native Android Kotlin/Flutter mobile build.
4. **Module 07 (AI Verification):** LangGraph computer vision billboard glare/occlusion models.
5. **Module 08 (Market Intelligence):** Automated web scraping bots and crawler workers.
6. **Module 09 (Media Processing):** Raw audio pitch and visual enhancement pipelines.
7. **Module 10 (Agent Orchestration):** Multi-agent supervisor coordinating automated research swarms.
8. **Module 11 (Field Performance):** Gamification and reward compensation algorithms.
9. **Module 12 (AI-Agent Analytics):** Automated LLM executive summary narrative generators.

*Note: The platform is architected with modular service boundaries so that these modules plug directly into the PostgreSQL schema and FastAPI routers created in this phase.*

---

## 5. Technical Assumptions & Environment

1. **Deployment Architecture:** Modular monolith backend with clean domain separation (`app/modules/users`, `app/modules/questionnaires`, `app/modules/campaigns`), communicating via typed schemas and database relationships.
2. **Database Engine:** PostgreSQL 15+ using SQLAlchemy 2.0 ORM with Alembic schema migrations.
3. **Web Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React icons, and Recharts.
4. **Multi-Tenancy Model:** Shared database with discriminator column (`company_id`) on all tenant-scoped tables, strictly enforced at the repository and service layer.
5. **Localization:** Web frontend supports bilingual preview (English LTR and Urdu RTL) with localized date/number formatting.
6. **Authentication:** Bearer JWT tokens with secure HTTP-only session cookies and cryptographic password hashing.

---

## 6. Documented Requirement Conflicts & Resolutions

| Item | Document 1 | Document 2 | Architectural Resolution |
|------|------------|------------|--------------------------|
| **Mobile Tech** | Long Proposal mentions "Flutter, Dart" | Chapter 3 & SRS mentions "Kotlin Android client, SQLite" | The web application and backend expose RESTful JSON APIs compatible with both Kotlin and Flutter; web dashboard is implemented using Next.js/React. |
| **User Roles** | Chapter 3 mentions 5 roles (Administrator, Researcher, Surveyor, Reviewer, Respondent) | Master Prompt specifies standard Enterprise roles: Company Administrator, Research Manager, Analyst, Field Staff, Evidence Reviewer | We adopt the Master Prompt's enterprise taxonomy (`Company Administrator`, `Research Manager`, `Research Analyst`, `Field Staff`, `Evidence Reviewer`), which maps cleanly onto the SRS permission structure. |
| **Evidence Media** | Chapter 3 mentions raw audio & photo pipeline | Master Prompt states "Do not prematurely implement separate Media Processing module" | We implement full relational evidence tracking (metadata, URLs, campaign links, location links, review flags), while deferring binary audio pitch processing to Sprint 3. |

---
*Verified against SZABIST FYP Documentation & Course Guidelines.*
