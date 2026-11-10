import { NextRequest, NextResponse } from "next/server";

// Dynamic in-memory store for stateful operations on Vercel
let mockUsers = [
  {
    id: "u-1",
    email: "admin@marp.io",
    full_name: "Aroon Kumar (Lead)",
    phone: "+92-300-1234567",
    roles: ["Company Administrator"],
    is_active: true,
    is_verified: true,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-10-15T09:00:00Z",
  },
  {
    id: "u-2",
    email: "manager@marp.io",
    full_name: "Mudasir Ali",
    phone: "+92-300-7654321",
    roles: ["Research Manager"],
    is_active: true,
    is_verified: true,
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-10-16T10:30:00Z",
  },
  {
    id: "u-3",
    email: "analyst@marp.io",
    full_name: "Abdullah Zafar Khan",
    phone: "+92-321-9876543",
    roles: ["Analyst"],
    is_active: true,
    is_verified: true,
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-10-18T11:15:00Z",
  },
  {
    id: "u-4",
    email: "field@marp.io",
    full_name: "Zainab Fatima",
    phone: "+92-333-7788990",
    roles: ["Field Staff"],
    is_active: true,
    is_verified: true,
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-10-22T14:00:00Z",
  },
  {
    id: "u-5",
    email: "reviewer@marp.io",
    full_name: "Bilal Ahmed",
    phone: "+92-345-9988776",
    roles: ["Evidence Reviewer"],
    is_active: true,
    is_verified: true,
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-10-25T16:20:00Z",
  },
];

let mockDevices = [
  {
    id: "dev-1",
    device_name: "Samsung Galaxy S23 Ultra",
    device_identifier: "358920194820192",
    model: "SM-S918B",
    os_version: "Android 14",
    app_version: "v1.4.2",
    status: "Approved",
    user_name: "Aroon Kumar (Lead)",
    user_email: "admin@marp.io",
    last_active_at: "2026-11-10T11:30:00Z",
  },
  {
    id: "dev-2",
    device_name: "Xiaomi Redmi Note 12 Pro",
    device_identifier: "867492019482710",
    model: "22101316G",
    os_version: "Android 13",
    app_version: "v1.4.0",
    status: "Approved",
    user_name: "Mudasir Ali",
    user_email: "manager@marp.io",
    last_active_at: "2026-11-10T08:15:00Z",
  },
  {
    id: "dev-3",
    device_name: "Google Pixel 7 Pro",
    device_identifier: "352819402948172",
    model: "GP4BC",
    os_version: "Android 14",
    app_version: "v1.4.2",
    status: "Approved",
    user_name: "Abdullah Zafar Khan",
    user_email: "analyst@marp.io",
    last_active_at: "2026-11-10T12:00:00Z",
  },
  {
    id: "dev-4",
    device_name: "Vivo V29 5G",
    device_identifier: "861928401928471",
    model: "V2250",
    os_version: "Android 13",
    app_version: "v1.3.9",
    status: "Pending",
    user_name: "Zainab Fatima",
    user_email: "field@marp.io",
    last_active_at: "2026-11-09T18:45:00Z",
  },
  {
    id: "dev-5",
    device_name: "OnePlus Nord CE 3 Lite",
    device_identifier: "359182740192841",
    model: "CPH2493",
    os_version: "Android 13",
    app_version: "v1.2.0",
    status: "Revoked",
    user_name: "Bilal Ahmed",
    user_email: "reviewer@marp.io",
    last_active_at: "2026-10-28T09:10:00Z",
  },
];

