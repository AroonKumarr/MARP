# Multi-Agent Market Research Platform (MARP)
## Requirements Traceability Matrix (RTM)

**Document Version:** 1.0  
**Phase:** Modules 01, 02, and 03  
**Standard:** IEEE 830-1998 / SWEBOK Traceability Guidelines  

This matrix maps university specification requirements (SRS Chapter 3, Proposal, and Master Build Prompt) to backend database models, API endpoints, frontend interfaces, and automated test cases.

---

### 1. Module 01: User Management & Workspaces

| Req ID | Source Document | Requirement Description | Database Model / Entity | API Endpoint(s) | Frontend Interface / Page | Automated Verification |
|--------|-----------------|-------------------------|-------------------------|-----------------|---------------------------|------------------------|
| **FR-001.1** | SRS §3.2, Prompt §2.A | Multi-tenant company workspace creation and settings management | `Company`, `WorkspaceSetting` | `GET /api/v1/workspaces/current`<br>`PUT /api/v1/workspaces/current` | `/settings/workspace` | `test_workspace_isolation.py` |
| **FR-001.2** | SRS §3.2, Prompt §2.B | User authentication (registration, login, logout, password reset) | `User`, `PasswordResetToken` | `POST /api/v1/auth/login`<br>`POST /api/v1/auth/register`<br>`POST /api/v1/auth/forgot-password`<br>`POST /api/v1/auth/reset-password` | `/login`, `/register`, `/forgot-password`, `/reset-password` | `test_auth.py`, Playwright auth flow |
| **FR-001.3** | SRS §3.2, Prompt §2.B | User CRUD, invitation, activation & deactivation | `User`, `UserInvitation` | `GET /api/v1/users`<br>`POST /api/v1/users`<br>`GET /api/v1/users/{id}`<br>`PUT /api/v1/users/{id}`<br>`POST /api/v1/users/{id}/deactivate`<br>`POST /api/v1/users/invite` | `/users`, `/users/new`, `/users/[id]` modal | `test_users_crud.py` |
| **FR-001.4** | SRS §3.2, Prompt §2.C | Role-based access control with 5 enterprise roles and backend permission enforcement | `Role`, `Permission`, `user_roles`, `role_permissions` | `GET /api/v1/roles`<br>`PUT /api/v1/users/{id}/roles` | `/users` (role select dialog), `/settings/roles` | `test_rbac_enforcement.py` |
| **FR-001.5** | SRS §3.1, Prompt §2.D | Registered field Android devices, authorization, revocation | `RegisteredDevice` | `GET /api/v1/devices`<br>`POST /api/v1/devices`<br>`PUT /api/v1/devices/{id}/approve`<br>`PUT /api/v1/devices/{id}/revoke` | `/devices` (Device Registry tab in Users module) | `test_device_management.py` |
| **FR-001.6** | SRS §3.3, Prompt §2.E | Comprehensive immutable audit logging of critical actions | `AuditLog` | `GET /api/v1/audit-logs` | `/activity` (Recent Activity drawer / page) | `test_audit_trail.py` |

---

### 2. Module 02: Questionnaire Management & Builder

| Req ID | Source Document | Requirement Description | Database Model / Entity | API Endpoint(s) | Frontend Interface / Page | Automated Verification |
|--------|-----------------|-------------------------|-------------------------|-----------------|---------------------------|------------------------|
| **FR-002.1** | SRS §3.2, Prompt §2.A | Questionnaire library across 4 research categories (Retail, Billboard, Competitor, Field) | `Questionnaire` | `GET /api/v1/questionnaires`<br>`POST /api/v1/questionnaires`<br>`GET /api/v1/questionnaires/{id}`<br>`DELETE /api/v1/questionnaires/{id}` | `/questionnaires` | `test_questionnaire_crud.py` |
| **FR-002.2** | SRS §3.4, Prompt §2.B | Visual Questionnaire Builder with 10 question types, ordering, and validation rules | `Question`, `QuestionOption` | `GET /api/v1/questionnaires/{id}/questions`<br>`POST /api/v1/questionnaires/{id}/questions`<br>`PUT /api/v1/questions/{id}`<br>`PUT /api/v1/questions/reorder` | `/questionnaires/[id]/builder` | `test_question_builder.py` |
| **FR-002.3** | SRS §3.4, Prompt §2.C | Dynamic conditional branching logic evaluation | `BranchingRule` | `GET /api/v1/questionnaires/{id}/rules`<br>`POST /api/v1/questionnaires/{id}/rules`<br>`DELETE /api/v1/rules/{id}` | `/questionnaires/[id]/builder` (Logic tab) | `test_branching_logic.py` |
| **FR-002.4** | SRS §3.3, Prompt §2.D | Multilingual English and Urdu RTL questionnaire preview & translation | `QuestionTranslation`, `OptionTranslation` | `GET /api/v1/questionnaires/{id}/translations`<br>`PUT /api/v1/questionnaires/{id}/translations` | `/questionnaires/[id]/preview` (Urdu toggle) | `test_translations_rtl.py` |
| **FR-002.5** | SRS §3.2, Prompt §2.E | Respondent eligibility criteria and OTP gateway configuration | `QuestionnaireEligibility`, `OTPConfiguration` | `GET /api/v1/questionnaires/{id}/eligibility`<br>`PUT /api/v1/questionnaires/{id}/eligibility` | `/questionnaires/[id]/settings` | `test_eligibility_otp.py` |
| **FR-002.6** | SRS §3.3, Prompt §2.F | Immutable questionnaire versioning (draft, published, archived) with auto-branching | `QuestionnaireVersion` | `POST /api/v1/questionnaires/{id}/publish`<br>`GET /api/v1/questionnaires/{id}/versions`<br>`POST /api/v1/questionnaires/{id}/branch` | `/questionnaires/[id]/versions` | `test_version_immutability.py` |

