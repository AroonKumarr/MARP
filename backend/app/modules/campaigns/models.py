import uuid
from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy import (
    Column, Table, ForeignKey, String, Boolean, DateTime, Date, Integer, Float, Text, JSON, Numeric
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import TimestampedUUIDModel, Base, GUID

# Association table: Campaign <-> Location
campaign_locations = Table(
    "campaign_locations",
    Base.metadata,
    Column("campaign_id", GUID(), ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True),
    Column("location_id", GUID(), ForeignKey("locations.id", ondelete="CASCADE"), primary_key=True),
    Column("assigned_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
)

# Association table: Campaign <-> Questionnaire
campaign_questionnaires = Table(
    "campaign_questionnaires",
    Base.metadata,
    Column("campaign_id", GUID(), ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True),
    Column("questionnaire_id", GUID(), ForeignKey("questionnaires.id", ondelete="CASCADE"), primary_key=True),
    Column("linked_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
)

class Campaign(TimestampedUUIDModel):
    __tablename__ = "campaigns"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    manager_id: Mapped[str] = mapped_column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    research_category: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # Retail, Billboard, Competitor, Field
    status: Mapped[str] = mapped_column(String(30), default="Planning", index=True, nullable=False) 
    # Statuses: Planning, Active, In Progress, Completed, On Hold, Archived
    budget: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    manager: Mapped["User"] = relationship("User", foreign_keys=[manager_id])
    locations: Mapped[List["Location"]] = relationship("Location", secondary=campaign_locations)
    questionnaires: Mapped[List["Questionnaire"]] = relationship("Questionnaire", secondary=campaign_questionnaires)
    advertisements: Mapped[List["Advertisement"]] = relationship("Advertisement", back_populates="campaign", cascade="all, delete-orphan")
    assignments: Mapped[List["CampaignAssignment"]] = relationship("CampaignAssignment", back_populates="campaign", cascade="all, delete-orphan")
    evidence: Mapped[List["CampaignEvidence"]] = relationship("CampaignEvidence", back_populates="campaign", cascade="all, delete-orphan")

class Location(TimestampedUUIDModel):
    __tablename__ = "locations"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(GUID(), ForeignKey("locations.id", ondelete="CASCADE"), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    level: Mapped[str] = mapped_column(String(20), index=True, nullable=False) # country, province, city, area, site
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    parent: Mapped[Optional["Location"]] = relationship("Location", remote_side="Location.id", back_populates="children")
    children: Mapped[List["Location"]] = relationship("Location", back_populates="parent", cascade="all, delete-orphan")
    advertisements: Mapped[List["Advertisement"]] = relationship("Advertisement", back_populates="location")

class Advertisement(TimestampedUUIDModel):
    __tablename__ = "advertisements"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    campaign_id: Mapped[str] = mapped_column(GUID(), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    location_id: Mapped[str] = mapped_column(GUID(), ForeignKey("locations.id", ondelete="RESTRICT"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    ad_type: Mapped[str] = mapped_column(String(50), nullable=False) # Static Billboard, Digital LED, Unipole, Gantry, Transit Shelter, Wall Branding
    brand: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    dimensions: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "60x20", "40x15"
    orientation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # North-Facing, South-Facing, East, West
    illumination_type: Mapped[str] = mapped_column(String(50), default="Frontlit", nullable=False) # Frontlit, Backlit, Digital/LED, Unlit
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Active", nullable=False) # Active, Under Maintenance, Inactive

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="advertisements")
    location: Mapped["Location"] = relationship("Location", back_populates="advertisements")

class Competitor(TimestampedUUIDModel):
    __tablename__ = "competitors"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    parent_company: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    brand_tier: Mapped[str] = mapped_column(String(50), default="Tier 1", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    campaigns: Mapped[List["CompetitorCampaign"]] = relationship("CompetitorCampaign", back_populates="competitor", cascade="all, delete-orphan")

class CompetitorCampaign(TimestampedUUIDModel):
    __tablename__ = "competitor_campaigns"

    competitor_id: Mapped[str] = mapped_column(GUID(), ForeignKey("competitors.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Active", nullable=False)

    competitor: Mapped["Competitor"] = relationship("Competitor", back_populates="campaigns")
    advertisements: Mapped[List["CompetitorAdvertisement"]] = relationship("CompetitorAdvertisement", back_populates="competitor_campaign", cascade="all, delete-orphan")

class CompetitorAdvertisement(TimestampedUUIDModel):
    __tablename__ = "competitor_advertisements"

    competitor_campaign_id: Mapped[str] = mapped_column(GUID(), ForeignKey("competitor_campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    location_id: Mapped[str] = mapped_column(GUID(), ForeignKey("locations.id", ondelete="RESTRICT"), index=True, nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    ad_type: Mapped[str] = mapped_column(String(50), nullable=False)
    dimensions: Mapped[str] = mapped_column(String(50), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    competitor_campaign: Mapped["CompetitorCampaign"] = relationship("CompetitorCampaign", back_populates="advertisements")
    location: Mapped["Location"] = relationship("Location")

class CampaignAssignment(TimestampedUUIDModel):
    __tablename__ = "campaign_assignments"

    campaign_id: Mapped[str] = mapped_column(GUID(), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False) # Field Staff user
    location_id: Mapped[str] = mapped_column(GUID(), ForeignKey("locations.id", ondelete="CASCADE"), index=True, nullable=False)
    questionnaire_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questionnaires.id", ondelete="CASCADE"), index=True, nullable=False)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False) # High, Medium, Low
    status: Mapped[str] = mapped_column(String(30), default="Scheduled", index=True, nullable=False) 
    # Statuses: Scheduled, In Progress, Completed, Cancelled
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="assignments")
    user: Mapped["User"] = relationship("User")
    location: Mapped["Location"] = relationship("Location")
    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire")
    evidence: Mapped[List["CampaignEvidence"]] = relationship("CampaignEvidence", back_populates="assignment")

class CampaignEvidence(TimestampedUUIDModel):
    __tablename__ = "campaign_evidence"

    campaign_id: Mapped[str] = mapped_column(GUID(), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    assignment_id: Mapped[Optional[str]] = mapped_column(GUID(), ForeignKey("campaign_assignments.id", ondelete="SET NULL"), index=True, nullable=True)
    location_id: Mapped[str] = mapped_column(GUID(), ForeignKey("locations.id", ondelete="CASCADE"), index=True, nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(50), nullable=False) # Photograph, Audio Observation, GPS Timestamp, Condition Note
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(30), default="Pending", nullable=False) # Pending, Verified, Rejected, Flagged
    review_notes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="evidence")
    assignment: Mapped[Optional["CampaignAssignment"]] = relationship("CampaignAssignment", back_populates="evidence")
    location: Mapped["Location"] = relationship("Location")
