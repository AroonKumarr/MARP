from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.common.schemas import PaginatedResponse, MessageResponse
from app.modules.users.models import User
from app.modules.campaigns.models import (
    Campaign, Location, Advertisement, Competitor, CompetitorCampaign,
    CompetitorAdvertisement, CampaignAssignment, CampaignEvidence
)
from app.modules.campaigns.schemas import (
    CampaignCreate, CampaignUpdate, CampaignStatusUpdate, CampaignResponse,
    CampaignDetailResponse, LocationCreate, LocationUpdate, LocationResponse,
    LocationTreeNode, AdvertisementCreate, AdvertisementUpdate, AdvertisementResponse,
    CompetitorCreate, CompetitorUpdate, CompetitorResponse,
    CampaignAssignmentCreate, CampaignAssignmentUpdate, CampaignAssignmentResponse,
    CampaignEvidenceCreate, CampaignEvidenceReview, CampaignEvidenceResponse,
    CompetitorComparisonResponse
)
from app.modules.campaigns.service import (
    CampaignService, LocationService, AssignmentService, CompetitorService
)
from app.modules.users.service import create_audit_log

campaigns_router = APIRouter(prefix="/campaigns", tags=["Campaign Management"])
locations_router = APIRouter(prefix="/locations", tags=["Hierarchical Locations"])
advertisements_router = APIRouter(prefix="/advertisements", tags=["Billboard & Advertisements"])
competitors_router = APIRouter(prefix="/competitors", tags=["Competitor Intelligence"])
assignments_router = APIRouter(prefix="/assignments", tags=["Field Staff Scheduling"])
evidence_router = APIRouter(prefix="/campaign-evidence", tags=["Field Evidence"])

# --- Campaigns Routes ---

