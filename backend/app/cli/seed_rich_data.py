import os
import sys
from datetime import datetime, timedelta
import random

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

from app.database.session import SessionLocal
from app.core.security import get_password_hash
from app.modules.users.models import (
    User, Company, Role, Permission, RegisteredDevice, AuditLog, WorkspaceSetting
)
from app.modules.questionnaires.models import (
    Questionnaire, QuestionnaireVersion, Question, QuestionOption, QuestionTranslation,
    BranchingRule, QuestionnaireEligibility, OTPConfiguration
)
from app.modules.campaigns.models import (
    Campaign, Location, Advertisement, Competitor,
    CompetitorCampaign, CompetitorAdvertisement, CampaignAssignment,
    CampaignEvidence
)

def seed_rich_data():
    db = SessionLocal()
    print("-> Seeding rich, realistic FYP demonstration dataset into MARP...")

    # 1. Fetch Company & Roles
    company = db.query(Company).filter(Company.slug == "marp-enterprise").first()
    if not company:
        company = db.query(Company).first()
    
    roles = {r.name: r for r in db.query(Role).all()}
    admin_user = db.query(User).filter(User.email == "admin@marp.io").first()

    # 2. Enrich Users
    additional_users = [
        ("Tariq Mehmood", "tariq.manager@marp.io", "Research Manager", "+92-300-1122334", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"),
        ("Sara Khan", "sara.analyst@marp.io", "Analyst", "+92-321-4455667", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"),
        ("Zainab Fatima", "zainab.staff@marp.io", "Field Staff", "+92-333-7788990", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"),
        ("Bilal Ahmed", "bilal.reviewer@marp.io", "Evidence Reviewer", "+92-345-9988776", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"),
        ("Ayesha Malik", "ayesha.reviewer@marp.io", "Evidence Reviewer", "+92-311-2233445", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"),
    ]

    for name, email, r_name, phone, avatar in additional_users:
        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                company_id=company.id,
                email=email,
                hashed_password=get_password_hash("Staff12345!"),
                full_name=name,
                phone=phone,
                avatar_url=avatar,
                is_active=True,
                is_verified=True,
                created_at=datetime.utcnow() - timedelta(days=random.randint(5, 30))
            )
            u.roles = [roles[r_name]]
            db.add(u)
    db.commit()
    print("   [OK] Personnel accounts seeded across all 5 roles.")

    # 3. Enrich Registered Devices
    all_users = {u.email: u for u in db.query(User).filter(User.company_id == company.id).all()}
    devices_data = [
        ("Samsung Galaxy S23 Ultra", "358920194820192", "SM-S918B", "Android 14", "v1.4.2", "Approved", "aroon.surveyor@marp.io", 2),
        ("Xiaomi Redmi Note 12 Pro", "867492019482710", "22101316G", "Android 13", "v1.4.0", "Approved", "mudasir.field@marp.io", 5),
        ("Google Pixel 7 Pro", "352819402948172", "GP4BC", "Android 14", "v1.4.2", "Approved", "abdullah.audit@marp.io", 1),
        ("Vivo V29 5G", "861928401928471", "V2250", "Android 13", "v1.3.9", "Pending", "zainab.staff@marp.io", 12),
        ("OnePlus Nord CE 3 Lite", "359182740192841", "CPH2493", "Android 13", "v1.2.0", "Revoked", "sara.analyst@marp.io", 45),
    ]

    for d_name, imei, model, os_v, app_v, status, user_email, hours_ago in devices_data:
        d = db.query(RegisteredDevice).filter(RegisteredDevice.device_identifier == imei).first()
        target_u = all_users.get(user_email)
        if not d and target_u:
            d = RegisteredDevice(
                company_id=company.id,
                user_id=target_u.id,
                device_identifier=imei,
                device_name=d_name,
                model=model,
                os_version=os_v,
                app_version=app_v,
                status=status,
                last_active_at=datetime.utcnow() - timedelta(hours=hours_ago),
                created_at=datetime.utcnow() - timedelta(days=random.randint(10, 40))
            )
            db.add(d)
    db.commit()
    print("   [OK] Registered Android devices inventory seeded.")

    # 4. Fetch Locations
    locations = db.query(Location).filter(Location.company_id == company.id).all()
    loc_by_code = {l.code: l for l in locations}
    site_locations = [l for l in locations if l.level == "site"]
    if not site_locations:
        site_locations = locations

    # 5. Enrich Additional Questionnaires
    q_retail = db.query(Questionnaire).filter(Questionnaire.title.ilike("%Shelf%")).first()
    if not q_retail:
        q_retail = Questionnaire(
            company_id=company.id,
            created_by=admin_user.id,
            title="FMCG Retail Shelf Placement & Stock Availability Audit",
            description="Supermarket audit tracking shelf share, promotional endcaps, and competitor SKU pricing.",
            category="Retail",
            status="Published",
            current_version=1,
            published_at=datetime.utcnow() - timedelta(days=8)
        )
        db.add(q_retail)
        db.flush()

        # Questions for Retail
        q1 = Question(
            questionnaire_id=q_retail.id,
            question_text="Is the primary brand product present on eye-level shelf space?",
            question_type="single_choice",
            help_text="Check aisle shelf tier 3 or 4 (eye-level standard).",
            is_required=True,
            order_index=1
        )
        db.add(q1)
        db.flush()
        db.add(QuestionOption(question_id=q1.id, label="Yes - Prime Position", value="prime", order_index=1))
        db.add(QuestionOption(question_id=q1.id, label="Yes - Secondary Position", value="secondary", order_index=2))
        db.add(QuestionOption(question_id=q1.id, label="No - Bottom / Top Shelf", value="non_prime", order_index=3))
        db.add(QuestionOption(question_id=q1.id, label="Out of Stock (OOS)", value="oos", order_index=4))

        q2 = Question(
            questionnaire_id=q_retail.id,
            question_text="Rate overall brand Point-of-Sale (POSM) visibility in store (1-5)",
            question_type="rating_scale",
            help_text="1 = No posters/wobblers, 5 = Dominated aisle with standees.",
            is_required=True,
            order_index=2
        )
        db.add(q2)

        q3 = Question(
            questionnaire_id=q_retail.id,
            question_text="Capture photograph of the promotional gondola display",
            question_type="image_upload",
            help_text="Stand 2 meters back to capture full shelf facade.",
            is_required=True,
            order_index=3
        )
        db.add(q3)
        db.commit()

    q_telecom = db.query(Questionnaire).filter(Questionnaire.title.ilike("%Telecom%")).first()
    if not q_telecom:
        q_telecom = Questionnaire(
            company_id=company.id,
            created_by=admin_user.id,
            title="Telecom 4G/5G Network Coverage & PoP Competitor Survey",
            description="Field survey evaluating cellular signal strength, consumer satisfaction, and competitor switching intent.",
            category="Competitor",
            status="Published",
            current_version=1,
            published_at=datetime.utcnow() - timedelta(days=14)
        )
        db.add(q_telecom)
        db.flush()

        # Eligibility & OTP
        db.add(QuestionnaireEligibility(
            questionnaire_id=q_telecom.id,
            min_age=18,
            max_age=65,
            allowed_genders="Male, Female",
            target_cities=["Karachi", "Lahore", "Islamabad", "Rawalpindi"],
            respondent_quota=500
        ))
        db.add(OTPConfiguration(
            questionnaire_id=q_telecom.id,
            is_otp_required=True,
            provider_name="Telenor/Jazz SMS Gateway Pakistan",
            otp_expiry_seconds=300,
            max_retry_attempts=3
        ))

        q_t1 = Question(
            questionnaire_id=q_telecom.id,
            question_text="Which cellular network is your primary active SIM?",
            question_type="single_choice",
            is_required=True,
            order_index=1
        )
        db.add(q_t1)
        db.flush()
        db.add(QuestionOption(question_id=q_t1.id, label="Jazz (PMCL)", value="jazz", order_index=1))
        db.add(QuestionOption(question_id=q_t1.id, label="Zong 4G (CMPak)", value="zong", order_index=2))
        db.add(QuestionOption(question_id=q_t1.id, label="Telenor Pakistan", value="telenor", order_index=3))
        db.add(QuestionOption(question_id=q_t1.id, label="Ufone 4G", value="ufone", order_index=4))

        q_t2 = Question(
            questionnaire_id=q_telecom.id,
            question_text="How satisfied are you with data speed during peak evening hours? (1 to 5)",
            question_type="rating_scale",
            is_required=True,
            order_index=2
        )
        db.add(q_t2)
        db.commit()

    print("   [OK] Diverse questionnaires seeded across Billboard, Retail, and Competitor domains.")

    # 6. Enrich Campaigns
    c_easy = db.query(Campaign).filter(Campaign.code == "CMP-7742").first()
    if not c_easy:
        c_easy = Campaign(
            company_id=company.id,
            manager_id=all_users.get("tariq.manager@marp.io", admin_user).id,
            title="Easypaisa Cashless Pakistan Retail Push",
            code="CMP-7742",
            description="Multi-city QR merchant audit and outdoor transit billboard verification.",
            research_category="Retail",
            status="In Progress",
            budget=2200000.0,
            start_date=datetime.utcnow().date() - timedelta(days=20),
            end_date=datetime.utcnow().date() + timedelta(days=25)
        )
        db.add(c_easy)
        db.flush()

    c_pepsi = db.query(Campaign).filter(Campaign.code == "CMP-6619").first()
    if not c_pepsi:
        c_pepsi = Campaign(
            company_id=company.id,
            manager_id=admin_user.id,
            title="Pepsi Summer Blitz Out-of-Home Campaign",
            code="CMP-6619",
            description="Gantry and unipole advertising performance across Punjab & Islamabad corridors.",
            research_category="Billboard",
            status="Planning",
            budget=4000000.0,
            start_date=datetime.utcnow().date() + timedelta(days=10),
            end_date=datetime.utcnow().date() + timedelta(days=60)
        )
        db.add(c_pepsi)
        db.flush()
    db.commit()

    # 7. Enrich Advertisements
    main_campaign = db.query(Campaign).first()
    ad_specs = [
        ("Centaurus Flyover SMD Digital Screen", "Digital Billboard (SMD)", "Jazz", "120x40", "North-Facing", "SMD Digital LED", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80", "SITE-BA-02"),
        ("Liberty Roundabout Static Gantry", "Gantry Billboard", "Jazz", "60x20", "West-Facing", "Frontlit", "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80", "SITE-GB-01"),
        ("Bilawal Chowrangi Frontlit Billboard", "Frontlit Unipole", "Jazz", "40x20", "South-Facing", "Frontlit", "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=800&auto=format&fit=crop&q=80", "SITE-CL-01"),
        ("F-7 Markaz Jinnah Super Rooftop LED", "Rooftop Board", "Easypaisa", "30x15", "East-Facing", "Backlit", "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80", "SITE-BA-01"),
        ("Mall Road Bridge Overhead Banner", "Bridge Banner", "Pepsi", "80x15", "Bi-directional", "Unlit", "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80", "SITE-GB-01"),
    ]

    for ad_name, ad_type, brand, dim, orient, illum, img_url, loc_code in ad_specs:
        existing_ad = db.query(Advertisement).filter(Advertisement.name == ad_name).first()
        target_loc = loc_by_code.get(loc_code, site_locations[0])
        if not existing_ad:
            db.add(Advertisement(
                company_id=company.id,
                campaign_id=main_campaign.id,
                location_id=target_loc.id,
                name=ad_name,
                ad_type=ad_type,
                brand=brand,
                dimensions=dim,
                orientation=orient,
                illumination_type=illum,
                image_url=img_url,
                status="Active"
            ))
    db.commit()

    # 8. Enrich Competitors
    comp_zong = db.query(Competitor).filter(Competitor.name == "Zong 4G").first()
    if not comp_zong:
        comp_zong = Competitor(
            company_id=company.id,
            name="Zong 4G",
            parent_company="China Mobile Pakistan (CMPak)",
            brand_tier="Tier 1 Telecommunications",
            notes="Aggressive suburban and highway out-of-home placement strategy."
        )
        db.add(comp_zong)
        db.flush()

        cc = CompetitorCampaign(
            competitor_id=comp_zong.id,
            title="Zong Digital Lifestyle 4G Blitz",
            category="Billboard",
            start_date=datetime.utcnow().date() - timedelta(days=15),
            end_date=datetime.utcnow().date() + timedelta(days=45),
            status="Active"
        )
        db.add(cc)
        db.flush()

        db.add(CompetitorAdvertisement(
            competitor_campaign_id=cc.id,
            location_id=site_locations[0].id,
            brand="Zong 4G",
            ad_type="Static Unipole",
            dimensions="60x20",
            image_url="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
            notes="Positioned directly across Beverly Centre intersecting client billboard."
        ))

    comp_coke = db.query(Competitor).filter(Competitor.name.ilike("%Coca%")).first()
    if not comp_coke:
        comp_coke = Competitor(
            company_id=company.id,
            name="Coca-Cola Pakistan",
            parent_company="The Coca-Cola Company",
            brand_tier="Tier 1 Beverages",
            notes="Dominates prime roundabout SMD digital boards in Lahore and Karachi."
        )
        db.add(comp_coke)
    db.commit()

    # 9. Enrich Campaign Assignments
    all_questionnaires = db.query(Questionnaire).filter(Questionnaire.company_id == company.id).all()
    q_main = all_questionnaires[0]
    surveyor_users = [u for u in all_users.values() if any(r.name == "Field Staff" for r in u.roles)]
    if not surveyor_users:
        surveyor_users = [admin_user]

    assignments_plan = [
        (surveyor_users[0], site_locations[0], q_main, "High", "In Progress", 0, 3, "Inspect frontlit lamp fixtures and skin tears."),
        (surveyor_users[min(1, len(surveyor_users)-1)], site_locations[min(1, len(site_locations)-1)], q_retail, "High", "Pending", 1, 4, "Verify eye-level SKU placement in Gulberg hypermarket."),
        (surveyor_users[min(2, len(surveyor_users)-1)], site_locations[min(2, len(site_locations)-1)], q_telecom, "Medium", "Completed", -5, -2, "Conducted 50 customer speed interviews at Centaurus."),
        (surveyor_users[0], site_locations[min(3, len(site_locations)-1)], q_main, "Medium", "Pending", 2, 5, "Audit Bilawal Chowrangi billboard illumination status."),
        (surveyor_users[min(1, len(surveyor_users)-1)], site_locations[0], q_pepsi if 'q_pepsi' in locals() else q_main, "Low", "Pending", 4, 8, "Pre-campaign site clearance and structural audit."),
    ]

    created_assignments = []
    for user_obj, loc_obj, q_obj, priority, status, start_offset, due_offset, notes in assignments_plan:
        asgn = CampaignAssignment(
            campaign_id=main_campaign.id,
            user_id=user_obj.id,
            location_id=loc_obj.id,
            questionnaire_id=q_obj.id,
            scheduled_date=datetime.utcnow().date() + timedelta(days=start_offset),
            due_date=datetime.utcnow().date() + timedelta(days=due_offset),
            priority=priority,
            status=status,
            notes=notes
        )
        db.add(asgn)
        db.flush()
        created_assignments.append(asgn)
    db.commit()

    # 10. Enrich Campaign Evidence Records
    evidence_data = [
        (created_assignments[2].id, site_locations[0].id, "Billboard Verification Photo", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80", 33.7075, 73.0505, "Approved", {"reviewer": "Bilal Ahmed", "notes": "Crystal clear photo, verified matching Centaurus LED flyover."}),
        (created_assignments[0].id, site_locations[1].id, "Skin Tear Defect Proof", "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80", 31.5118, 74.3489, "Approved", {"reviewer": "Ayesha Malik", "notes": "Damage on bottom-left skin confirmed. Maintenance ticket dispatched."}),
        (created_assignments[1].id, site_locations[2].id, "Nighttime Illumination Audit", "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?w=800&auto=format&fit=crop&q=80", 24.8142, 67.0270, "Pending", {"reviewer": "Ayesha Malik", "notes": "Under review for frontlit beam intensity."}),
        (created_assignments[3].id, site_locations[0].id, "Surveyor GPS Geofence Check", "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80", 33.7150, 73.0600, "Rejected", {"reviewer": "Bilal Ahmed", "notes": "Discrepancy: Geotag taken 300m outside authorized radius."}),
    ]

    for asgn_id, loc_id, e_type, f_url, lat, lon, v_status, r_notes in evidence_data:
        ev = CampaignEvidence(
            campaign_id=main_campaign.id,
            assignment_id=asgn_id,
            location_id=loc_id,
            evidence_type=e_type,
            file_url=f_url,
            latitude=lat,
            longitude=lon,
            recorded_at=datetime.utcnow() - timedelta(days=random.randint(1, 5)),
            verification_status=v_status,
            review_notes=r_notes
        )
        db.add(ev)
    db.commit()
    print("   [OK] Field evidence submissions & review decisions seeded.")

    # 11. Add Rich Audit Logs
    audit_events = [
        ("tariq.manager@marp.io", "CREATE_CAMPAIGN", "Campaign", main_campaign.id, "192.168.1.10", {"title": main_campaign.title, "budget": main_campaign.budget}),
        ("admin@marp.io", "APPROVE_DEVICE", "RegisteredDevice", "SM-S918B", "192.168.1.1", {"surveyor": "Aroon Field Specialist", "imei": "358920194820192"}),
        ("tariq.manager@marp.io", "PUBLISH_QUESTIONNAIRE", "Questionnaire", q_main.id, "192.168.1.10", {"version": 2, "changelog": "Added Urdu RTL translation and conditional photo rule"}),
        ("bilal.reviewer@marp.io", "APPROVE_EVIDENCE", "CampaignEvidence", "EV-001", "192.168.1.25", {"verdict": "Approved", "site": "Centaurus Flyover SMD"}),
        ("ayesha.reviewer@marp.io", "FLAG_DISCREPANCY", "CampaignEvidence", "EV-004", "192.168.1.28", {"verdict": "Rejected", "reason": "GPS tag outside geofence"}),
        ("sara.analyst@marp.io", "EXPORT_REPORT", "Analytics", "SOV-2026", "192.168.1.15", {"export_format": "PDF", "brand": "Jazz vs Zong"}),
    ]

    for u_email, action, r_type, r_id, ip, meta in audit_events:
        act_user = all_users.get(u_email, admin_user)
        db.add(AuditLog(
            company_id=company.id,
            actor_id=act_user.id,
            action=action,
            resource_type=r_type,
            resource_id=str(r_id),
            ip_address=ip,
            metadata=meta,
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
        ))
    db.commit()
    print("   [OK] Forensic security audit records populated.")

    db.close()
    print("\n[SUCCESS] MARP database enriched with realistic demonstration data across all three modules!")

if __name__ == "__main__":
    seed_rich_data()