let mockAuditLogs = [
  {
    id: "log-1",
    actor_email: "admin@marp.io",
    action: "USER_LOGIN_SUCCESS",
    resource_type: "auth",
    ip_address: "182.180.75.22",
    metadata: { browser: "Chrome 122", os: "macOS" },
    created_at: "2026-11-10T12:00:00Z",
  },
  {
    id: "log-2",
    actor_email: "admin@marp.io",
    action: "DEVICE_REGISTERED",
    resource_type: "device",
    ip_address: "182.180.75.22",
    metadata: { imei: "358920194820192", model: "SM-S918B" },
    created_at: "2026-11-10T11:45:00Z",
  },
  {
    id: "log-3",
    actor_email: "manager@marp.io",
    action: "QUESTIONNAIRE_PUBLISHED",
    resource_type: "questionnaire",
    ip_address: "39.40.112.5",
    metadata: { title: "National OOH Billboard Visibility Audit", version: "1.0" },
    created_at: "2026-11-10T10:15:00Z",
  },
  {
    id: "log-4",
    actor_email: "reviewer@marp.io",
    action: "EVIDENCE_VERIFIED_APPROVED",
    resource_type: "campaign_evidence",
    ip_address: "119.160.67.89",
    metadata: { site: "Centaurus Flyover LED Screen", geofence_match: true },
    created_at: "2026-11-10T09:30:00Z",
  },
  {
    id: "log-5",
    actor_email: "reviewer@marp.io",
    action: "EVIDENCE_FRAUD_FLAGGED",
    resource_type: "campaign_evidence",
    ip_address: "119.160.67.89",
    metadata: { reason: "Geotag taken 300m outside geofence boundary", status: "rejected" },
    created_at: "2026-11-09T17:20:00Z",
  },
];

let mockQuestionnaires = [
  {
    id: "q-1",
    title: "National OOH Billboard Visibility Audit",
    code: "SURV-OOH-2026",
    category: "Billboard Surveys",
    description: "Standard operating audit for roadside unipoles, SMDs, structural condition, illumination, and obstruction in Pakistan.",
    status: "Published",
    current_version: "1.0",
    questions_count: 5,
    languages: ["English", "Urdu"],
    created_at: "2026-10-20T10:00:00Z",
    versions: [
      { id: "v-1", version_number: "1.0", status: "published", published_at: "2026-11-01T12:00:00Z", changelog: "Initial production release" }
    ],
    questions: [
      {
        id: "q-field-1",
        code: "Q1",
        label: "What is the physical condition of the billboard structure?",
        field_type: "single_choice",
        is_required: true,
        order_index: 1,
        options: [
          { id: "o-1", label: "Excellent - Fully Intact & Clean", value: "excellent" },
          { id: "o-2", label: "Good - Minor Wear", value: "good" },
          { id: "o-3", label: "Average - Faded Skin", value: "average" },
          { id: "o-4", label: "Poor - Structural Damage / Torn Skin", value: "poor" },
        ],
        translations: {
          ur: {
            label: "بل بورڈ کے ڈھانچے کی جسمانی حالت کیا ہے؟",
            options: ["بہترین - مکمل درست اور صاف", "اچھی - معمولی خرابی", "اوسط - مٹا ہوا پرنٹ", "خراب - پھٹا ہوا یا ڈھانچہ خراب"]
          }
        }
      },
      {
        id: "q-field-2",
        code: "Q2",
        label: "Is the billboard illuminated during evening hours?",
        field_type: "single_choice",
        is_required: true,
        order_index: 2,
        options: [
          { id: "o-5", label: "Yes - Fully Lit", value: "yes_lit" },
          { id: "o-6", label: "Partial - Some Lights Fused", value: "partial" },
          { id: "o-7", label: "No - Complete Blackout", value: "blackout" },
        ],
        translations: {
          ur: {
            label: "کیا شام کے اوقات میں بل بورڈ پر لائٹس جل رہی ہیں؟",
            options: ["ہاں - مکمل روشن", "جزوی - کچھ لائٹس بند ہیں", "نہیں - بالکل اندھیرا ہے"]
          }
        }
      },
      {
        id: "q-field-3",
        code: "Q3",
        label: "Upload Close-up Photograph of Structural Damage or Torn Skin",
        field_type: "image_upload",
        is_required: true,
        order_index: 3,
        description: "Conditionally triggered when Q1 condition is marked as Poor.",
        translations: {
          ur: {
            label: "خرابی یا پھٹے ہوئے حصے کی واضح تصویر اپ لوڈ کریں",
            description: "یہ سوال صرف اس وقت ظاہر ہوتا ہے جب حالت 'خراب' منتخب کی جائے۔"
          }
        }
      },
    ],
    branching_rules: [
      {
        id: "br-1",
        source_question_id: "q-field-1",
        operator: "equals",
        value: "poor",
        action: "show",
        target_question_id: "q-field-3"
      }
    ]
  },
  {
    id: "q-2",
    title: "Beverage Retail Planogram Execution Study",
    code: "SURV-RET-409",
    category: "Retail Audits",
    description: "In-store cooler placement, stock availability, and competitor promotional point-of-sale visibility.",
    status: "Published",
    current_version: "1.0",
    questions_count: 8,
    languages: ["English"],
    created_at: "2026-10-25T14:30:00Z",
  },
  {
    id: "q-3",
    title: "Competitor Telecom Out-of-Home Footprint",
    code: "SURV-COMP-882",
    category: "Competitor Studies",
    description: "Tracking rival 4G/5G highway placements, messaging themes, and bridge banner density.",
    status: "Draft",
    current_version: "0.9",
    questions_count: 6,
    languages: ["English", "Urdu"],
    created_at: "2026-11-02T11:00:00Z",
  }
];

