from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field

# Locations
class LocationBase(BaseModel):
    name: str
    code: str
    level: str = Field(pattern="^(country|province|city|area|site)$")
    parent_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    metadata_json: Dict[str, Any] = {}

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    level: Optional[str] = None
    parent_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class LocationResponse(LocationBase):
    id: str
    company_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class LocationTreeNode(LocationResponse):
    children: List["LocationTreeNode"] = []

# Advertisements
class AdvertisementBase(BaseModel):
    name: str
    campaign_id: str
    location_id: str
    ad_type: str = Field(pattern="^(Static Billboard|Digital LED|Unipole|Gantry|Transit Shelter|Wall Branding)$")
    brand: str
    dimensions: str # e.g. "60x20"
    orientation: Optional[str] = "North-Facing"
    illumination_type: str = Field(default="Frontlit", pattern="^(Frontlit|Backlit|Digital/LED|Unlit)$")
    image_url: Optional[str] = None
    status: str = Field(default="Active", pattern="^(Active|Under Maintenance|Inactive)$")

class AdvertisementCreate(AdvertisementBase):
    pass

class AdvertisementUpdate(BaseModel):
    name: Optional[str] = None
    location_id: Optional[str] = None
    ad_type: Optional[str] = None
    brand: Optional[str] = None
    dimensions: Optional[str] = None
    orientation: Optional[str] = None
    illumination_type: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

class AdvertisementResponse(AdvertisementBase):
    id: str
    company_id: str
    location_name: Optional[str] = None
    campaign_title: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Competitors
class CompetitorBase(BaseModel):
    name: str
    parent_company: Optional[str] = None
    brand_tier: str = "Tier 1"
    notes: Optional[str] = None

class CompetitorCreate(CompetitorBase):
    pass

class CompetitorUpdate(BaseModel):
    name: Optional[str] = None
    parent_company: Optional[str] = None
    brand_tier: Optional[str] = None
    notes: Optional[str] = None

class CompetitorAdvertisementBase(BaseModel):
    location_id: str
    brand: str
    ad_type: str
    dimensions: str
    image_url: Optional[str] = None
    notes: Optional[str] = None

class CompetitorAdvertisementCreate(CompetitorAdvertisementBase):
    pass

class CompetitorAdvertisementResponse(CompetitorAdvertisementBase):
    id: str
    competitor_campaign_id: str
    location_name: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

class CompetitorCampaignBase(BaseModel):
    title: str
    category: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "Active"

class CompetitorCampaignCreate(CompetitorCampaignBase):
    advertisements: List[CompetitorAdvertisementCreate] = []

class CompetitorCampaignResponse(CompetitorCampaignBase):
    id: str
    competitor_id: str
    advertisements: List[CompetitorAdvertisementResponse] = []

    class Config:
        from_attributes = True

class CompetitorResponse(CompetitorBase):
    id: str
    company_id: str
    created_at: datetime
    campaigns: List[CompetitorCampaignResponse] = []

    class Config:
        from_attributes = True

# Assignments & Scheduling
class CampaignAssignmentBase(BaseModel):
    campaign_id: str
    user_id: str # Field Staff User ID
    location_id: str
    questionnaire_id: str
    scheduled_date: date
    due_date: date
    priority: str = Field(default="Medium", pattern="^(High|Medium|Low)$")
    notes: Optional[str] = None

class CampaignAssignmentCreate(CampaignAssignmentBase):
    pass

class CampaignAssignmentUpdate(BaseModel):
    user_id: Optional[str] = None
    location_id: Optional[str] = None
    questionnaire_id: Optional[str] = None
    scheduled_date: Optional[date] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(Scheduled|In Progress|Completed|Cancelled)$")
    notes: Optional[str] = None

class CampaignAssignmentResponse(CampaignAssignmentBase):
    id: str
    status: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    location_name: Optional[str] = None
    campaign_title: Optional[str] = None
    questionnaire_title: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Evidence
class CampaignEvidenceBase(BaseModel):
    campaign_id: str
    assignment_id: Optional[str] = None
    location_id: str
    evidence_type: str = Field(pattern="^(Photograph|Audio Observation|GPS Timestamp|Condition Note)$")
    file_url: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    review_notes: Dict[str, Any] = {}

class CampaignEvidenceCreate(CampaignEvidenceBase):
    pass

class CampaignEvidenceReview(BaseModel):
    verification_status: str = Field(pattern="^(Pending|Verified|Rejected|Flagged)$")
    notes: Optional[str] = None

class CampaignEvidenceResponse(CampaignEvidenceBase):
    id: str
    recorded_at: datetime
    verification_status: str
    location_name: Optional[str] = None

    class Config:
        from_attributes = True

# Campaigns
class CampaignBase(BaseModel):
    title: str
    code: str
    description: Optional[str] = None
    research_category: str = Field(pattern="^(Retail|Billboard|Competitor|Field)$")
    budget: float = 0.0
    start_date: date
    end_date: date
    manager_id: Optional[str] = None

class CampaignCreate(CampaignBase):
    location_ids: List[str] = []
    questionnaire_ids: List[str] = []

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    research_category: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    manager_id: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(Planning|Active|In Progress|Completed|On Hold|Archived)$")
    location_ids: Optional[List[str]] = None
    questionnaire_ids: Optional[List[str]] = None

class CampaignStatusUpdate(BaseModel):
    status: str = Field(pattern="^(Planning|Active|In Progress|Completed|On Hold|Archived)$")

class CampaignResponse(CampaignBase):
    id: str
    company_id: str
    manager_id: str
    manager_name: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    advertisement_count: int = 0
    assignment_count: int = 0
    location_count: int = 0

    class Config:
        from_attributes = True

class CampaignDetailResponse(CampaignResponse):
    locations: List[LocationResponse] = []
    advertisements: List[AdvertisementResponse] = []
    assignments: List[CampaignAssignmentResponse] = []
    evidence: List[CampaignEvidenceResponse] = []

    class Config:
        from_attributes = True

# Competitor Comparison
class CompetitorComparisonItem(BaseModel):
    brand: str
    is_client: bool
    total_billboards: int
    ad_types: Dict[str, int]
    locations_covered: List[str]

class CompetitorComparisonResponse(BaseModel):
    client_brand: str
    comparison: List[CompetitorComparisonItem]
