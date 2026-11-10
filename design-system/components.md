# MARP Design System Components Guide

**Aesthetic Direction:** Premium Scandinavian/Modern SaaS dashboard matching the reference video and Figma frame (`SCR-20261110-ndni.png`). Warm beige/taupe outer canvas, rounded ivory workspace, jet-black vertical sidebar with squircle icon buttons, smooth rounded white cards, rich pastel tag pills, and dark analytics widgets.

---

## 1. Layout & Shell Structure

### 1.1 Outer Canvas & Workspace Shell
- **Outer Canvas (`.marp-canvas`):**
  - Background: `#E6E2D8`
  - Padding: `p-3 md:p-4 lg:p-6`
  - Min-height: `100vh`
- **Workspace (`.marp-workspace`):**
  - Background: `#F7F5EC`
  - Border radius: `rounded-[32px]`
  - Shadow: `shadow-sm`
  - Layout: Flexbox / Grid row with Sidebar + Main Content

### 1.2 Sidebar (`.marp-sidebar`)
- **Width:** `w-20` (desktop), collapsible on mobile
- **Background:** Jet Black `#111111`
- **Border radius:** `rounded-[28px]`
- **Top Brand Logo:** Circular/crescent white mark with 32px height
- **Navigation Buttons:**
  - Inactive: `w-12 h-12 rounded-2xl flex items-center justify-center text-[#77746F] hover:text-white hover:bg-[#222222] transition-colors`
  - Active: `w-12 h-12 rounded-2xl flex items-center justify-center bg-white text-[#111111] shadow-md`
- **Bottom Section:**
  - User avatar with subtle ring
  - Sign out button with tooltip

---

## 2. Core Reusable Components

### 2.1 Buttons
- **Primary Pill (`.btn-primary`):**
  - Background: `#111111` (hover: `#262626`)
  - Text: `#FFFFFF`, `text-sm font-semibold`
  - Shape: `rounded-full px-5 py-2.5`
  - Icon: Leading `+` or action icon
- **Secondary / Ghost Pill (`.btn-secondary`):**
  - Background: `#FFFFFF` (hover: `#F0EDE4`)
  - Text: `#171717`, border: `border border-[#E5E1D8]`
  - Shape: `rounded-full px-4 py-2`
- **Accent Button (`.btn-accent-lime`):**
  - Background: `#D9F66A`
  - Text: `#171717 font-semibold`
  - Shape: `rounded-full px-5 py-2.5`

### 2.2 Category & Status Badges
- **Lime Tag:** `bg-[#D9F66A]/90 text-[#3E520A] rounded-full px-3 py-1 text-xs font-medium`
- **Periwinkle Tag:** `bg-[#91ACF8]/30 text-[#1E3A8A] rounded-full px-3 py-1 text-xs font-medium`
- **Lavender Tag:** `bg-[#B6A0F3]/30 text-[#3B2A6B] rounded-full px-3 py-1 text-xs font-medium`
- **Mint Tag:** `bg-[#9DD9C7]/40 text-[#164E43] rounded-full px-3 py-1 text-xs font-medium`
- **Soft Orange Tag:** `bg-[#F2B77C]/30 text-[#7C2D12] rounded-full px-3 py-1 text-xs font-medium`
- **Black Count Pill:** `bg-[#111111] text-white rounded-full px-2 py-0.5 text-xs font-bold inline-flex items-center justify-center min-w-[20px]`

### 2.3 Task & Workflow Board Cards (`.kanban-card`)
- **Container:** Pure white `#FFFFFF`, `rounded-2xl`, `p-5`, `shadow-[0_4px_20px_-2px_rgba(23,23,23,0.04)]`
- **Header:** Tag pill on left, Calendar icon + Date string on right
- **Title:** `text-[15px] font-semibold text-[#171717] mt-3 mb-1 line-clamp-1`
- **Description:** `text-xs text-[#77746F] line-clamp-2 leading-relaxed`
- **Footer:** Overlapping user avatar stack on left, attachment and comment counters on right

### 2.4 Dark Analytics Widget (`.card-dark-analytics`)
- **Container:** Background `#111111`, `text-white`, `rounded-[28px]`, `p-6`, `shadow-xl`
- **Header:** Title (e.g., "Questionnaire Categories") + Date range pill
- **Donut Chart:** Recharts Pie with center total badge (`text-3xl font-bold`) and sub-label ("Total")
- **Legend:** Colored indicator dots with category labels

### 2.5 Light Frosted Bar Chart Widget (`.card-light-chart`)
- **Container:** Background `rgba(255,255,255,0.85)` with backdrop blur, `rounded-[28px]`, `p-6`, subtle border
- **Header:** Metric figure (`$12,450` or `1,420 Submissions`), subtext, and Week selector
- **Bar Chart:** Rounded vertical bars in `#91ACF8` with active bar tooltip pill (`bg-black text-white rounded-lg px-2 py-1 text-xs`)

### 2.6 Form Controls & Inputs
- **Search Pill:** Rounded-full search bar with magnifying glass icon, white background, placeholder text `#77746F`
- **Input Fields:** Rounded-xl white inputs with `#E5E1D8` borders and focus ring
- **Select Dropdowns:** Custom styled dropdowns with smooth popover menus

### 2.7 Empty States
- Clean, non-intrusive empty states with subtle illustration/icon, clear header (e.g. "No campaigns found"), helpful description, and high-visibility "+ Create" pill button.

---
*Components tested and documented for implementation consistency.*