let mockCampaigns = [
  {
    id: "CMP-8821",
    name: "Jazz 4G National Highway Dominance 2026",
    brand: "Jazz Telecom",
    status: "Active",
    start_date: "2026-11-01",
    end_date: "2026-12-31",
    budget: "Rs 45,000,000",
    manager_name: "Tariq Mehmood",
    billboard_count: 14,
    submissions_count: 42,
    completion_percentage: 68,
  },
  {
    id: "CMP-7714",
    name: "Coca-Cola Pakistan Summer Refresher",
    brand: "Coca-Cola",
    status: "In Progress",
    start_date: "2026-10-15",
    end_date: "2026-11-30",
    budget: "Rs 28,000,000",
    manager_name: "Mudasir Ali",
    billboard_count: 9,
    submissions_count: 27,
    completion_percentage: 54,
  },
  {
    id: "CMP-9902",
    name: "Habib Bank Digital Banking Blitz",
    brand: "HBL",
    status: "Planning",
    start_date: "2026-12-01",
    end_date: "2027-01-31",
    budget: "Rs 19,500,000",
    manager_name: "Sara Khan",
    billboard_count: 6,
    submissions_count: 0,
    completion_percentage: 15,
  }
];

let mockBillboards = [
  {
    id: "bb-1",
    name: "Beverly Centre Blue Area Unipole #4",
    brand: "Jazz 4G",
    type: "Unipole",
    dimensions: "60x20 ft",
    illumination: "Frontlit LED",
    orientation: "North-Facing",
    location: "Blue Area, Islamabad",
    coordinates: "33.7145, 73.0612",
    photo_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    status: "Active",
  },
  {
    id: "bb-2",
    name: "Centaurus Flyover Giant SMD Screen",
    brand: "Jazz 4G",
    type: "SMD Digital Screen",
    dimensions: "80x30 ft",
    illumination: "Digital LED (P6)",
    orientation: "East-Facing",
    location: "Jinnah Avenue, Islamabad",
    coordinates: "33.7073, 73.0498",
    photo_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    status: "Active",
  },
  {
    id: "bb-3",
    name: "Liberty Roundabout Unipole #12",
    brand: "Coca-Cola",
    type: "Unipole",
    dimensions: "120x40 ft",
    illumination: "Backlit LED",
    orientation: "Roundabout Panoramic",
    location: "Gulberg III, Lahore",
    coordinates: "31.5122, 74.3436",
    photo_url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    status: "Active",
  },
  {
    id: "bb-4",
    name: "Clifton 2 Talwar Bridge Gantry",
    brand: "Zong 4G",
    type: "Bridge Gantry",
    dimensions: "70x15 ft",
    illumination: "Frontlit",
    orientation: "South-Facing",
    location: "Clifton Block 2, Karachi",
    coordinates: "24.8198, 67.0315",
    photo_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    status: "Active",
  }
];

