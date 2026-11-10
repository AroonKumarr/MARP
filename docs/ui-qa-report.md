# Multi-Agent Market Research Platform (MARP)
## Visual QA & UI/UX Audit Report

**Report Version:** 1.0  
**Audit Date:** November 2026  
**Auditor:** Principal Software Architect & QA Lead  
**Evaluation Standard:** Final Year Project UI/UX Reference Baseline (`SCR-20261110-ndni.png` and reference video)

---

## 1. Executive Summary & Aesthetic Assessment

The MARP user interface was evaluated against the provided video recording and high-fidelity reference frame. Rather than relying on generic framework defaults, the application implements a dedicated design token system (`design-system/tokens.css`):
- **Outer Canvas:** Warm stone/taupe canvas (`#E6E2D8`) framing the application.
- **Main Workspace Shell:** Ivory rounded container (`#F7F5EC`) with smooth `32px` corner radii and subtle elevation.
- **Sidebar:** Jet-black container (`#111111`) with rounded squircle active pill state, minimalist crescent brand mark, and user avatar profile anchoring.
- **Card Hierarchy:** High-contrast pure white cards (`#FFFFFF`) with `20px` border radii and soft natural shadows (`0 4px 20px -2px rgba(23,23,23,0.04)`).
- **Domain Accents:** Systematic usage of Lime (`#D9F66A`), Periwinkle (`#91ACF8`), Lavender (`#B6A0F3`), Mint (`#9DD9C7`), and Soft Orange (`#F2B77C`).

Visual regression tests were conducted across Desktop (1440×900), Laptop (1280×800), and Mobile (390×844) viewports.

---

## 2. Screenshot Evidence & Screen Verification

| # | Screen Name | Viewport | Verification Notes & Observations | Screenshot Reference |
|---|-------------|----------|-----------------------------------|----------------------|
| **1** | **Authentication Portal** | 1440×900 | Centered ivory card with crescent brand mark, field inputs, and administrator credentials. | `docs/screenshots/01_login_page.png` |
| **2** | **Operational Dashboard** | 1440×900 | Complete reproduction of reference layout: 3-column Kanban board (To Do, In Progress, Review) with counter badges, black Donut card, and frosted weekly activity bar chart. | `docs/screenshots/02_dashboard_desktop_1440.png` |
| **3** | **Users & Personnel Registry** | 1440×900 | Personnel table with role filter pills, status indicators, and contact columns. | `docs/screenshots/03_users_personnel.png` |
| **4** | **Registered Devices** | 1440×900 | Android hardware inventory with IMEI identifiers, OS versions, and instant Approve/Revoke controls. | `docs/screenshots/04_users_devices.png` |
| **5** | **Audit Activity Trail** | 1440×900 | Immutable chronological record of system transactions. | `docs/screenshots/05_users_audit_trail.png` |
| **6** | **Questionnaire Library** | 1440×900 | Multi-category survey cards across Billboard, Retail, Competitor, and Field research domains. | `docs/screenshots/06_questionnaires_library.png` |
| **7** | **Visual Questionnaire Builder** | 1440×900 | Interactive drag-and-drop question design canvas supporting 10 question types, options editor, and Urdu translation fields. | `docs/screenshots/07_visual_questionnaire_builder.png` |
| **8** | **Survey Preview (English LTR)** | 1440×900 | Interactive survey preview evaluating dynamic branching rules in real time. | `docs/screenshots/08_survey_preview_english.png` |
| **9** | **Survey Preview (Urdu RTL)** | 1440×900 | Bilingual preview with Right-to-Left (RTL) typography, localized options, and Nastaliq font rendering. | `docs/screenshots/09_survey_preview_urdu_rtl.png` |
| **10** | **Campaigns Overview** | 1440×900 | Multi-market campaign cards with status transition controls, budget metrics, and date ranges. | `docs/screenshots/10_campaigns_library.png` |
| **11** | **Billboard & Advertisement Registry** | 1440×900 | Media registry with dimensions (`60x20 ft`, `40x20 ft`), illumination types, and location links. | `docs/screenshots/11_billboard_registry.png` |
| **12** | **5-Tier Location Hierarchy Tree** | 1440×900 | Nested Pakistani geographic explorer: Country (Pakistan) → Province → City → Area → Specific Audit Sites. | `docs/screenshots/12_location_hierarchy_pakistan.png` |
| **13** | **Competitor Intelligence** | 1440×900 | Side-by-side comparison of billboard footprints and locations between client and competitor brands. | `docs/screenshots/13_competitor_comparison.png` |
| **14** | **Campaign Workspace** | 1440×900 | Dedicated workspace for campaign advertisements, staff scheduling, and evidence verification. | `docs/screenshots/14_campaign_detail_workspace.png` |
| **15** | **Field Staff Scheduling** | 1440×900 | Task dispatch board displaying scheduled surveyor visits, due dates, and priority badges. | `docs/screenshots/15_campaign_assignments.png` |
| **16** | **Workspace Settings** | 1440×900 | Company organization settings, device auto-approval policies, and branding accent tokens. | `docs/screenshots/16_workspace_settings.png` |
| **17** | **Dashboard (Laptop 1280px)** | 1280×800 | Proportional scaling across medium-width laptop screens without layout breakage. | `docs/screenshots/17_dashboard_laptop_1280.png` |
| **18** | **Dashboard (Mobile 390px)** | 390×844 | Responsive single-column vertical stack with preserved sidebar and touch targets. | `docs/screenshots/18_dashboard_mobile_390.png` |

---

## 3. Visual Quality Verification & Parity Matrix

| Reference Element | Reference Video Feature | Implemented MARP Behavior | Status |
|-------------------|-------------------------|---------------------------|--------|
| **Outer Canvas** | Warm taupe border | `#E6E2D8` full-bleed outer background | **Exact Match** |
| **Workspace Shell** | Rounded ivory sheet | `#F7F5EC` container with `rounded-[32px]` | **Exact Match** |
| **Sidebar Navigation** | Jet-black vertical pill with squircle active state | `#111111` sidebar, white active button with black icon, crescent logo | **Exact Match** |
| **Top App Bar** | Search pill + "Me" filter + Black action pill | Pill input with magnifying glass, eye icon pill, `+ Action` pill | **Exact Match** |
| **Workflow Board** | To do, In progress, Review with solid black count badges | Dynamic assignment aggregation with `CounterBadge` | **Exact Match** |
| **Board Cards** | White cards, category tag, calendar date, avatars, stats | Pure white cards with `#D9F66A` / `#91ACF8` pills, avatar stack, icons | **Exact Match** |
| **Dark Analytics Card** | Black card, donut chart, center metric, legend | `#111111` card with Recharts Donut, center total, colored dot legend | **Exact Match** |
| **Light Frosted Card** | Translucent card with rounded vertical weekly bars | `bg-white/90` with `#91ACF8` bars and active black tooltip pill | **Exact Match** |

---

## 4. Remaining Limitations & Recommendations

1. **Native Mobile App Integration (Sprint 2):** The web application exposes authenticated REST endpoints for offline synchronization; the Kotlin/Flutter mobile client build is scheduled for subsequent project sprints.
2. **Automated Computer Vision Glare Detection (Sprint 3):** Evidence photographs are currently validated via human reviewer workflows, with LangGraph automated OCR/glare models planned for Sprint 3.
3. **SMS Gateway Production Provider:** Twilio and local Pakistani SMS gateway credentials can be set via `.env` in production for SMS OTP delivery.

---
*QA Review completed and approved for Final Year Project demonstration.*
