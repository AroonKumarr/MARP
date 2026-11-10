# Final Year Project (FYP) — 10-Minute Defense Presentation Script
## Multi-Agent Market Research Platform (MARP)
**Team Members:**
1. **Aroon Kumar (Seat No: 2312466)** — Module 01: User & Workspace Management (Speaker 1)
2. **Mudasir Ali (Seat No: 2312465)** — Module 02: Questionnaire Logic Engine (Speaker 2)
3. **Abdullah Zafar Khan (Seat No: 2312467)** — Module 03: Campaigns & Asset Registry (Speaker 3)

**Total Duration:** Exactly 10 Minutes (600 Seconds) + 5 Minutes Evaluator Q&A  
**Presentation Deck:** [`docs/presentation/MARP_FYP_Defense_Presentation.pptx`](file:///Users/aroonkumar/Developer/MARP/docs/presentation/MARP_FYP_Defense_Presentation.pptx)  
**Live System:** `http://localhost:3000` | **Master ERD Viewer:** `http://localhost:3000/erd`

---

## Meeting Schedule & Timing Breakdown

| Time Elapsed | Speaker | Topic / Section | Visual / Demo Action |
|---|---|---|---|
| **0:00 – 1:15** | **Aroon Kumar** | Introduction, Motivation & The Pakistan Problem | Slide 1 & Slide 2 |
| **1:15 – 3:15** | **Aroon Kumar** | System Architecture & Module 01 (Users, Workspaces, RBAC, Hardware Security) | Slide 3 & Slide 5 + Live Admin Login |
| **3:15 – 4:45** | **Mudasir Ali** | Module 02 Overview, 10 Question Types, Visual Builder | Slide 6 + Live Questionnaire Builder |
| **4:45 – 6:30** | **Mudasir Ali** | Deterministic Branching Engine, Urdu RTL Preview, Version Snapshots | Live Branching Demo + Urdu RTL Switch |
| **6:30 – 8:00** | **Abdullah Zafar** | Module 03 Overview, 5-Tier Geo Tree, Billboard Media Registry | Slide 7 + Location Hierarchy & Billboards |
| **8:00 – 9:15** | **Abdullah Zafar** | Competitor Intelligence, Field Dispatch & Evidence Review | Competitor Comparison + Evidence Review |
| **9:15 – 10:00** | **Abdullah Zafar** | Master 3-Circle ERD, QA Verification & Conclusion | Slide 4 (ERD) & Slide 10 (Q&A Transition) |

---

## 🎙️ PART 1: Aroon Kumar (Seat No: 2312466)
**Speaking Time:** `0:00 – 3:15` (3 Minutes 15 Seconds)  
**Role:** Project Lead, Architect & Module 01 Owner  
**Covers:** Opening, Problem Statement, Full-Stack Architecture, User & Workspace Management, Device Trust.

---

### [0:00 – 0:45] The Opening Hook & Problem Statement
*(Display Slide 1: Title Slide, then advance to Slide 2: Problem Statement)*

> "Respected supervisor, faculty members, and evaluators — Good afternoon.
> 
> My name is **Aroon Kumar**, and alongside my team members **Mudasir Ali** and **Abdullah Zafar Khan**, we are honored to present our Final Year Project: **MARP — Multi-Agent Market Research Platform**.
> 
> In Pakistan today, corporate brands in telecommunications, FMCG, and banking spend over **35 billion rupees annually** on roadside billboards, digital SMDs, and outdoor media. Yet, almost every CMO faces the same fundamental challenge: **How do we know our advertisements are actually up, illuminated at night, and undamaged?**
> 
> Traditional research relies on clipboard paper surveys and informal WhatsApp photos. Surveyors forge data from home, paper records are lost, and companies have zero forensic proof of ground truth. 
> 
> MARP is built to eliminate this fraud entirely."

---

### [0:45 – 1:45] Architectural Overview
*(Advance to Slide 3: System Architecture)*

> "To solve this, we did not build a superficial prototype. We engineered a **complete, production-ready, full-stack enterprise web platform**:
> 
> - **Frontend:** Built with Next.js 14 App Router, React 18, and custom Tailwind CSS design tokens matching the sleek SaaS composition required in our specifications. It is fully responsive across desktop, laptop, tablet, and mobile.
> - **Backend:** A high-performance Python FastAPI modular monolith with Pydantic v2 schemas and strict asynchronous endpoints.
> - **Database Layer:** SQLAlchemy 2.0 with Alembic database migrations, managing **28 relational tables** with total multi-tenant isolation.
> 
> The project scope is divided into three foundational modules, each engineered end-to-end by one team member."

---

### [1:45 – 3:15] Module 01 Deep-Dive: Aroon Kumar
*(Advance to Slide 5: Aroon Kumar — Module 01, then switch to Live Browser)*

> "My core responsibility was **Module 01: User Management, Workspace Isolation & Device Governance**.
> 
> Let me demonstrate the live system:
> 
> *(Click live browser: http://localhost:3000/login)*
> 
> 1. **Multi-Tenant Workspace Isolation:** Every single record in our database is scoped to an enterprise `company_id`. Even with multiple competing companies on the platform, no tenant can ever read or modify another's records.
> 2. **Role-Based Access Control (RBAC):** We implemented five distinct enterprise roles:
>    - *Company Administrator*
>    - *Research Manager*
>    - *Analyst*
>    - *Field Staff*
>    - *Evidence Reviewer*
> 
> *(Log in as `admin@marp.io` and navigate to `/users`)*
> 
> Notice here on the screen: As an Administrator, I have complete control. I can register personnel, issue single-use cryptographic invitation tokens, and deactivate accounts.
> 
> 3. **Hardware IMEI Device Security:** Field researchers use physical Android devices. Under our **Registered Devices** tab, every phone is paired via unique hardware identifiers. We can approve legitimate surveyor phones or instantly revoke compromised hardware.
> 4. **Tamper-Evident Forensic Audit Trail:** Under **Audit Trail**, every privileged transaction — logins, role promotions, device authorizations — is immutably recorded with actor ID, client IP, action code, and JSON metadata.
> 
> With user access and security established, I will now hand over to **Mudasir Ali** to present **Module 02: Questionnaire Management & Dynamic Logic**."

---

## 🎙️ PART 2: Mudasir Ali (Seat No: 2312465)
**Speaking Time:** `3:15 – 6:30` (3 Minutes 15 Seconds)  
**Role:** Module 02 Owner & Frontend Logic Engineer  
**Covers:** Visual Questionnaire Builder, 10 Field Types, Branching Logic Engine, Urdu RTL, Immutable Versioning.

---

### [3:15 – 4:30] Questionnaire Library & Visual Builder
*(Display Slide 6: Mudasir Ali — Module 02, then navigate to `/questionnaires`)*

> "Thank you, Aroon. Respected evaluators, my name is **Mudasir Ali**, and I am responsible for **Module 02: Questionnaire Management & Logic Engine**.
> 
> Market research requires highly adaptable survey instruments. As you see on the screen, our **Questionnaire Library** organizes surveys into four distinct research categories:
> - **Billboard Surveys**
> - **Retail Audits**
> - **Competitor Studies**
> - **Field Consumer Research**
> 
> *(Click into the 'National OOH Billboard Visibility Audit' questionnaire)*
> 
> In our **Visual Questionnaire Builder**, research managers can configure question flows supporting **10 distinct field question types**:
> 1. Short Answer & Paragraphs
> 2. Single Choice (Radio) & Multiple Choice
> 3. Dropdowns & Multi-Checkboxes
> 4. Numerical Rating Scales (1 to 5)
> 5. Photographic Proof Uploads
> 6. Precise GPS Coordinate Pinpoints
> 7. Date & Time Timestamps"

---

### [4:30 – 5:45] Conditional Branching Engine & Urdu RTL Nastaliq
*(Click 'Conditional Branching' tab, then switch to 'Interactive Preview')*

> "A key requirement of our SRS is that questionnaires must not be static forms — they must possess **deterministic dynamic branching logic**.
> 
> Here in the logic editor:
> When a surveyor evaluates question 1: *'What is the physical condition of the billboard?'*
> - If they select *'Excellent'*, *'Good'*, or *'Average'*, the survey continues normally.
> - But if they select **'Poor'**, our conditional rule engine dynamically triggers and mandates **Question 3: 'Upload Close-up Photograph of Structural Damage or Torn Skin'**.
> 
> Watch as I test this in our live **Interactive Preview**:
> *(Click 'Poor' on the radio button)* -> Question 3 immediately materializes on screen!
> 
> Furthermore, Pakistan is a bilingual market. Field workers across rural and semi-urban routes often struggle with English. 
> Notice this language toggle: *(Click 'اردو' toggle)*
> 
> The questionnaire instantly re-renders in **Urdu with native Right-to-Left (RTL) Nastaliq alignment**, translating questions, options, and help text seamlessly."

---

### [5:45 – 6:30] Immutable Version Snapshots & OTP Verification
*(Click 'Publish Version' modal)*

> "Finally, we addressed **research data integrity**:
> In traditional tools, editing a live survey corrupts historical datasets. In MARP, when a survey is published, the system seals an **immutable JSON schema snapshot** as Version 1.0. Any subsequent edits automatically fork into a new draft, leaving past survey responses historically intact.
> 
> We also built respondent eligibility constraints (age, gender, city quotas) and integrated SMS OTP carrier verification for authenticated consumer sampling.
> 
> I now invite **Abdullah Zafar Khan** to present **Module 03: Campaign Management & Asset Registry**."

---

## 🎙️ PART 3: Abdullah Zafar Khan (Seat No: 2312467)
**Speaking Time:** `6:30 – 10:00` (3 Minutes 30 Seconds)  
**Role:** Module 03 Owner, Database Architect & Presentation Lead  
**Covers:** Campaigns, 5-Tier Location Hierarchy, Billboard Registry, Competitor Intelligence, Evidence Review, 3-Circle ERD & Closing.

---

### [6:30 – 7:45] 5-Tier Location Hierarchy & Billboard Registry
*(Display Slide 7: Abdullah Zafar — Module 03, then navigate to `/campaigns`)*

> "Thank you, Mudasir. Respected committee, my name is **Abdullah Zafar Khan**, and I spearheaded **Module 03: Campaign Management, Geographical Assets & Field Operations**.
> 
> The real world of marketing happens in physical space. To model this, I architected a **5-Tier Hierarchical Location Model** tailored specifically for Pakistan:
> 
> *(Click 'Location Hierarchy' tab on screen)*
> - **Country:** Pakistan
> - **Province:** Punjab, Sindh, KPK, Islamabad Capital Territory
> - **City:** Islamabad, Rawalpindi, Lahore, Karachi
> - **Area:** Blue Area, Gulberg III, Clifton Block 2
> - **Site:** Specific geocoded intersections like *'Beverly Centre Unipole #4'* or *'Centaurus Flyover LED Screen'*.
> 
> *(Click 'Billboard Registry' tab)*
> 
> Under the **Billboard Registry**, we track exact media specifications:
> - Physical dimensions (e.g. `60x20 ft`, `120x40 ft`)
> - Illumination technology (Frontlit, Backlit, SMD Digital LED)
> - Facing orientation (North-Facing, West-Facing)
> - Live photograph references and campaign associations."

---

### [7:45 – 8:45] Competitor Intelligence & Field Evidence Verification
*(Click 'Competitor Intelligence' tab, then navigate to `/campaigns/CMP-8821`)*

> "We also introduced **Competitor Intelligence**:
> Brands don't operate in a vacuum. MARP tracks competitor billboard placements side-by-side — for example, comparing Jazz's footprint against Zong 4G and Telenor across key highway arterial routes.
> 
> *(Click Campaign Workspace -> 'Evidence' tab)*
> 
> Now, how do we close the loop on ground truth?
> 1. In **Field Staff Scheduling**, managers assign active surveyors (like Aroon, Mudasir, or myself) to specific locations with target questionnaires and deadlines.
> 2. The surveyor visits the physical site and captures billboard proof.
> 3. Under **Field Evidence Verification**, human Evidence Reviewers inspect the submission. 
> 
> Notice here on screen:
> - *Centaurus LED Flyover* photo was matched against GPS coordinates and marked **Approved**.
> - Meanwhile, evidence record #4 was **Rejected** because our backend detected the surveyor's GPS geotag was taken **300 meters outside the authorized geofence radius**!
> 
> Fraud is caught instantly."

---

### [8:45 – 9:30] Master Relational Schema (3-Circle ERD)
*(Display Slide 4: Master ERD, or navigate to `/erd` in browser)*

> "Respected evaluators, to achieve all this, our database architecture consists of **28 fully normalized relational tables**, partitioned into **three visually marked circles** corresponding to each of us:
> 
> 1. **Circle 1 (Indigo): Aroon Kumar — Module 01 (10 Entities)**
>    - Houses `COMPANIES`, `USERS`, `ROLES`, `PERMISSIONS`, `REGISTERED_DEVICES`, `AUDIT_LOGS`, and workspace policies.
> 2. **Circle 2 (Emerald): Mudasir Ali — Module 02 (8 Entities)**
>    - Houses `QUESTIONNAIRES`, `VERSIONS`, `QUESTIONS`, `OPTIONS`, `TRANSLATIONS`, `BRANCHING_RULES`, and eligibility OTP controls.
> 3. **Circle 3 (Amber): Abdullah Zafar Khan — Module 03 (10 Entities)**
>    - Houses `CAMPAIGNS`, `LOCATIONS`, `ADVERTISEMENTS`, `COMPETITORS`, `CAMPAIGN_ASSIGNMENTS`, and `CAMPAIGN_EVIDENCE`.
> 
> Notice the four critical foreign key conduits connecting the three circles:
> - Company tenancy flows from Circle 1 into Circles 2 and 3.
> - Authorized Field Staff from Circle 1 are assigned to tasks in Circle 3.
> - Certified questionnaires from Circle 2 are deployed to campaigns in Circle 3."

---

### [9:30 – 10:00] Conclusion & Q&A Transition
*(Display Slide 10: Thank You & Q&A)*

> "In summary:
> - We designed, implemented, and verified **all three core modules**.
> - We achieved **100% automated test pass rate** across 20 pytest test suites.
> - We delivered a **responsive, modern design** that adapts seamlessly from 4K desktop screens down to smartphones.
> 
> MARP bridges the gap between digital multi-agent research and real-world ground truth.
> 
> On behalf of Aroon, Mudasir, and myself — thank you for your time and guidance. We are now ready to answer any questions."

---

## 💡 Quick Answers to Anticipated Evaluator Questions

### Q1: "How do you prevent surveyors from faking their GPS location using mock location apps?"
> **Answer (Aroon / Abdullah):** "Our registered device security records the Android OS version and device identifier. On mobile clients, the Google Play Services Location API provides an `isFromMockProvider()` flag. If mock locations are detected, the payload is flagged automatically. Furthermore, our backend evidence pipeline computes Haversine distance against the registered billboard site coordinates."

### Q2: "What happens if a research manager edits a questionnaire that is currently being filled out in the field?"
> **Answer (Mudasir):** "Our immutable version snapshot architecture solves this. Once a questionnaire is published, its schema snapshot is sealed. Any new edits create a new draft version (v2.0). Field staff continue executing against the certified version snapshot until the manager explicitly deploys the new version."

### Q3: "Can field staff delete campaigns or approve their own submissions?"
> **Answer (Aroon):** "No. Role permissions are enforced by FastAPI middleware on the backend using `require_role(...)`. A Field Staff bearer token attempting to delete campaigns or approve evidence receives an immediate HTTP 403 Forbidden."