@campaigns_router.get("", response_model=PaginatedResponse[CampaignResponse])
def list_campaigns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * page_size
    items, total = CampaignService.list_campaigns(
        db=db,
        company_id=current_user.company_id,
        skip=skip,
        limit=page_size,
        search=search,
        category=category,
        status_filter=status
    )
    
    result = []
    for c in items:
        resp = CampaignResponse.model_validate(c)
        if c.manager:
            resp.manager_name = c.manager.full_name
        resp.advertisement_count = len(c.advertisements)
        resp.assignment_count = len(c.assignments)
        resp.location_count = len(c.locations)
        result.append(resp)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(
        items=result,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@campaigns_router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    camp_in: CampaignCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    campaign = CampaignService.create_campaign(
        db=db,
        company_id=current_user.company_id,
        creator_id=current_user.id,
        camp_in=camp_in
    )
    resp = CampaignResponse.model_validate(campaign)
    if campaign.manager:
        resp.manager_name = campaign.manager.full_name
    return resp

@campaigns_router.get("/{campaign_id}", response_model=CampaignDetailResponse)
def get_campaign_detail(
    campaign_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    c = CampaignService.get_by_id(db, campaign_id, current_user.company_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    resp = CampaignDetailResponse.model_validate(c)
    if c.manager:
        resp.manager_name = c.manager.full_name
    resp.advertisement_count = len(c.advertisements)
    resp.assignment_count = len(c.assignments)
    resp.location_count = len(c.locations)

    # Attach related data
    resp.locations = [LocationResponse.model_validate(loc) for loc in c.locations]
    
    ads = []
    for a in c.advertisements:
        ad_r = AdvertisementResponse.model_validate(a)
        if a.location:
            ad_r.location_name = a.location.name
        ad_r.campaign_title = c.title
        ads.append(ad_r)
    resp.advertisements = ads

    assignments = []
    for asgn in c.assignments:
        asgn_r = CampaignAssignmentResponse.model_validate(asgn)
        if asgn.user:
            asgn_r.user_name = asgn.user.full_name
            asgn_r.user_email = asgn.user.email
        if asgn.location:
            asgn_r.location_name = asgn.location.name
        if asgn.questionnaire:
            asgn_r.questionnaire_title = asgn.questionnaire.title
        asgn_r.campaign_title = c.title
        assignments.append(asgn_r)
    resp.assignments = assignments

    evidences = []
    for ev in c.evidence:
        ev_r = CampaignEvidenceResponse.model_validate(ev)
        if ev.location:
            ev_r.location_name = ev.location.name
        evidences.append(ev_r)
    resp.evidence = evidences

    return resp

@campaigns_router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    camp_in: CampaignUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    c = CampaignService.get_by_id(db, campaign_id, current_user.company_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    updated = CampaignService.update_campaign(db, c, camp_in, actor_id=current_user.id)
    resp = CampaignResponse.model_validate(updated)
    if updated.manager:
        resp.manager_name = updated.manager.full_name
    return resp

@campaigns_router.put("/{campaign_id}/status", response_model=CampaignResponse)
def update_campaign_status(
    campaign_id: str,
    status_in: CampaignStatusUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    c = CampaignService.get_by_id(db, campaign_id, current_user.company_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    updated = CampaignService.update_status(db, c, status_in.status, actor_id=current_user.id)
    resp = CampaignResponse.model_validate(updated)
    if updated.manager:
        resp.manager_name = updated.manager.full_name
    return resp

# --- Locations Routes ---

@locations_router.get("", response_model=List[LocationResponse])
def list_locations(
    level: Optional[str] = None,
    parent_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    locs = LocationService.list_locations(db, current_user.company_id, level=level, parent_id=parent_id)
    return [LocationResponse.model_validate(l) for l in locs]

@locations_router.get("/tree", response_model=List[LocationTreeNode])
def get_location_tree(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return LocationService.get_tree(db, current_user.company_id)

@locations_router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    loc_in: LocationCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    loc = LocationService.create_location(db, current_user.company_id, loc_in, actor_id=current_user.id)
    return LocationResponse.model_validate(loc)

@locations_router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: str,
    loc_in: LocationUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    loc = db.query(Location).filter(
        Location.id == location_id,
        Location.company_id == current_user.company_id
    ).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    
    if loc_in.name is not None:
        loc.name = loc_in.name.strip()
    if loc_in.code is not None:
        loc.code = loc_in.code.strip().upper()
    if loc_in.level is not None:
        loc.level = loc_in.level
    if loc_in.parent_id is not None:
        loc.parent_id = loc_in.parent_id
    if loc_in.latitude is not None:
        loc.latitude = loc_in.latitude
    if loc_in.longitude is not None:
        loc.longitude = loc_in.longitude
    if loc_in.address is not None:
        loc.address = loc_in.address
    if loc_in.metadata_json is not None:
        loc.metadata_json = loc_in.metadata_json

    db.commit()
    db.refresh(loc)
    return LocationResponse.model_validate(loc)

# --- Advertisements Routes ---

@advertisements_router.get("", response_model=List[AdvertisementResponse])
def list_advertisements(
    campaign_id: Optional[str] = None,
    location_id: Optional[str] = None,
    brand: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Advertisement).filter(Advertisement.company_id == current_user.company_id)
    if campaign_id:
        query = query.filter(Advertisement.campaign_id == campaign_id)
    if location_id:
        query = query.filter(Advertisement.location_id == location_id)
    if brand:
        query = query.filter(Advertisement.brand.ilike(f"%{brand}%"))
    
    ads = query.order_by(desc(Advertisement.created_at)).all()
    result = []
    for a in ads:
        resp = AdvertisementResponse.model_validate(a)
        if a.location:
            resp.location_name = a.location.name
        if a.campaign:
            resp.campaign_title = a.campaign.title
        result.append(resp)
    return result

@advertisements_router.post("", response_model=AdvertisementResponse, status_code=status.HTTP_201_CREATED)
def create_advertisement(
    ad_in: AdvertisementCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(
        Campaign.id == ad_in.campaign_id,
        Campaign.company_id == current_user.company_id
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    loc = db.query(Location).filter(
        Location.id == ad_in.location_id,
        Location.company_id == current_user.company_id
    ).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")

    ad = Advertisement(
        company_id=current_user.company_id,
        campaign_id=camp.id,
        location_id=loc.id,
        name=ad_in.name.strip(),
        ad_type=ad_in.ad_type,
        brand=ad_in.brand.strip(),
        dimensions=ad_in.dimensions,
        orientation=ad_in.orientation,
        illumination_type=ad_in.illumination_type,
        image_url=ad_in.image_url,
        status=ad_in.status
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="advertisement.create",
        resource_type="Advertisement",
        resource_id=ad.id,
        metadata_json={"brand": ad.brand, "location": loc.name, "dimensions": ad.dimensions}
    )

    resp = AdvertisementResponse.model_validate(ad)
    resp.location_name = loc.name
    resp.campaign_title = camp.title
    return resp

# --- Competitor Routes ---

@competitors_router.get("", response_model=List[CompetitorResponse])
def list_competitors(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    comps = db.query(Competitor).filter(Competitor.company_id == current_user.company_id).all()
    result = []
    for comp in comps:
        comp_r = CompetitorResponse.model_validate(comp)
        campaigns_r = []
        for camp in comp.campaigns:
            camp_r = CompetitorCampaignResponse.model_validate(camp)
            ads_r = []
            for ad in camp.advertisements:
                ad_r = CompetitorAdvertisementResponse.model_validate(ad)
                if ad.location:
                    ad_r.location_name = ad.location.name
                ads_r.append(ad_r)
            camp_r.advertisements = ads_r
            campaigns_r.append(camp_r)
        comp_r.campaigns = campaigns_r
        result.append(comp_r)
    return result

@competitors_router.post("", response_model=CompetitorResponse, status_code=status.HTTP_201_CREATED)
def create_competitor(
    comp_in: CompetitorCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager", "Analyst"])),
    db: Session = Depends(get_db)
):
    comp = Competitor(
        company_id=current_user.company_id,
        name=comp_in.name.strip(),
        parent_company=comp_in.parent_company,
        brand_tier=comp_in.brand_tier,
        notes=comp_in.notes
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="competitor.create",
        resource_type="Competitor",
        resource_id=comp.id,
        metadata_json={"name": comp.name}
    )
    return CompetitorResponse.model_validate(comp)

@competitors_router.get("/compare", response_model=CompetitorComparisonResponse)
def compare_competitors(
    client_brand: str = Query("Jazz"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return CompetitorService.get_comparison(db, current_user.company_id, client_brand=client_brand)

# --- Field Staff Assignments & Scheduling ---

@assignments_router.get("", response_model=List[CampaignAssignmentResponse])
def list_assignments(
    campaign_id: Optional[str] = None,
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Field staff can see their own assignments; admins and managers can see all
    query = db.query(CampaignAssignment).join(Campaign).filter(Campaign.company_id == current_user.company_id)
    
    user_role_names = [r.name for r in current_user.roles]
    if "Company Administrator" not in user_role_names and "Research Manager" not in user_role_names and "Analyst" not in user_role_names:
        # Restricted to current user
        query = query.filter(CampaignAssignment.user_id == current_user.id)
    elif user_id:
        query = query.filter(CampaignAssignment.user_id == user_id)

    if campaign_id:
        query = query.filter(CampaignAssignment.campaign_id == campaign_id)
    if status:
        query = query.filter(CampaignAssignment.status == status)

    assignments = query.order_by(CampaignAssignment.scheduled_date.asc()).all()
    result = []
    for asgn in assignments:
        r = CampaignAssignmentResponse.model_validate(asgn)
        if asgn.user:
            r.user_name = asgn.user.full_name
            r.user_email = asgn.user.email
        if asgn.location:
            r.location_name = asgn.location.name
        if asgn.campaign:
            r.campaign_title = asgn.campaign.title
        if asgn.questionnaire:
            r.questionnaire_title = asgn.questionnaire.title
        result.append(r)
    return result

@assignments_router.post("", response_model=CampaignAssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assign_in: CampaignAssignmentCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    asgn = AssignmentService.create_assignment(
        db=db,
        company_id=current_user.company_id,
        assign_in=assign_in,
        actor_id=current_user.id
    )
    r = CampaignAssignmentResponse.model_validate(asgn)
    if asgn.user:
        r.user_name = asgn.user.full_name
        r.user_email = asgn.user.email
    if asgn.location:
        r.location_name = asgn.location.name
    if asgn.campaign:
        r.campaign_title = asgn.campaign.title
    if asgn.questionnaire:
        r.questionnaire_title = asgn.questionnaire.title
    return r

@assignments_router.put("/{assignment_id}", response_model=CampaignAssignmentResponse)
def update_assignment(
    assignment_id: str,
    assign_in: CampaignAssignmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    asgn = db.query(CampaignAssignment).join(Campaign).filter(
        CampaignAssignment.id == assignment_id,
        Campaign.company_id == current_user.company_id
    ).first()
    if not asgn:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assign_in.status is not None:
        asgn.status = assign_in.status
    if assign_in.notes is not None:
        asgn.notes = assign_in.notes
    if assign_in.scheduled_date is not None:
        asgn.scheduled_date = assign_in.scheduled_date
    if assign_in.due_date is not None:
        asgn.due_date = assign_in.due_date
    if assign_in.priority is not None:
        asgn.priority = assign_in.priority

    db.commit()
    db.refresh(asgn)

    r = CampaignAssignmentResponse.model_validate(asgn)
    if asgn.user:
        r.user_name = asgn.user.full_name
    if asgn.location:
        r.location_name = asgn.location.name
    if asgn.campaign:
        r.campaign_title = asgn.campaign.title
    return r

# --- Evidence Routes ---

@evidence_router.get("", response_model=List[CampaignEvidenceResponse])
def list_evidence(
    campaign_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(CampaignEvidence).join(Campaign).filter(Campaign.company_id == current_user.company_id)
    if campaign_id:
        query = query.filter(CampaignEvidence.campaign_id == campaign_id)
    
    evs = query.order_by(desc(CampaignEvidence.recorded_at)).all()
    result = []
    for ev in evs:
        r = CampaignEvidenceResponse.model_validate(ev)
        if ev.location:
            r.location_name = ev.location.name
        result.append(r)
    return result

@evidence_router.post("", response_model=CampaignEvidenceResponse, status_code=status.HTTP_201_CREATED)
def submit_evidence(
    ev_in: CampaignEvidenceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(
        Campaign.id == ev_in.campaign_id,
        Campaign.company_id == current_user.company_id
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    ev = CampaignEvidence(
        campaign_id=camp.id,
        assignment_id=ev_in.assignment_id,
        location_id=ev_in.location_id,
        evidence_type=ev_in.evidence_type,
        file_url=ev_in.file_url,
        latitude=ev_in.latitude,
        longitude=ev_in.longitude,
        verification_status="Pending",
        review_notes=ev_in.review_notes
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="evidence.submit",
        resource_type="CampaignEvidence",
        resource_id=ev.id,
        metadata_json={"type": ev.evidence_type, "campaign": camp.title}
    )
    return CampaignEvidenceResponse.model_validate(ev)

@evidence_router.put("/{evidence_id}/review", response_model=CampaignEvidenceResponse)
def review_evidence(
    evidence_id: str,
    review_in: CampaignEvidenceReview,
    current_user: User = Depends(require_role(["Company Administrator", "Evidence Reviewer", "Research Manager"])),
    db: Session = Depends(get_db)
):
    ev = db.query(CampaignEvidence).join(Campaign).filter(
        CampaignEvidence.id == evidence_id,
        Campaign.company_id == current_user.company_id
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence record not found")

    ev.verification_status = review_in.verification_status
    if review_in.notes:
        notes = ev.review_notes or {}
        notes["reviewer_feedback"] = review_in.notes
        notes["reviewed_by"] = current_user.full_name
        ev.review_notes = notes

    db.commit()
    db.refresh(ev)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="evidence.review",
        resource_type="CampaignEvidence",
        resource_id=ev.id,
        metadata_json={"status": ev.verification_status}
    )
    return CampaignEvidenceResponse.model_validate(ev)
