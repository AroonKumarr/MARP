import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column, Table, ForeignKey, String, Boolean, DateTime, Integer, Text, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import TimestampedUUIDModel, Base, GUID

class Questionnaire(TimestampedUUIDModel):
    __tablename__ = "questionnaires"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    created_by: Mapped[str] = mapped_column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), index=True, nullable=False) # Retail, Billboard, Competitor, Field
    status: Mapped[str] = mapped_column(String(30), default="Draft", index=True, nullable=False) # Draft, Published, Archived
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="questionnaire", cascade="all, delete-orphan", order_by="Question.order_index")
    versions: Mapped[List["QuestionnaireVersion"]] = relationship("QuestionnaireVersion", back_populates="questionnaire", cascade="all, delete-orphan", order_by="QuestionnaireVersion.version_number.desc()")
    branching_rules: Mapped[List["BranchingRule"]] = relationship("BranchingRule", back_populates="questionnaire", cascade="all, delete-orphan")
    eligibility: Mapped[Optional["QuestionnaireEligibility"]] = relationship("QuestionnaireEligibility", back_populates="questionnaire", uselist=False, cascade="all, delete-orphan")
    otp_config: Mapped[Optional["OTPConfiguration"]] = relationship("OTPConfiguration", back_populates="questionnaire", uselist=False, cascade="all, delete-orphan")

class QuestionnaireVersion(TimestampedUUIDModel):
    __tablename__ = "questionnaire_versions"

    questionnaire_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questionnaires.id", ondelete="CASCADE"), index=True, nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False) # Draft, Published, Archived
    schema_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    changelog: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire", back_populates="versions")

class Question(TimestampedUUIDModel):
    __tablename__ = "questions"

    questionnaire_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questionnaires.id", ondelete="CASCADE"), index=True, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(40), nullable=False) 
    # Types: short_answer, long_answer, single_choice, multiple_choice, dropdown, checkboxes, rating_scale, date_time, image_upload, gps_location
    help_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    validation_rules: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire", back_populates="questions")
    options: Mapped[List["QuestionOption"]] = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", order_by="QuestionOption.order_index")
    translations: Mapped[List["QuestionTranslation"]] = relationship("QuestionTranslation", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(TimestampedUUIDModel):
    __tablename__ = "question_options"

    question_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questions.id", ondelete="CASCADE"), index=True, nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(150), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    question: Mapped["Question"] = relationship("Question", back_populates="options")

class QuestionTranslation(TimestampedUUIDModel):
    __tablename__ = "question_translations"

    question_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questions.id", ondelete="CASCADE"), index=True, nullable=False)
    language_code: Mapped[str] = mapped_column(String(10), nullable=False) # 'ur' or 'en'
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_help_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    translated_options: Mapped[list] = mapped_column(JSON, default=list, nullable=False) # [{"value": "poor", "label": "خراب"}]

    question: Mapped["Question"] = relationship("Question", back_populates="translations")

class BranchingRule(TimestampedUUIDModel):
    __tablename__ = "branching_rules"

    questionnaire_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questionnaires.id", ondelete="CASCADE"), index=True, nullable=False)
    source_question_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    target_question_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    condition_operator: Mapped[str] = mapped_column(String(30), nullable=False) # equals, not_equals, contains, greater_than, less_than
    condition_value: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(30), default="show", nullable=False) # show, hide, skip_to

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire", back_populates="branching_rules")

class QuestionnaireEligibility(TimestampedUUIDModel):
    __tablename__ = "questionnaire_eligibilities"

    questionnaire_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questionnaires.id", ondelete="CASCADE"), unique=True, nullable=False)
    min_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    allowed_genders: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # All, Male, Female
    target_cities: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    respondent_quota: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire", back_populates="eligibility")

class OTPConfiguration(TimestampedUUIDModel):
    __tablename__ = "otp_configurations"

    questionnaire_id: Mapped[str] = mapped_column(GUID(), ForeignKey("questionnaires.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_otp_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    provider_name: Mapped[str] = mapped_column(String(50), default="twilio", nullable=False)
    otp_expiry_seconds: Mapped[int] = mapped_column(Integer, default=300, nullable=False)
    max_retry_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire", back_populates="otp_config")
