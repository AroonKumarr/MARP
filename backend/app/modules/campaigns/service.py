from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from fastapi import HTTPException, status

from app.modules.users.models import User, Role
from app.modules.questionnaires.models import Questionnaire
from app.modules.campaigns.models import (
    Campaign, Location, Advertisement, Competitor, CompetitorCampaign,
    CompetitorAdvertisement, CampaignAssignment, CampaignEvidence
)
from app.modules.campaigns.schemas import (
    CampaignCreate, CampaignUpdate, LocationCreate, LocationUpdate,
    AdvertisementCreate, AdvertisementUpdate, CompetitorCreate, CompetitorUpdate,
    CompetitorCampaignCreate, CompetitorAdvertisementCreate,
    CampaignAssignmentCreate, CampaignAssignmentUpdate,
    CampaignEvidenceCreate, CampaignEvidenceReview, CompetitorComparisonResponse,
    CompetitorComparisonItem, LocationTreeNode
)
from app.modules.users.service import create_audit_log

class CampaignService:
    @staticmethod
    def list_campaigns(
        db: Session,
        company_id: str,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> Tuple[List[Campaign], int]:
        query = db.query(Campaign).filter(Campaign.company_id == company_id)

        if category:
            query = query.filter(Campaign.research_category == category)
        if status_filter:
            query = query.filter(Campaign.status == status_filter)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Campaign.title.ilike(search_term),
                    Campaign.code.ilike(search_term),
                    Campaign.description.ilike(search_term)
                )
            )

        total = query.count()
        items = query.order_by(desc(Campaign.created_at)).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, campaign_id: str, company_id: str) -> Optional[Campaign]:
        return db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.company_id == company_id
        ).first()

    @staticmethod
    def create_campaign(
        db: Session,
        company_id: str,
        creator_id: str,
        camp_in: CampaignCreate
    ) -> Campaign:
        # Check code uniqueness within company
        existing_code = db.query(Campaign).filter(
            Campaign.company_id == company_id,
            Campaign.code == camp_in.code.strip()
        ).first()
        if existing_code:
            raise HTTPException(status_code=400, detail="A campaign with this code already exists")

        mgr_id = camp_in.manager_id or creator_id
        campaign = Campaign(
            company_id=company_id,
            manager_id=mgr_id,
            title=camp_in.title.strip(),
            code=camp_in.code.strip().upper(),
            description=camp_in.description,
            research_category=camp_in.research_category,
            budget=camp_in.budget,
            start_date=camp_in.start_date,
            end_date=camp_in.end_date,
            status="Planning"
        )

        if camp_in.location_ids:
            locs = db.query(Location).filter(
                Location.id.in_(camp_in.location_ids),
                Location.company_id == company_id
            ).all()
            campaign.locations = locs

        if camp_in.questionnaire_ids:
            qs = db.query(Questionnaire).filter(
                Questionnaire.id.in_(camp_in.questionnaire_ids),
                Questionnaire.company_id == company_id
            ).all()
            campaign.questionnaires = qs

        db.add(campaign)
        db.commit()
        db.refresh(campaign)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=creator_id,
            action="campaign.create",
            resource_type="Campaign",
            resource_id=campaign.id,
            metadata_json={"title": campaign.title, "code": campaign.code}
        )
        return campaign

    @staticmethod
    def update_campaign(
        db: Session,
        campaign: Campaign,
        camp_in: CampaignUpdate,
        actor_id: str
    ) -> Campaign:
        if camp_in.title is not None:
            campaign.title = camp_in.title.strip()
        if camp_in.code is not None:
            campaign.code = camp_in.code.strip().upper()
        if camp_in.description is not None:
            campaign.description = camp_in.description
        if camp_in.research_category is not None:
            campaign.research_category = camp_in.research_category
        if camp_in.budget is not None:
            campaign.budget = camp_in.budget
        if camp_in.start_date is not None:
            campaign.start_date = camp_in.start_date
        if camp_in.end_date is not None:
            campaign.end_date = camp_in.end_date
        if camp_in.manager_id is not None:
            campaign.manager_id = camp_in.manager_id
        if camp_in.status is not None:
            campaign.status = camp_in.status

        if camp_in.location_ids is not None:
            locs = db.query(Location).filter(
                Location.id.in_(camp_in.location_ids),
                Location.company_id == campaign.company_id
            ).all()
            campaign.locations = locs

        if camp_in.questionnaire_ids is not None:
            qs = db.query(Questionnaire).filter(
                Questionnaire.id.in_(camp_in.questionnaire_ids),
                Questionnaire.company_id == campaign.company_id
            ).all()
            campaign.questionnaires = qs

        db.commit()
        db.refresh(campaign)

        create_audit_log(
            db=db,
            company_id=campaign.company_id,
            actor_id=actor_id,
            action="campaign.update",
            resource_type="Campaign",
            resource_id=campaign.id,
            metadata_json={"status": campaign.status}
        )
        return campaign

    @staticmethod
    def update_status(
        db: Session,
        campaign: Campaign,
        new_status: str,
        actor_id: str
    ) -> Campaign:
        old_status = campaign.status
        campaign.status = new_status
        db.commit()
        db.refresh(campaign)

        create_audit_log(
            db=db,
            company_id=campaign.company_id,
            actor_id=actor_id,
            action="campaign.status_change",
            resource_type="Campaign",
            resource_id=campaign.id,
            metadata_json={"from": old_status, "to": new_status}
        )
        return campaign

