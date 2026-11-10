# Final Year Project (FYP) — Database Architecture & Student Responsibility Matrix
## Multi-Agent Market Research Platform (MARP)

This document provides the definitive architectural breakdown of the relational database schema implemented for the **Multi-Agent Market Research Platform (MARP)** across its first three core modules.

A single unified Entity Relationship Diagram (ERD) is partitioned into **three visually marked circles**, attributing every table, relationship, and technical guarantee to its assigned student contributor:

1. **Circle 1: Aroon Kumar (Seat No: 2312466)** — Module 01: User Management & Workspace Isolation
2. **Circle 2: Mudasir Ali (Seat No: 2312465)** — Module 02: Questionnaire Management & Dynamic Logic
3. **Circle 3: Abdullah Zafar Khan (Seat No: 2312467)** — Module 03: Campaign Management & Asset Registry

---

## 1. Visual Diagram Artifacts

The unified ERD with the three marked student circles is available in vector and raster formats:

- **Vector SVG Diagram:** [`docs/database/erd_students_annotated.svg`](file:///Users/aroonkumar/Developer/MARP/docs/database/erd_students_annotated.svg)
- **High-Resolution PNG Diagram:** [`docs/database/erd_students_annotated.png`](file:///Users/aroonkumar/Developer/MARP/docs/database/erd_students_annotated.png)
- **Interactive UI Preview:** Open the MARP web application at `/settings` and click the **"3-Circle Student ERD"** tab.

---

## 2. Student 1 Breakdown: Aroon Kumar (2312466)
### Module 01 — User Management & Workspace Isolation

```
           ┌────────────────────────────────────────────────────────┐
           │     CIRCLE 1: AROON KUMAR (SEAT NO: 2312466)           │
           │     Module 01: User Management & Workspace Isolation   │
           └──────────────────────────┬─────────────────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
┌──────▼──────┐             ┌─────────▼─────────┐          ┌─────────▼────────┐
│  COMPANIES  │────────────►│WORKSPACE_SETTINGS │          │ REGISTERED_DEVICES│
└──────┬──────┘             └───────────────────┘          └─────────▲────────┘
       │                                                             │
       ├──────────────────────────────┬──────────────────────────────┤
       │                              │                              │
┌──────▼──────┐             ┌─────────▼─────────┐          ┌─────────▼────────┐
│    USERS    │────────────►│  USER_INVITATIONS │          │    AUDIT_LOGS    │
└──────┬──────┘             └───────────────────┘          └──────────────────┘
       │
       ├──────────────────────────────┐
       │                              │
┌──────▼──────┐             ┌─────────▼─────────┐
│ USER_ROLES  │◄────────────│       ROLES       │
└─────────────┘             └─────────┬─────────┘
                                      │
                            ┌─────────▼─────────┐          ┌──────────────────┐
                            │ ROLE_PERMISSIONS  │◄─────────│   PERMISSIONS    │
                            └───────────────────┘          └──────────────────┘
```

### Table Definitions (10 Entities)
| # | Entity Name | Description | Key Primary & Foreign Constraints |
|---|---|---|---|
| 1 | `COMPANIES` | Multi-tenant tenant boundaries, company profiles, and industry domain. | `id` (PK, UUID), `slug` (UK) |
| 2 | `WORKSPACE_SETTINGS` | Security rules, MFA mandates, auto-approval flags, and UI branding tokens. | `id` (PK), `company_id` (FK -> `COMPANIES.id`) |
| 3 | `USERS` | User credentials, bcrypt password hashes, profile avatars, and active flags. | `id` (PK), `company_id` (FK), `email` (UK) |
| 4 | `USER_INVITATIONS` | Cryptographic invite tokens with expiration for employee onboarding. | `id` (PK), `company_id` (FK), `token` (UK) |
| 5 | `ROLES` | 5 Enterprise RBAC Roles (Admin, Research Manager, Analyst, Field Staff, Reviewer). | `id` (PK), `name` (UK) |
| 6 | `PERMISSIONS` | Fine-grained capability privileges for backend endpoints and actions. | `id` (PK), `code` (UK) |
| 7 | `USER_ROLES` | Many-to-many relationship mapping users to system roles. | `(user_id, role_id)` (Composite PK & FKs) |
| 8 | `ROLE_PERMISSIONS` | Many-to-many relationship mapping roles to granted permission codes. | `(role_id, permission_id)` (Composite PK & FKs) |
| 9 | `REGISTERED_DEVICES` | Android mobile hardware registration, IMEI identity, OS and app versions. | `id` (PK), `device_identifier` (UK), `user_id` (FK) |
| 10 | `AUDIT_LOGS` | Tamper-evident forensic ledger capturing actor, action, resource, IP and JSON. | `id` (PK), `company_id` (FK), `actor_id` (FK) |

### Technical Architectural Guarantees
- **Strict Multi-Tenant Isolation:** All operations enforce `company_id` checks preventing horizontal data access violations.
- **Role-Based Access Control:** Configurable 5-role capability matrix evaluated on backend middleware routes.
- **Hardware Binding:** Surveyor access is restricted to verified Android devices identified by unique hardware tokens.

---

## 3. Student 2 Breakdown: Mudasir Ali (2312465)
### Module 02 — Questionnaire Management & Logic Engine

```
           ┌────────────────────────────────────────────────────────┐
           │     CIRCLE 2: MUDASIR ALI (SEAT NO: 2312465)           │
           │     Module 02: Questionnaire Management & Logic        │
           └──────────────────────────┬─────────────────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
┌──────▼──────┐             ┌─────────▼───────────┐        ┌─────────▼────────┐
│QUESTIONNAIRE│────────────►│QUESTIONNAIRE_VERSION│        │ QUESTIONNAIRE_   │
└──────┬──────┘             └─────────────────────┘        │  ELIGIBILITIES   │
       │                                                   └──────────────────┘
       ├──────────────────────────────┬──────────────────────────────┤
       │                              │                              │
┌──────▼──────┐             ┌─────────▼─────────┐          ┌─────────▼────────┐
│  QUESTIONS  │────────────►│  QUESTION_OPTIONS │          │OTP_CONFIGURATIONS│
└──────┬──────┘             └───────────────────┘          └──────────────────┘
       │
       ├──────────────────────────────┐
       │                              │
┌──────▼──────┐             ┌─────────▼─────────┐
│QUESTION_    │             │  BRANCHING_RULES  │
│TRANSLATIONS │             │  (Show/Hide/Skip) │
└─────────────┘             └───────────────────┘
```

### Table Definitions (8 Entities)
| # | Entity Name | Description | Key Primary & Foreign Constraints |
|---|---|---|---|
| 1 | `QUESTIONNAIRES` | Survey library definitions across Billboard, Retail, Competitor, Field categories. | `id` (PK), `company_id` (FK), `created_by` (FK) |
| 2 | `QUESTIONNAIRE_VERSIONS` | Sealed immutable JSON schema snapshots produced when publishing surveys. | `id` (PK), `questionnaire_id` (FK), `version_number` |
| 3 | `QUESTIONS` | Dynamic questionnaire items supporting 10 distinct question data types. | `id` (PK), `questionnaire_id` (FK), `order_index` |
| 4 | `QUESTION_OPTIONS` | Selectable choices, weights, and items for radio, dropdown, and checkbox items. | `id` (PK), `question_id` (FK), `order_index` |
| 5 | `QUESTION_TRANSLATIONS`| Multilingual localization storing English and Urdu right-to-left (RTL) copy. | `id` (PK), `question_id` (FK), `language_code` |
| 6 | `BRANCHING_RULES` | Dynamic conditional rules (`equals`, `contains`) triggering `show`, `hide`, `skip`. | `id` (PK), `source_question_id` (FK), `target_question_id` (FK) |
| 7 | `QUESTIONNAIRE_ELIGIBILITIES` | Demographic targeting constraints (min/max age, allowed genders, city quotas). | `id` (PK), `questionnaire_id` (FK, UK) |
| 8 | `OTP_CONFIGURATIONS` | Mobile carrier OTP verification constraints, expiry seconds, and retry throttles. | `id` (PK), `questionnaire_id` (FK, UK) |

### Technical Architectural Guarantees
- **10 Visual Question Formats:** Short Answer, Long Answer, Single Choice, Multiple Choice, Dropdown, Rating scale (1-5), Date & Time, Photo Upload, GPS Location.
- **Deterministic Conditional Engine:** Client-side & server-side rule engine evaluates respondent answers to dynamically display follow-up questions.
- **Native Urdu RTL Localization:** Seamless right-to-left layout rendering in preview and mobile execution modes.
- **Immutable Version History:** Edits to published questionnaires clone a new draft version, protecting historical dataset integrity.

---

## 4. Student 3 Breakdown: Abdullah Zafar Khan (2312467)
### Module 03 — Campaign Management & Asset Registry

```
           ┌────────────────────────────────────────────────────────┐
           │     CIRCLE 3: ABDULLAH ZAFAR KHAN (2312467)            │
           │     Module 03: Campaign Management & Asset Registry    │
           └──────────────────────────┬─────────────────────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
┌──────▼──────┐             ┌─────────▼─────────┐          ┌─────────▼────────┐
│  CAMPAIGNS  │────────────►│CAMPAIGN_LOCATIONS │◄─────────│    LOCATIONS     │
└──────┬──────┘             └───────────────────┘          └─────────┬────────┘
       │                                                             │
       ├──────────────────────────────┬──────────────────────────────┤
       │                              │                              │
┌──────▼──────┐             ┌─────────▼─────────┐          ┌─────────▼────────┐
│ADVERTISEMENTS│◄────────────│   COMPETITORS     │─────────►│COMPETITOR_ADS    │
└─────────────┘             └─────────┬─────────┘          └──────────────────┘
                                      │
                            ┌─────────▼─────────┐          ┌──────────────────┐
                            │COMPETITOR_        │          │CAMPAIGN_         │
                            │CAMPAIGNS          │          │QUESTIONNAIRES    │
                            └───────────────────┘          └─────────▲────────┘
                                                                     │
       ┌─────────────────────────────────────────────────────────────┤
       │                                                             │
┌──────▼─────────────┐                                     ┌─────────▼────────┐
│CAMPAIGN_ASSIGNMENTS│────────────────────────────────────►│ CAMPAIGN_EVIDENCE│
└────────────────────┘                                     └──────────────────┘
```

### Table Definitions (10 Entities)
| # | Entity Name | Description | Key Primary & Foreign Constraints |
|---|---|---|---|
| 1 | `CAMPAIGNS` | Marketing research campaigns, budgets, managers, and lifecycle scheduling. | `id` (PK), `company_id` (FK), `code` (UK) |
| 2 | `LOCATIONS` | 5-Tier hierarchical Pakistan geographical model (Country → Site). | `id` (PK), `parent_id` (Self FK), `latitude`, `longitude` |
| 3 | `CAMPAIGN_LOCATIONS` | Association linking campaigns to target geographical sites. | `(campaign_id, location_id)` (Composite PK & FKs) |
| 4 | `ADVERTISEMENTS` | Billboard and out-of-home media registry (dimensions, illumination, orientation). | `id` (PK), `campaign_id` (FK), `location_id` (FK) |
| 5 | `COMPETITORS` | Market competitor corporate profiles, parent brands, and tiers. | `id` (PK), `company_id` (FK), `name` |
| 6 | `COMPETITOR_CAMPAIGNS`| Competitor advertising and marketing initiatives with timeframes. | `id` (PK), `competitor_id` (FK) |
| 7 | `COMPETITOR_ADVERTISEMENTS` | Competitor billboard footprint and out-of-home media across geographical sites. | `id` (PK), `competitor_campaign_id` (FK), `location_id` (FK) |
| 8 | `CAMPAIGN_ASSIGNMENTS` | Field personnel dispatch scheduling, priority, deadlines, and task lifecycle. | `id` (PK), `campaign_id` (FK), `user_id` (FK), `location_id` (FK) |
| 9 | `CAMPAIGN_QUESTIONNAIRES` | Deploy questionnaires to active research campaigns. | `(campaign_id, questionnaire_id)` (Composite PK & FKs) |
| 10 | `CAMPAIGN_EVIDENCE` | Field survey evidence, captured photos, GPS coordinates, and reviewer status. | `id` (PK), `campaign_id` (FK), `assignment_id` (FK) |

### Technical Architectural Guarantees
- **5-Tier Pakistan Geographical Hierarchy:** Self-referencing recursive model supporting `Country` (Pakistan) → `Province` (Sindh, Punjab, etc.) → `City` (Karachi, Lahore, Islamabad) → `Area` (Clifton, Gulberg, F-7) → `Site` (Billboard site coordinates).
- **Physical Media Registry:** Tracks physical outdoor dimensions (e.g. 60x20 ft), illumination types (Frontlit, Backlit, SMD Digital), and orientation angles.
- **Evidence Verification Pipeline:** Multi-step verification workflow for field photographs, comparing reported GPS coordinates against registered billboard sites.

---

## 5. Cross-Module Inter-Entity Relational Bridges

The system maintains 4 critical cross-module foreign key relationships that bind the three students' modules into one cohesive enterprise platform:

1. **Circle 1 (`COMPANIES`) -> Circle 2 (`QUESTIONNAIRES`):**
   - Foreign key: `questionnaires.company_id -> companies.id`
   - Purpose: Multi-tenant ownership ensuring surveys belong exclusively to the client workspace.
2. **Circle 1 (`COMPANIES`) -> Circle 3 (`CAMPAIGNS`):**
   - Foreign key: `campaigns.company_id -> companies.id`
   - Purpose: Multi-tenant boundary isolating marketing research campaigns.
3. **Circle 1 (`USERS`) -> Circle 3 (`CAMPAIGN_ASSIGNMENTS`):**
   - Foreign key: `campaign_assignments.user_id -> users.id`
   - Purpose: Dispatches active personnel with the `Field Staff` role to on-ground audit locations.
4. **Circle 2 (`QUESTIONNAIRES`) -> Circle 3 (`CAMPAIGN_QUESTIONNAIRES`):**
   - Composite foreign keys: `campaign_questionnaires.(campaign_id, questionnaire_id)`
   - Purpose: Connects certified survey instruments to research campaigns for execution.