let mockEvidence = [
  {
    id: "ev-1",
    campaign_id: "CMP-8821",
    site_name: "Centaurus Flyover Giant SMD Screen",
    surveyor_name: "Aroon Kumar (Lead)",
    device_model: "Samsung Galaxy S23 Ultra",
    submitted_at: "2026-11-10T10:15:00Z",
    photo_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    geotag_lat: 33.7073,
    geotag_lng: 73.0498,
    distance_meters: 12,
    status: "Approved",
    review_notes: "Visual match confirmed; lighting operational; zero obstruction.",
  },
  {
    id: "ev-2",
    campaign_id: "CMP-8821",
    site_name: "Beverly Centre Blue Area Unipole #4",
    surveyor_name: "Mudasir Ali",
    device_model: "Xiaomi Redmi Note 12 Pro",
    submitted_at: "2026-11-10T09:40:00Z",
    photo_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    geotag_lat: 33.7145,
    geotag_lng: 73.0612,
    distance_meters: 8,
    status: "Approved",
    review_notes: "Perfect alignment. High-resolution submission.",
  },
  {
    id: "ev-3",
    campaign_id: "CMP-7714",
    site_name: "Liberty Roundabout Unipole #12",
    surveyor_name: "Abdullah Zafar Khan",
    device_model: "Google Pixel 7 Pro",
    submitted_at: "2026-11-09T18:00:00Z",
    photo_url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    geotag_lat: 31.5122,
    geotag_lng: 74.3436,
    distance_meters: 15,
    status: "Approved",
    review_notes: "Evening audit confirms backlit illumination functioning properly.",
  },
  {
    id: "ev-4",
    campaign_id: "CMP-8821",
    site_name: "Rawalpindi Saddar Overhead Bridge",
    surveyor_name: "Zainab Fatima",
    device_model: "Vivo V29 5G",
    submitted_at: "2026-11-09T16:20:00Z",
    photo_url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    geotag_lat: 33.5982,
    geotag_lng: 73.0441,
    distance_meters: 340,
    status: "Rejected",
    review_notes: "GPS violation: Photo taken 340 meters outside authorized site geofence radius. Fraud flag triggered.",
  }
];

