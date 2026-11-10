import sys
import os
import argparse
from datetime import datetime, date, timedelta, timezone

# Ensure backend root is on python path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.config import settings
from app.core.security import get_password_hash
from app.database.session import SessionLocal
from app.database.base import Base
from app.modules.users.models import (
    Company, WorkspaceSetting, User, Role, Permission, user_roles, role_permissions, RegisteredDevice
)
from app.modules.questionnaires.models import (
    Questionnaire, Question, QuestionOption, QuestionTranslation, BranchingRule, QuestionnaireEligibility, OTPConfiguration
)
from app.modules.campaigns.models import (
    Campaign, Location, Advertisement, Competitor, CompetitorCampaign, CompetitorAdvertisement, CampaignAssignment
)

SYSTEM_ROLES = [
    {
        "name": "Company Administrator",
        "display_name": "Company Administrator",
        "description": "Full administrative control over company workspace, users, roles, and audit trails."
    },
    {
        "name": "Research Manager",
        "display_name": "Research Manager",
        "description": "Designs questionnaires, manages campaigns, creates field assignments, and oversees research."
    },
    {
        "name": "Analyst",
        "display_name": "Research Analyst",
        "description": "Access to competitor intelligence, campaign metrics, analytics dashboards, and export reports."
    },
    {
        "name": "Field Staff",
        "display_name": "Field Surveyor",
        "description": "Executes on-ground field surveys, records billboard observations, and captures site evidence."
    },
    {
        "name": "Evidence Reviewer",
        "display_name": "Evidence Quality Reviewer",
        "description": "Validates incoming field photographs, billboard condition logs, and flags questionable submissions."
    }
]

SYSTEM_PERMISSIONS = [
    ("users:view", "View Users", "users"),
    ("users:manage", "Manage Users & Invitations", "users"),
    ("roles:manage", "Manage Roles & Permissions", "users"),
    ("devices:manage", "Manage Registered Mobile Devices", "users"),
    ("audit:view", "Inspect System Audit Logs", "users"),
    ("workspace:manage", "Manage Workspace Settings", "users"),
    
    ("questionnaires:view", "View Questionnaires", "questionnaires"),
    ("questionnaires:manage", "Create & Edit Questionnaires", "questionnaires"),
    ("questionnaires:publish", "Publish & Version Questionnaires", "questionnaires"),
    
    ("campaigns:view", "View Campaigns & Advertisements", "campaigns"),
    ("campaigns:manage", "Manage Campaigns & Budgets", "campaigns"),
    ("locations:manage", "Manage Hierarchical Locations", "campaigns"),
    ("competitors:manage", "Manage Competitor Intelligence", "campaigns"),
    ("assignments:manage", "Schedule & Dispatch Field Staff", "campaigns"),
    ("evidence:review", "Review & Verify Evidence Records", "campaigns"),
]

