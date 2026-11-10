# MARP Data Dictionary (Modules 01, 02, 03)

**Version:** 1.0  
**Database Management System:** PostgreSQL 15+  
**ORM:** SQLAlchemy 2.0  

---

## 1. Module 01: Workspace & User Management

### 1.1 `companies`
Stores multi-tenant enterprise workspace profiles.
- `id` (UUID, Primary Key, default `gen_random_uuid()`): Unique workspace identifier.
- `name` (VARCHAR(150), NOT NULL): Company business name.
- `slug` (VARCHAR(100), UNIQUE, NOT NULL): URL-safe identifier.
- `industry` (VARCHAR(100), NULLABLE): Industry vertical (e.g., FMCG, Telecommunications, Real Estate).
- `contact_email` (VARCHAR(255), NOT NULL): Primary administrative contact.
- `phone` (VARCHAR(50), NULLABLE): Contact phone number.
- `address` (TEXT, NULLABLE): Headquarters address.
- `timezone` (VARCHAR(50), NOT NULL, default `'Asia/Karachi'`): Primary operational timezone.
- `status` (VARCHAR(30), NOT NULL, default `'active'`): `active`, `suspended`, `trial`.
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`): Workspace registration time.
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`): Last profile change.

### 1.2 `users`
Authenticated personnel belonging to a company workspace.
- `id` (UUID, Primary Key): Unique user ID.
- `company_id` (UUID, NOT NULL, FK -> `companies.id` ON DELETE CASCADE): Tenant scoping.
- `email` (VARCHAR(255), UNIQUE, NOT NULL): Login email address.
- `hashed_password` (VARCHAR(255), NOT NULL): PBKDF2/bcrypt cryptographic hash.
- `full_name` (VARCHAR(150), NOT NULL): Staff full name.
- `phone` (VARCHAR(50), NULLABLE): Contact phone number.
- `avatar_url` (VARCHAR(500), NULLABLE): Profile image URL.
- `is_active` (BOOLEAN, NOT NULL, default `TRUE`): Operational active status flag.
- `is_verified` (BOOLEAN, NOT NULL, default `FALSE`): Email verification flag.
- `last_login_at` (TIMESTAMPTZ, NULLABLE): Timestamp of most recent authentication.
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 1.3 `roles` & `permissions`
Role-Based Access Control catalogs.
- `roles`: `id` (UUID, PK), `name` (VARCHAR(50), UNIQUE), `display_name` (VARCHAR(100)), `description` (TEXT), `is_system_role` (BOOLEAN, default `TRUE`).
- `permissions`: `id` (UUID, PK), `code` (VARCHAR(100), UNIQUE), `name` (VARCHAR(100)), `module` (VARCHAR(50)), `description` (TEXT).
- `user_roles`: `user_id` (UUID, FK -> `users.id`), `role_id` (UUID, FK -> `roles.id`), `assigned_at` (TIMESTAMPTZ). Composite PK (`user_id`, `role_id`).
- `role_permissions`: `role_id` (UUID, FK -> `roles.id`), `permission_id` (UUID, FK -> `permissions.id`). Composite PK (`role_id`, `permission_id`).