async function tryProxy(req: NextRequest, pathParts: string[], method: string) {
  const targetHost = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
  const search = req.nextUrl.search;
  const targetUrl = `${targetHost}/api/v1/${pathParts.join("/")}${search}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout for local/remote proxy

    const body = method !== "GET" && method !== "HEAD" ? await req.text() : undefined;
    const res = await fetch(targetUrl, {
      method,
      headers: {
        "content-type": req.headers.get("content-type") || "application/json",
        authorization: req.headers.get("authorization") || "",
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok || res.status === 401 || res.status === 403 || res.status === 422) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
  } catch {
    // Backend offline or unreachable, fall through to in-memory fallback
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const proxied = await tryProxy(req, params.path, "GET");
  if (proxied) return proxied;

  const path = params.path.join("/");

  // 1. Dashboard Routes
  if (path === "dashboard/workflow-board") {
    return NextResponse.json({
      todo: [
        {
          id: "task-1",
          title: "Verify Centaurus LED Night Illumination",
          campaign: "Jazz 4G National Highway Dominance",
          assignee: "Aroon Kumar (Lead)",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          status: "todo",
          priority: "High",
          tag: "Field Audit",
          location: "Centaurus Flyover, Islamabad",
        },
        {
          id: "task-2",
          title: "Audit Coca-Cola Retail Cooler Share",
          campaign: "Coca-Cola Pakistan Summer Refresher",
          assignee: "Mudasir Ali",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          status: "todo",
          priority: "Medium",
          tag: "Retail Check",
          location: "Gulberg III, Lahore",
        },
      ],
      in_progress: [
        {
          id: "task-3",
          title: "Zong 4G Competitor Highway Billboard Log",
          campaign: "Telecom OOH Footprint",
          assignee: "Abdullah Zafar Khan",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
          status: "in_progress",
          priority: "High",
          tag: "Competitor",
          location: "GT Road, Gujranwala",
        },
      ],
      review: [
        {
          id: "task-4",
          title: "Blue Area Unipole Structural Skin Inspection",
          campaign: "Jazz 4G National Highway Dominance",
          assignee: "Bilal Ahmed",
          avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
          status: "review",
          priority: "Urgent",
          tag: "Evidence Review",
          location: "Beverly Centre, Blue Area",
        },
      ],
    });
  }

  if (path === "dashboard/analytics/donut") {
    return NextResponse.json({
      total: 3,
      items: [
        { name: "Active", value: 1, color: "#10B981" },
        { name: "In Progress", value: 1, color: "#F59E0B" },
        { name: "Planning", value: 1, color: "#6366F1" },
      ],
    });
  }

  if (path === "dashboard/analytics/weekly") {
    return NextResponse.json({
      total_count: 69,
      headline_metric: "69 Submissions",
      subtext: "Verified ground research audits across Pakistan",
      days: [
        { day: "Mon", count: 8, date_str: "Nov 04", is_active: false },
        { day: "Tue", count: 12, date_str: "Nov 05", is_active: false },
        { day: "Wed", count: 15, date_str: "Nov 06", is_active: false },
        { day: "Thu", count: 9, date_str: "Nov 07", is_active: false },
        { day: "Fri", count: 14, date_str: "Nov 08", is_active: false },
        { day: "Sat", count: 6, date_str: "Nov 09", is_active: false },
        { day: "Sun", count: 5, date_str: "Nov 10", is_active: true },
      ],
    });
  }

  // 2. Users & Workspace Routes
  if (path === "users") {
    return NextResponse.json(mockUsers);
  }

  if (path === "devices") {
    return NextResponse.json(mockDevices);
  }

  if (path === "audit-logs") {
    return NextResponse.json(mockAuditLogs);
  }

  if (path === "settings/workspace") {
    return NextResponse.json({
      company_name: "MARP Enterprise Pakistan",
      slug: "marp-enterprise",
      country: "Pakistan",
      timezone: "Asia/Karachi",
      allow_device_auto_approval: false,
      require_otp_verification: true,
      max_field_radius_meters: 100,
    });
  }

  // 3. Questionnaires Routes
  if (path === "questionnaires") {
    return NextResponse.json(mockQuestionnaires);
  }

  if (path.startsWith("questionnaires/")) {
    const qId = params.path[1];
    const item = mockQuestionnaires.find((q) => q.id === qId) || mockQuestionnaires[0];
    return NextResponse.json(item);
  }

  // 4. Campaigns Routes
  if (path === "campaigns") {
    return NextResponse.json(mockCampaigns);
  }

  if (path === "campaigns/billboards/registry") {
    return NextResponse.json(mockBillboards);
  }

  if (path === "campaigns/evidence/list") {
    return NextResponse.json(mockEvidence);
  }

  if (path === "campaigns/competitors/list") {
    return NextResponse.json([
      { id: "c-1", name: "Zong 4G (CMPak)", brand: "Zong", active_campaigns: 4, billboards_detected: 19 },
      { id: "c-2", name: "Telenor Pakistan", brand: "Telenor", active_campaigns: 2, billboards_detected: 8 },
      { id: "c-3", name: "PepsiCo Pakistan", brand: "Pepsi", active_campaigns: 5, billboards_detected: 24 },
    ]);
  }

  if (path.startsWith("campaigns/")) {
    const cId = params.path[1];
    const camp = mockCampaigns.find((c) => c.id === cId) || mockCampaigns[0];
    return NextResponse.json({
      ...camp,
      locations: [
        { id: "loc-1", name: "Blue Area, Islamabad", level: "area", province: "ICT", sites_count: 5 },
        { id: "loc-2", name: "Gulberg III, Lahore", level: "area", province: "Punjab", sites_count: 8 },
        { id: "loc-3", name: "Clifton Block 2, Karachi", level: "area", province: "Sindh", sites_count: 6 },
      ],
      billboards: mockBillboards,
      evidence: mockEvidence,
    });
  }

  return NextResponse.json({ message: "MARP API Online" }, { status: 200 });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const proxied = await tryProxy(req, params.path, "POST");
  if (proxied) return proxied;

  const path = params.path.join("/");

  // Auth Login
  if (path === "auth/login") {
    try {
      const body = await req.json();
      const email = body.email || "admin@marp.io";
      const user = mockUsers.find((u) => u.email === email) || mockUsers[0];
      return NextResponse.json({
        access_token: "mock-jwt-token-marp-enterprise-2026",
        token_type: "bearer",
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        company_id: "cmp-marp-pk",
        company_name: "MARP Enterprise Pakistan",
        roles: user.roles,
      });
    } catch {
      return NextResponse.json({
        access_token: "mock-jwt-token-marp-enterprise-2026",
        token_type: "bearer",
        user_id: "u-1",
        email: "admin@marp.io",
        full_name: "Aroon Kumar (Lead)",
        company_id: "cmp-marp-pk",
        company_name: "MARP Enterprise Pakistan",
        roles: ["Company Administrator"],
      });
    }
  }

  // Device Approve / Revoke
  if (path.includes("devices/") && path.endsWith("/approve")) {
    const devId = params.path[1];
    const dev = mockDevices.find((d) => d.id === devId);
    if (dev) dev.status = "Approved";
    return NextResponse.json({ success: true, message: "Device approved" });
  }

  if (path.includes("devices/") && path.endsWith("/revoke")) {
    const devId = params.path[1];
    const dev = mockDevices.find((d) => d.id === devId);
    if (dev) dev.status = "Revoked";
    return NextResponse.json({ success: true, message: "Device revoked" });
  }

  // Evidence Review
  if (path.includes("evidence/") && path.endsWith("/review")) {
    const evId = params.path[2];
    const ev = mockEvidence.find((e) => e.id === evId);
    const body = await req.json().catch(() => ({}));
    if (ev) {
      ev.status = body.decision === "approved" ? "Approved" : "Rejected";
      ev.review_notes = body.notes || ev.review_notes;
    }
    return NextResponse.json({ success: true, evidence: ev });
  }

  // Create User
  if (path === "users") {
    const body = await req.json().catch(() => ({}));
    const newUser = {
      id: `u-${Date.now()}`,
      email: body.email || `new.user${Date.now()}@marp.io`,
      full_name: body.full_name || "New Team Member",
      phone: body.phone || "+92-300-0000000",
      roles: body.roles || ["Field Staff"],
      is_active: true,
      is_verified: true,
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      created_at: new Date().toISOString(),
    };
    mockUsers.unshift(newUser);
    return NextResponse.json(newUser, { status: 201 });
  }

  return NextResponse.json({ success: true, message: "Action accepted" }, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  const proxied = await tryProxy(req, params.path, "PUT");
  if (proxied) return proxied;
  return NextResponse.json({ success: true, message: "Resource updated" }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  const proxied = await tryProxy(req, params.path, "DELETE");
  if (proxied) return proxied;
  return NextResponse.json({ success: true, message: "Resource deleted" }, { status: 200 });
}