def init_system(db, seed_demo: bool = False):
    print("=== Initializing MARP System Baseline ===")
    from app.database.session import engine
    from app.database.base import Base
    import app.database # Ensures all models are registered
    Base.metadata.create_all(bind=engine)
    
    # 1. Seed Permissions
    print("-> Checking permissions...")
    perm_dict = {}
    for code, name, module in SYSTEM_PERMISSIONS:
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(code=code, name=name, module=module)
            db.add(perm)
            db.flush()
        perm_dict[code] = perm

    # 2. Seed Roles
    print("-> Checking enterprise roles...")
    role_dict = {}
    for r_data in SYSTEM_ROLES:
        role = db.query(Role).filter(Role.name == r_data["name"]).first()
        if not role:
            role = Role(
                name=r_data["name"],
                display_name=r_data["display_name"],
                description=r_data["description"],
                is_system_role=True
            )
            db.add(role)
            db.flush()
        role_dict[r_data["name"]] = role

    # Link permissions to roles
    admin_role = role_dict["Company Administrator"]
    admin_role.permissions = list(perm_dict.values())

    manager_role = role_dict["Research Manager"]
    manager_perms = [p for code, p in perm_dict.items() if code not in ["workspace:manage", "roles:manage"]]
    manager_role.permissions = manager_perms

    analyst_role = role_dict["Analyst"]
    analyst_role.permissions = [
        perm_dict["campaigns:view"], perm_dict["questionnaires:view"],
        perm_dict["competitors:manage"], perm_dict["audit:view"]
    ]

    field_role = role_dict["Field Staff"]
    field_role.permissions = [perm_dict["campaigns:view"], perm_dict["questionnaires:view"]]

    reviewer_role = role_dict["Evidence Reviewer"]
    reviewer_role.permissions = [perm_dict["evidence:review"], perm_dict["campaigns:view"]]

    db.commit()

    # 3. Create Default Company Workspace
    print("-> Setting up primary enterprise workspace...")
    company = db.query(Company).filter(Company.name == settings.DEFAULT_COMPANY_NAME).first()
    if not company:
        company = Company(
            name=settings.DEFAULT_COMPANY_NAME,
            slug="szabist-research-labs",
            industry="Market Research & Analytics",
            contact_email=settings.FIRST_SUPERUSER_EMAIL,
            phone="+92-51-111-922-478",
            address="Street 9, Plot 67, Sector H-8/4, Islamabad, Pakistan",
            timezone="Asia/Karachi",
            status="active"
        )
        db.add(company)
        db.flush()

        settings_rec = WorkspaceSetting(
            company_id=company.id,
            allow_device_auto_approval=True,
            require_mfa_for_admins=False,
            branding_accent="#D9F66A"
        )
        db.add(settings_rec)
        db.commit()
        db.refresh(company)

    # 4. Create First Super Administrator User
    print("-> Creating primary administrator account...")
    admin_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL.lower()).first()
    if not admin_user:
        admin_user = User(
            company_id=company.id,
            email=settings.FIRST_SUPERUSER_EMAIL.lower(),
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name=settings.FIRST_SUPERUSER_NAME,
            phone="+92-300-1234567",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            is_active=True,
            is_verified=True
        )
        admin_user.roles = [admin_role]
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"   [SUCCESS] Created Administrator: {admin_user.email} / (Password from environment)")
    else:
        print(f"   [INFO] Administrator already exists: {admin_user.email}")

    # 5. Seed Pakistan Hierarchical Location Structure
    print("-> Checking 5-tier Pakistan geographic location hierarchy...")
    root_pk = db.query(Location).filter(Location.company_id == company.id, Location.code == "PK").first()
    if not root_pk:
        root_pk = Location(
            company_id=company.id,
            parent_id=None,
            name="Pakistan",
            code="PK",
            level="country",
            latitude=30.3753,
            longitude=69.3451
        )
        db.add(root_pk)
        db.flush()

        # Provinces
        provinces = [
            ("Punjab", "PB", 31.1704, 72.7097),
            ("Sindh", "SD", 25.8943, 68.5247),
            ("Islamabad Capital Territory", "ICT", 33.6844, 73.0479),
            ("Khyber Pakhtunkhwa", "KPK", 34.9526, 72.3311),
        ]
        prov_map = {}
        for p_name, p_code, p_lat, p_lon in provinces:
            p_loc = Location(
                company_id=company.id,
                parent_id=root_pk.id,
                name=p_name,
                code=p_code,
                level="province",
                latitude=p_lat,
                longitude=p_lon
            )
            db.add(p_loc)
            db.flush()
            prov_map[p_code] = p_loc

        # Cities
        cities = [
            ("Islamabad", "ISB", 33.6844, 73.0479, prov_map["ICT"].id),
            ("Rawalpindi", "RWP", 33.5651, 73.0169, prov_map["PB"].id),
            ("Lahore", "LHE", 31.5204, 74.3587, prov_map["PB"].id),
            ("Karachi", "KHI", 24.8607, 67.0011, prov_map["SD"].id),
        ]
        city_map = {}
        for c_name, c_code, c_lat, c_lon, parent_id in cities:
            c_loc = Location(
                company_id=company.id,
                parent_id=parent_id,
                name=c_name,
                code=c_code,
                level="city",
                latitude=c_lat,
                longitude=c_lon
            )
            db.add(c_loc)
            db.flush()
            city_map[c_code] = c_loc

        # Areas
        areas = [
            ("Blue Area", "ISB-BA", 33.7118, 73.0566, city_map["ISB"].id),
            ("Sector F-6 Markaz", "ISB-F6", 33.7297, 73.0746, city_map["ISB"].id),
            ("Gulberg III", "LHE-GB", 31.5126, 74.3541, city_map["LHE"].id),
            ("Clifton Block 2", "KHI-CL", 24.8197, 67.0315, city_map["KHI"].id),
        ]
        area_map = {}
        for a_name, a_code, a_lat, a_lon, parent_id in areas:
            a_loc = Location(
                company_id=company.id,
                parent_id=parent_id,
                name=a_name,
                code=a_code,
                level="area",
                latitude=a_lat,
                longitude=a_lon
            )
            db.add(a_loc)
            db.flush()
            area_map[a_code] = a_loc

        # Sites / Specific Audit Intersections
        sites = [
            ("Beverly Centre Unipole #4", "SITE-BA-01", 33.7130, 73.0580, area_map["ISB-BA"].id, "Opposite Beverly Centre, Jinnah Ave"),
            ("Centaurus Flyover LED Screen", "SITE-BA-02", 33.7075, 73.0505, area_map["ISB-BA"].id, "Jinnah Ave intersection at Centaurus"),
            ("Liberty Roundabout Static Gantry", "SITE-GB-01", 31.5118, 74.3489, area_map["LHE-GB"].id, "Main Liberty Market Roundabout"),
            ("Bilawal Chowrangi Frontlit Billboard", "SITE-CL-01", 24.8142, 67.0270, area_map["KHI-CL"].id, "Khayaban-e-Saadi Crossing"),
        ]
        for s_name, s_code, s_lat, s_lon, parent_id, addr in sites:
            s_loc = Location(
                company_id=company.id,
                parent_id=parent_id,
                name=s_name,
                code=s_code,
                level="site",
                latitude=s_lat,
                longitude=s_lon,
                address=addr
            )
            db.add(s_loc)
        db.commit()
        print("   [SUCCESS] 5-tier location hierarchy populated.")

    # 6. Seed Demo Data (Optional for initial demonstration)
    if seed_demo:
        print("-> Seeding initial demo scenario (field staff, campaigns, questionnaires with Urdu RTL and branching)...")
        # Field Staff Users
        staff_data = [
            ("Aroon Field Specialist", "aroon.surveyor@marp.io", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"),
            ("Mudasir Field Inspector", "mudasir.field@marp.io", "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80"),
            ("Abdullah Site Auditor", "abdullah.audit@marp.io", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80")
        ]
        staff_users = []
        for s_name, s_email, s_avatar in staff_data:
            s_user = db.query(User).filter(User.email == s_email).first()
            if not s_user:
                s_user = User(
                    company_id=company.id,
                    email=s_email,
                    hashed_password=get_password_hash("Staff12345!"),
                    full_name=s_name,
                    phone="+92-312-9876543",
                    avatar_url=s_avatar,
                    is_active=True,
                    is_verified=True
                )
                s_user.roles = [role_dict["Field Staff"]]
                db.add(s_user)
                db.flush()
            staff_users.append(s_user)

        # Registered Device
        dev = db.query(RegisteredDevice).filter(RegisteredDevice.device_identifier == "IMEI-863920048123456").first()
        if not dev:
            dev = RegisteredDevice(
                company_id=company.id,
                user_id=staff_users[0].id,
                device_identifier="IMEI-863920048123456",
                device_name="Samsung Galaxy A54 5G (Field #1)",
                model="SM-A546B",
                os_version="Android 14 (One UI 6.0)",
                app_version="1.0.4-prod",
                status="Approved",
                last_active_at=datetime.now(timezone.utc)
            )
            db.add(dev)

        # Questionnaires with Conditional Branching and Urdu
        q_bb = db.query(Questionnaire).filter(Questionnaire.company_id == company.id, Questionnaire.title == "OOH Billboard Structural & Visibility Audit").first()
        if not q_bb:
            q_bb = Questionnaire(
                company_id=company.id,
                created_by=admin_user.id,
                title="OOH Billboard Structural & Visibility Audit",
                description="Comprehensive on-ground evaluation of billboard illumination, structural integrity, physical damage, and obstruction.",
                category="Billboard",
                status="Published",
                current_version=1,
                published_at=datetime.now(timezone.utc)
            )
            db.add(q_bb)
            db.flush()

            # Questions
            q1 = Question(
                questionnaire_id=q_bb.id,
                question_text="What is the physical condition of the billboard structure?",
                question_type="single_choice",
                help_text="Examine frame alignment, torn vinyl flex, and structural rust.",
                is_required=True,
                order_index=0
            )
            db.add(q1)
            db.flush()

            opts = [("Excellent", "Excellent", 0), ("Good", "Good", 1), ("Average", "Average", 2), ("Poor", "Poor", 3)]
            for lbl, val, idx in opts:
                db.add(QuestionOption(question_id=q1.id, label=lbl, value=val, order_index=idx))

            # Urdu translation
            db.add(QuestionTranslation(
                question_id=q1.id,
                language_code="ur",
                translated_text="بل بورڈ کے ڈھانچے کی جسمانی حالت کیسی ہے؟",
                translated_help_text="فریم کی درستگی، پھٹے ہوئے فلیکس اور زنگ کا معائنہ کریں۔",
                translated_options=[
                    {"label": "بہترین", "value": "Excellent"},
                    {"label": "اچھی", "value": "Good"},
                    {"label": "اوسط", "value": "Average"},
                    {"label": "خراب", "value": "Poor"}
                ]
            ))

            # Follow up conditional question (shown ONLY if condition is Poor)
            q2 = Question(
                questionnaire_id=q_bb.id,
                question_text="Upload high-resolution evidence photograph of the structural damage or torn banner",
                question_type="image_upload",
                help_text="Required when billboard condition is rated as Poor.",
                is_required=True,
                order_index=1,
                validation_rules={"allowed_formats": ["jpg", "jpeg", "png"], "max_mb": 15}
            )
            db.add(q2)
            db.flush()

            db.add(QuestionTranslation(
                question_id=q2.id,
                language_code="ur",
                translated_text="ڈھانچے کے نقصان یا پھٹے ہوئے بینر کی ہائی ریزولوشن ثبوتی تصویر اپ لوڈ کریں",
                translated_help_text="جب حالت خراب ہو تو تصویر لازمی ہے۔",
                translated_options=[]
            ))

            # Branching rule: If q1 equals "Poor" -> Show q2
            b_rule = BranchingRule(
                questionnaire_id=q_bb.id,
                source_question_id=q1.id,
                target_question_id=q2.id,
                condition_operator="equals",
                condition_value="Poor",
                action="show"
            )
            db.add(b_rule)

            # Additional question: GPS coordinate
            q3 = Question(
                questionnaire_id=q_bb.id,
                question_text="Record GPS verification coordinates at the site boundary",
                question_type="gps_location",
                is_required=True,
                order_index=2
            )
            db.add(q3)

        # Retail survey
        q_ret = db.query(Questionnaire).filter(Questionnaire.company_id == company.id, Questionnaire.title == "Retail Shelf Presence & SKU Audit").first()
        if not q_ret:
            q_ret = Questionnaire(
                company_id=company.id,
                created_by=admin_user.id,
                title="Retail Shelf Presence & SKU Audit",
                description="Store visit audit measuring brand share of shelf, planogram compliance, and competitor promotional end-caps.",
                category="Retail",
                status="Published",
                current_version=1,
                published_at=datetime.now(timezone.utc)
            )
            db.add(q_ret)
            db.flush()

            q_ret1 = Question(
                questionnaire_id=q_ret.id,
                question_text="Is the primary promotional display positioned at eye level?",
                question_type="single_choice",
                is_required=True,
                order_index=0
            )
            db.add(q_ret1)
            db.flush()
            db.add(QuestionOption(question_id=q_ret1.id, label="Yes - Eye Level", value="Yes", order_index=0))
            db.add(QuestionOption(question_id=q_ret1.id, label="No - Lower Shelf", value="No_Lower", order_index=1))
            db.add(QuestionOption(question_id=q_ret1.id, label="No - Not Displayed", value="No_None", order_index=2))

        # Campaigns
        c_jazz = db.query(Campaign).filter(Campaign.company_id == company.id, Campaign.code == "CMP-2026-ISB-01").first()
        site_ba1 = db.query(Location).filter(Location.company_id == company.id, Location.code == "SITE-BA-01").first()
        site_ba2 = db.query(Location).filter(Location.company_id == company.id, Location.code == "SITE-BA-02").first()
        site_gb1 = db.query(Location).filter(Location.company_id == company.id, Location.code == "SITE-GB-01").first()

        if not c_jazz and site_ba1:
            c_jazz = Campaign(
                company_id=company.id,
                manager_id=admin_user.id,
                title="Jazz 5G Nationwide Outdoor Blitz",
                code="CMP-2026-ISB-01",
                description="Nationwide out-of-home advertising verification and brand awareness tracking campaign covering major arterial highways.",
                research_category="Billboard",
                status="Active",
                budget=2500000.0,
                start_date=date.today() - timedelta(days=5),
                end_date=date.today() + timedelta(days=25)
            )
            c_jazz.locations = [site_ba1, site_ba2]
            c_jazz.questionnaires = [q_bb]
            db.add(c_jazz)
            db.flush()

            # Advertisements
            ad1 = Advertisement(
                company_id=company.id,
                campaign_id=c_jazz.id,
                location_id=site_ba1.id,
                name="Jazz Super 4G Unipole - Beverly Centre",
                ad_type="Unipole",
                brand="Jazz",
                dimensions="60x20",
                orientation="North-Facing",
                illumination_type="Frontlit",
                image_url="https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
                status="Active"
            )
            ad2 = Advertisement(
                company_id=company.id,
                campaign_id=c_jazz.id,
                location_id=site_ba2.id,
                name="Jazz Digit 4G Curved LED Screen",
                ad_type="Digital LED",
                brand="Jazz",
                dimensions="40x20",
                orientation="South-Facing",
                illumination_type="Digital/LED",
                image_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
                status="Active"
            )
            db.add(ad1)
            db.add(ad2)

            # Field assignments for Kanban Board
            asgn1 = CampaignAssignment(
                campaign_id=c_jazz.id,
                user_id=staff_users[0].id,
                location_id=site_ba1.id,
                questionnaire_id=q_bb.id,
                scheduled_date=date.today(),
                due_date=date.today() + timedelta(days=1),
                priority="High",
                status="In Progress",
                notes="Inspect physical illumination timers and check for vinyl tears."
            )
            asgn2 = CampaignAssignment(
                campaign_id=c_jazz.id,
                user_id=staff_users[1].id,
                location_id=site_ba2.id,
                questionnaire_id=q_bb.id,
                scheduled_date=date.today() + timedelta(days=2),
                due_date=date.today() + timedelta(days=3),
                priority="Medium",
                status="Scheduled",
                notes="Verify digital LED brightness at night."
            )
            asgn3 = CampaignAssignment(
                campaign_id=c_jazz.id,
                user_id=staff_users[2].id,
                location_id=site_ba1.id,
                questionnaire_id=q_bb.id,
                scheduled_date=date.today() - timedelta(days=2),
                due_date=date.today() - timedelta(days=1),
                priority="High",
                status="Completed",
                notes="Completed audit - vinyl is in pristine condition."
            )
            db.add(asgn1)
            db.add(asgn2)
            db.add(asgn3)

        # Competitors
        comp_telenor = db.query(Competitor).filter(Competitor.company_id == company.id, Competitor.name == "Telenor Pakistan").first()
        if not comp_telenor and site_ba1:
            comp_telenor = Competitor(
                company_id=company.id,
                name="Telenor Pakistan",
                parent_company="Telenor Group",
                brand_tier="Tier 1",
                notes="Aggressive competitive placement on Jinnah Avenue and Gulberg."
            )
            db.add(comp_telenor)
            db.flush()

            cc = CompetitorCampaign(
                competitor_id=comp_telenor.id,
                title="Telenor EasyPaisa Summer Promotion",
                category="Billboard",
                start_date=date.today() - timedelta(days=10),
                end_date=date.today() + timedelta(days=20),
                status="Active"
            )
            db.add(cc)
            db.flush()

            ca = CompetitorAdvertisement(
                competitor_campaign_id=cc.id,
                location_id=site_ba1.id,
                brand="Telenor",
                ad_type="Static Billboard",
                dimensions="50x15",
                image_url="https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80",
                notes="Adjacent to Jazz unipole on north carriageway."
            )
            db.add(ca)

        db.commit()
        print("   [SUCCESS] Demonstration scenario seeded.")

    db.commit()
    print("=== MARP Initialization Complete! ===")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap MARP database and administrator account.")
    parser.add_argument("--seed-demo", action="store_true", help="Seed initial university presentation scenario.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        init_system(db, seed_demo=args.seed_demo)
    finally:
        db.close()