---

### 3. Module 03: Campaign Management & Asset Registry

| Req ID | Source Document | Requirement Description | Database Model / Entity | API Endpoint(s) | Frontend Interface / Page | Automated Verification |
|--------|-----------------|-------------------------|-------------------------|-----------------|---------------------------|------------------------|
| **FR-003.1** | SRS §3.2, Prompt §2.A | Campaign lifecycle management (Planning, Active, In Progress, Completed, On Hold, Archived) | `Campaign` | `GET /api/v1/campaigns`<br>`POST /api/v1/campaigns`<br>`GET /api/v1/campaigns/{id}`<br>`PUT /api/v1/campaigns/{id}`<br>`PUT /api/v1/campaigns/{id}/status` | `/campaigns`, `/campaigns/[id]` | `test_campaign_lifecycle.py` |
| **FR-003.2** | Proposal §9, Prompt §2.B| Billboard & advertisement registry with physical dimensions, orientation, and specs | `Advertisement`, `AdvertisementSpecification` | `GET /api/v1/advertisements`<br>`POST /api/v1/advertisements`<br>`PUT /api/v1/advertisements/{id}` | `/campaigns/advertisements`, `/campaigns/[id]` (Ads tab) | `test_advertisements.py` |
| **FR-003.3** | SRS §3.2, Prompt §2.C | Competitor intelligence profiles, competitor ads, and geographical comparisons | `Competitor`, `CompetitorCampaign`, `CompetitorAdvertisement` | `GET /api/v1/competitors`<br>`POST /api/v1/competitors`<br>`GET /api/v1/competitors/compare` | `/campaigns/competitors`, `/campaigns/competitors/compare` | `test_competitor_intelligence.py` |
| **FR-003.4** | Proposal §9, Prompt §2.D| 5-tier parent-child hierarchical location tree (Country -> Province -> City -> Area -> Site) | `Location` | `GET /api/v1/locations`<br>`POST /api/v1/locations`<br>`GET /api/v1/locations/tree`<br>`PUT /api/v1/locations/{id}` | `/campaigns/locations` (Hierarchy Explorer) | `test_hierarchical_locations.py` |
| **FR-003.5** | SRS §3.2, Prompt §2.E | Field staff assignment and scheduling linked to campaigns and locations | `CampaignAssignment` | `GET /api/v1/assignments`<br>`POST /api/v1/assignments`<br>`PUT /api/v1/assignments/{id}` | `/campaigns/[id]/assignments`, `/assignments` | `test_assignments_scheduling.py` |
| **FR-003.6** | SRS §3.1, Prompt §2.F | Relational linking of campaigns, locations, questionnaires, and evidence metadata | `campaign_locations`, `campaign_questionnaires`, `CampaignEvidence` | `GET /api/v1/campaigns/{id}/evidence`<br>`POST /api/v1/campaigns/{id}/evidence` | `/campaigns/[id]/evidence` | `test_evidence_linking.py` |

---

### 4. Operational Dashboard & Analytics Metrics Traceability

| Metric / Widget | Source Requirement | Database Aggregation Query | API Endpoint | Verification Method |
|-----------------|--------------------|----------------------------|--------------|---------------------|
| **Active Campaigns KPI** | Master Prompt §3, §8 | `SELECT count(*) FROM campaigns WHERE company_id = :id AND status IN ('Active', 'In Progress')` | `GET /api/v1/dashboard/metrics` | Assert non-hardcoded dynamic count |
| **Total Field Staff KPI** | Master Prompt §3, §8 | `SELECT count(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.company_id = :id AND r.name = 'Field Staff' AND u.is_active = true` | `GET /api/v1/dashboard/metrics` | Verify role join accuracy |
| **Questionnaires Published** | Master Prompt §3, §8 | `SELECT count(*) FROM questionnaires WHERE company_id = :id AND status = 'Published'` | `GET /api/v1/dashboard/metrics` | Verify published state filter |
| **Research Workflow Board** (To Do / In Progress / Review) | Reference Video & Prompt §3 | Aggregation of `CampaignAssignment` statuses (`Scheduled` -> To Do, `In Progress` -> In Progress, `Completed` -> Review) | `GET /api/v1/dashboard/workflow-board` | Verify cards reflect DB assignments |
| **Category Distribution (Donut Chart)** | Reference Video & Prompt §3 | `SELECT category, count(*) FROM questionnaires WHERE company_id = :id GROUP BY category` | `GET /api/v1/dashboard/analytics/donut` | Verify Recharts rendering from API |
| **Weekly Submissions / Activity (Bar Chart)** | Reference Video & Prompt §3 | Aggregated counts of assignments and audit events grouped by day of current week | `GET /api/v1/dashboard/analytics/weekly` | Verify date histogram calculation |

---
*Matrix approved for automated test execution and visual acceptance.*