class LocationService:
    @staticmethod
    def list_locations(
        db: Session,
        company_id: str,
        level: Optional[str] = None,
        parent_id: Optional[str] = None
    ) -> List[Location]:
        query = db.query(Location).filter(Location.company_id == company_id)
        if level:
            query = query.filter(Location.level == level)
        if parent_id:
            query = query.filter(Location.parent_id == parent_id)
        return query.order_by(Location.name.asc()).all()

    @staticmethod
    def get_tree(db: Session, company_id: str) -> List[Dict[str, Any]]:
        all_locs = db.query(Location).filter(Location.company_id == company_id).all()
        by_parent: Dict[Optional[str], List[Location]] = {}
        for loc in all_locs:
            by_parent.setdefault(loc.parent_id, []).append(loc)

        def build_branch(parent_id: Optional[str]) -> List[Dict[str, Any]]:
            branch = []
            for item in by_parent.get(parent_id, []):
                node = {
                    "id": item.id,
                    "company_id": item.company_id,
                    "name": item.name,
                    "code": item.code,
                    "level": item.level,
                    "parent_id": item.parent_id,
                    "latitude": item.latitude,
                    "longitude": item.longitude,
                    "address": item.address,
                    "metadata_json": item.metadata_json,
                    "created_at": item.created_at,
                    "children": build_branch(item.id)
                }
                branch.append(node)
            return branch

        return build_branch(None)

    @staticmethod
    def create_location(
        db: Session,
        company_id: str,
        loc_in: LocationCreate,
        actor_id: str
    ) -> Location:
        if loc_in.parent_id:
            parent = db.query(Location).filter(
                Location.id == loc_in.parent_id,
                Location.company_id == company_id
            ).first()
            if not parent:
                raise HTTPException(status_code=400, detail="Parent location not found in workspace")

        loc = Location(
            company_id=company_id,
            parent_id=loc_in.parent_id,
            name=loc_in.name.strip(),
            code=loc_in.code.strip().upper(),
            level=loc_in.level,
            latitude=loc_in.latitude,
            longitude=loc_in.longitude,
            address=loc_in.address,
            metadata_json=loc_in.metadata_json
        )
        db.add(loc)
        db.commit()
        db.refresh(loc)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=actor_id,
            action="location.create",
            resource_type="Location",
            resource_id=loc.id,
            metadata_json={"name": loc.name, "level": loc.level}
        )
        return loc

class AssignmentService:
    @staticmethod
    def create_assignment(
        db: Session,
        company_id: str,
        assign_in: CampaignAssignmentCreate,
        actor_id: str
    ) -> CampaignAssignment:
        # Validate campaign
        campaign = db.query(Campaign).filter(
            Campaign.id == assign_in.campaign_id,
            Campaign.company_id == company_id
        ).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        # Validate Field Staff user
        user = db.query(User).filter(
            User.id == assign_in.user_id,
            User.company_id == company_id
        ).first()
        if not user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Cannot assign inactive field staff member")

        user_role_names = [r.name for r in user.roles]
        if "Field Staff" not in user_role_names and "Company Administrator" not in user_role_names:
            raise HTTPException(status_code=400, detail="User must possess the 'Field Staff' role to receive field assignments")

        # Validate location
        location = db.query(Location).filter(
            Location.id == assign_in.location_id,
            Location.company_id == company_id
        ).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

        # Validate questionnaire
        questionnaire = db.query(Questionnaire).filter(
            Questionnaire.id == assign_in.questionnaire_id,
            Questionnaire.company_id == company_id
        ).first()
        if not questionnaire:
            raise HTTPException(status_code=404, detail="Questionnaire not found")

        assignment = CampaignAssignment(
            campaign_id=campaign.id,
            user_id=user.id,
            location_id=location.id,
            questionnaire_id=questionnaire.id,
            scheduled_date=assign_in.scheduled_date,
            due_date=assign_in.due_date,
            priority=assign_in.priority,
            status="Scheduled",
            notes=assign_in.notes
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=actor_id,
            action="assignment.create",
            resource_type="CampaignAssignment",
            resource_id=assignment.id,
            metadata_json={"user": user.full_name, "campaign": campaign.title, "location": location.name}
        )
        return assignment

class CompetitorService:
    @staticmethod
    def get_comparison(db: Session, company_id: str, client_brand: str) -> CompetitorComparisonResponse:
        # Query client billboard count
        client_ads = db.query(Advertisement).filter(
            Advertisement.company_id == company_id,
            Advertisement.brand.ilike(f"%{client_brand}%")
        ).all()

        client_types: Dict[str, int] = {}
        client_locs = set()
        for ad in client_ads:
            client_types[ad.ad_type] = client_types.get(ad.ad_type, 0) + 1
            if ad.location:
                client_locs.add(ad.location.name)

        comparison_list = [
            CompetitorComparisonItem(
                brand=client_brand,
                is_client=True,
                total_billboards=len(client_ads),
                ad_types=client_types,
                locations_covered=sorted(list(client_locs))
            )
        ]

        # Query competitors
        competitors = db.query(Competitor).filter(Competitor.company_id == company_id).all()
        for comp in competitors:
            comp_types: Dict[str, int] = {}
            comp_locs = set()
            total_count = 0
            for camp in comp.campaigns:
                for ad in camp.advertisements:
                    total_count += 1
                    comp_types[ad.ad_type] = comp_types.get(ad.ad_type, 0) + 1
                    if ad.location:
                        comp_locs.add(ad.location.name)

            comparison_list.append(CompetitorComparisonItem(
                brand=comp.name,
                is_client=False,
                total_billboards=total_count,
                ad_types=comp_types,
                locations_covered=sorted(list(comp_locs))
            ))

        return CompetitorComparisonResponse(
            client_brand=client_brand,
            comparison=comparison_list
        )