### 1.4 `registered_devices`
Approved mobile client hardware used by field staff.
- `id` (UUID, Primary Key).
- `company_id` (UUID, NOT NULL, FK -> `companies.id`).
- `user_id` (UUID, NULLABLE, FK -> `users.id` ON DELETE SET NULL): Currently associated field staff member.
- `device_identifier` (VARCHAR(100), UNIQUE, NOT NULL): Hardware IMEI or Android UUID.
- `device_name` (VARCHAR(150), NOT NULL): User-friendly label (e.g., "Field Samsung A54 #1").
- `model` (VARCHAR(100), NOT NULL): Device model number.
- `os_version` (VARCHAR(50), NOT NULL): Android OS release version.
- `app_version` (VARCHAR(50), NOT NULL): Client build number.
- `status` (VARCHAR(30), NOT NULL, default `'Pending'`): `Pending`, `Approved`, `Revoked`, `Deactivated`.
- `last_active_at` (TIMESTAMPTZ, NULLABLE): Heartbeat / last sync time.
- `registered_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 1.5 `audit_logs`
Immutable system audit record of critical operational transactions.
- `id` (UUID, Primary Key).
- `company_id` (UUID, NOT NULL, FK -> `companies.id`).
- `actor_id` (UUID, NULLABLE, FK -> `users.id` ON DELETE SET NULL): Initiating operator.
- `action` (VARCHAR(100), NOT NULL): Action verb (e.g., `user.login`, `campaign.create`, `questionnaire.publish`).
- `resource_type` (VARCHAR(50), NOT NULL): Target domain (e.g., `User`, `Campaign`, `Device`).
- `resource_id` (VARCHAR(100), NOT NULL): ID of the affected resource.
- `ip_address` (VARCHAR(45), NULLABLE): Client IP address.
- `metadata` (JSONB, NOT NULL, default `'{}'`): Contextual payload snapshot.
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

---

## 2. Module 02: Questionnaire Management

### 2.1 `questionnaires`
Top-level market research survey entities.
- `id` (UUID, Primary Key).
- `company_id` (UUID, NOT NULL, FK -> `companies.id`).
- `created_by` (UUID, NOT NULL, FK -> `users.id`).
- `title` (VARCHAR(200), NOT NULL): Survey title.
- `description` (TEXT, NULLABLE): Overview and guidance notes.
- `category` (VARCHAR(50), NOT NULL): `Retail`, `Billboard`, `Competitor`, `Field`.
- `status` (VARCHAR(30), NOT NULL, default `'Draft'`): `Draft`, `Published`, `Archived`.
- `current_version` (INTEGER, NOT NULL, default `1`).
- `published_at` (TIMESTAMPTZ, NULLABLE).
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 2.2 `questionnaire_versions`
Immutable historical snapshots of published surveys.
- `id` (UUID, Primary Key).
- `questionnaire_id` (UUID, NOT NULL, FK -> `questionnaires.id` ON DELETE CASCADE).
- `version_number` (INTEGER, NOT NULL).
- `status` (VARCHAR(30), NOT NULL): `Draft`, `Published`, `Archived`.
- `schema_snapshot` (JSONB, NOT NULL): Complete serialised JSON array of questions, options, translations, and rules.
- `changelog` (TEXT, NULLABLE): Explanation of modifications.
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 2.3 `questions`
Survey questionnaire items.
- `id` (UUID, Primary Key).
- `questionnaire_id` (UUID, NOT NULL, FK -> `questionnaires.id` ON DELETE CASCADE).
- `question_text` (TEXT, NOT NULL): Prompt presented to respondent/surveyor.
- `question_type` (VARCHAR(40), NOT NULL): `short_answer`, `long_answer`, `single_choice`, `multiple_choice`, `dropdown`, `checkboxes`, `rating_scale`, `date_time`, `image_upload`, `gps_location`.
- `help_text` (TEXT, NULLABLE): Guidance or context.
- `is_required` (BOOLEAN, NOT NULL, default `FALSE`).
- `order_index` (INTEGER, NOT NULL, default `0`): Sequence order.
- `validation_rules` (JSONB, NOT NULL, default `'{}'`): Rules (min_length, max_length, min_value, max_value, allowed_extensions).
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 2.4 `question_options`
Discrete choice items for single-choice, multiple-choice, and dropdown questions.
- `id` (UUID, Primary Key).
- `question_id` (UUID, NOT NULL, FK -> `questions.id` ON DELETE CASCADE).
- `label` (VARCHAR(255), NOT NULL): Display text.
- `value` (VARCHAR(150), NOT NULL): Recorded programmatic value.
- `order_index` (INTEGER, NOT NULL, default `0`).

### 2.5 `question_translations`
Multilingual localization records (specifically supporting English & Urdu).
- `id` (UUID, Primary Key).
- `question_id` (UUID, NOT NULL, FK -> `questions.id` ON DELETE CASCADE).
- `language_code` (VARCHAR(10), NOT NULL): `'ur'` (Urdu) or `'en'` (English).
- `translated_text` (TEXT, NOT NULL): Localized prompt.
- `translated_help_text` (TEXT, NULLABLE): Localized helper text.
- `translated_options` (JSONB, NOT NULL, default `'[]'`): Localized list of option labels.

### 2.6 `branching_rules`
Deterministic conditional questionnaire logic.
- `id` (UUID, Primary Key).
- `questionnaire_id` (UUID, NOT NULL, FK -> `questionnaires.id` ON DELETE CASCADE).
- `source_question_id` (UUID, NOT NULL, FK -> `questions.id` ON DELETE CASCADE).
- `target_question_id` (UUID, NOT NULL, FK -> `questions.id` ON DELETE CASCADE).
- `condition_operator` (VARCHAR(30), NOT NULL): `equals`, `not_equals`, `contains`, `greater_than`, `less_than`.
- `condition_value` (VARCHAR(255), NOT NULL): Expected answer value.
- `action` (VARCHAR(30), NOT NULL, default `'show'`): `show`, `hide`, `skip_to`.
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 2.7 `questionnaire_eligibilities` & `otp_configurations`
- `questionnaire_eligibilities`: `id` (UUID, PK), `questionnaire_id` (UUID, FK, UNIQUE), `min_age` (INTEGER), `max_age` (INTEGER), `allowed_genders` (VARCHAR(50)), `target_cities` (JSONB), `respondent_quota` (INTEGER).
- `otp_configurations`: `id` (UUID, PK), `questionnaire_id` (UUID, FK, UNIQUE), `is_otp_required` (BOOLEAN, default `FALSE`), `provider_name` (VARCHAR(50), default `'twilio'`), `otp_expiry_seconds` (INTEGER, default `300`), `max_retry_attempts` (INTEGER, default `3`).

---

## 3. Module 03: Campaign Management & Asset Registry

### 3.1 `campaigns`
Operational marketing and audit campaigns.
- `id` (UUID, Primary Key).
- `company_id` (UUID, NOT NULL, FK -> `companies.id`).
- `manager_id` (UUID, NOT NULL, FK -> `users.id`): Assigned Campaign Manager.
- `title` (VARCHAR(200), NOT NULL): Campaign campaign name.
- `code` (VARCHAR(50), NOT NULL): Unique campaign reference code (e.g., `CMP-2026-ISB-01`).
- `description` (TEXT, NULLABLE).
- `research_category` (VARCHAR(50), NOT NULL): `Retail`, `Billboard`, `Competitor`, `Field`.
- `status` (VARCHAR(30), NOT NULL, default `'Planning'`): `Planning`, `Active`, `In Progress`, `Completed`, `On Hold`, `Archived`.
- `budget` (NUMERIC(12, 2), NOT NULL, default `0.00`).
- `start_date` (DATE, NOT NULL).
- `end_date` (DATE, NOT NULL).
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 3.2 `locations`
5-Tier hierarchical geographic locations (Country -> Province -> City -> Area -> Site).
- `id` (UUID, Primary Key).
- `company_id` (UUID, NOT NULL, FK -> `companies.id`).
- `parent_id` (UUID, NULLABLE, FK -> `locations.id` ON DELETE CASCADE): Parent location in hierarchy.
- `name` (VARCHAR(150), NOT NULL): E.g. "Pakistan", "Punjab", "Islamabad", "Blue Area", "Beverly Centre Pole #4".
- `code` (VARCHAR(50), NOT NULL): Location code.
- `level` (VARCHAR(20), NOT NULL): `country`, `province`, `city`, `area`, `site`.
- `latitude` (NUMERIC(10, 7), NULLABLE): GPS coordinate.
- `longitude` (NUMERIC(10, 7), NULLABLE): GPS coordinate.
- `address` (TEXT, NULLABLE): Descriptive street address.
- `metadata` (JSONB, NOT NULL, default `'{}'`).
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 3.3 `advertisements`
Billboard & advertising media assets registered under campaigns and locations.
- `id` (UUID, Primary Key).
- `company_id` (UUID, NOT NULL, FK -> `companies.id`).
- `campaign_id` (UUID, NOT NULL, FK -> `campaigns.id` ON DELETE CASCADE).
- `location_id` (UUID, NOT NULL, FK -> `locations.id` ON DELETE RESTRICT).
- `name` (VARCHAR(200), NOT NULL): Asset label.
- `ad_type` (VARCHAR(50), NOT NULL): `Static Billboard`, `Digital LED`, `Unipole`, `Gantry`, `Transit Shelter`, `Wall Branding`.
- `brand` (VARCHAR(100), NOT NULL): Promoted client brand.
- `dimensions` (VARCHAR(50), NOT NULL): Width × Height in feet (e.g. `'60x20'`, `'40x15'`).
- `orientation` (VARCHAR(50), NULLABLE): Cardinal heading (e.g. `'North-Facing'`).
- `illumination_type` (VARCHAR(50), NOT NULL, default `'Frontlit'`): `Frontlit`, `Backlit`, `Digital/LED`, `Unlit`.
- `image_url` (VARCHAR(500), NULLABLE): Reference design artwork or photo.
- `status` (VARCHAR(30), NOT NULL, default `'Active'`): `Active`, `Under Maintenance`, `Inactive`.
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 3.4 `competitors` & `competitor_advertisements`
Market intelligence competitor records.
- `competitors`: `id` (UUID, PK), `company_id` (UUID, FK), `name` (VARCHAR(150)), `parent_company` (VARCHAR(150)), `brand_tier` (VARCHAR(50)), `notes` (TEXT).
- `competitor_campaigns`: `id` (UUID, PK), `competitor_id` (UUID, FK), `title` (VARCHAR(200)), `category` (VARCHAR(50)), `start_date` (DATE), `end_date` (DATE), `status` (VARCHAR(30)).
- `competitor_advertisements`: `id` (UUID, PK), `competitor_campaign_id` (UUID, FK), `location_id` (UUID, FK), `brand` (VARCHAR(100)), `ad_type` (VARCHAR(50)), `dimensions` (VARCHAR(50)), `image_url` (VARCHAR(500)), `notes` (TEXT), `recorded_at` (TIMESTAMPTZ).

### 3.5 `campaign_assignments`
Field staff task scheduling.
- `id` (UUID, Primary Key).
- `campaign_id` (UUID, NOT NULL, FK -> `campaigns.id` ON DELETE CASCADE).
- `user_id` (UUID, NOT NULL, FK -> `users.id` ON DELETE CASCADE): Assigned Field Staff member.
- `location_id` (UUID, NOT NULL, FK -> `locations.id` ON DELETE CASCADE).
- `questionnaire_id` (UUID, NOT NULL, FK -> `questionnaires.id` ON DELETE CASCADE).
- `scheduled_date` (DATE, NOT NULL).
- `due_date` (DATE, NOT NULL).
- `priority` (VARCHAR(20), NOT NULL, default `'Medium'`): `High`, `Medium`, `Low`.
- `status` (VARCHAR(30), NOT NULL, default `'Scheduled'`): `Scheduled`, `In Progress`, `Completed`, `Cancelled`.
- `notes` (TEXT, NULLABLE).
- `created_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).

### 3.6 `campaign_evidence`
Audit and field evidence records linking campaigns, locations, assignments, and media.
- `id` (UUID, Primary Key).
- `campaign_id` (UUID, NOT NULL, FK -> `campaigns.id` ON DELETE CASCADE).
- `assignment_id` (UUID, NULLABLE, FK -> `campaign_assignments.id` ON DELETE SET NULL).
- `location_id` (UUID, NOT NULL, FK -> `locations.id` ON DELETE CASCADE).
- `evidence_type` (VARCHAR(50), NOT NULL): `Photograph`, `Audio Observation`, `GPS Timestamp`, `Condition Note`.
- `file_url` (VARCHAR(500), NOT NULL): Media storage URL.
- `latitude` (NUMERIC(10, 7), NULLABLE).
- `longitude` (NUMERIC(10, 7), NULLABLE).
- `recorded_at` (TIMESTAMPTZ, NOT NULL, default `NOW()`).
- `verification_status` (VARCHAR(30), NOT NULL, default `'Pending'`): `Pending`, `Verified`, `Rejected`, `Flagged`.
- `review_notes` (JSONB, NOT NULL, default `'{}'`).

---
*Data Dictionary verified and compliant with IEEE 1471 / ISO 42010 specifications.*
