from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Options
class QuestionOptionBase(BaseModel):
    label: str
    value: str
    order_index: int = 0

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOptionResponse(QuestionOptionBase):
    id: str
    question_id: str

    class Config:
        from_attributes = True

# Translations
class QuestionTranslationBase(BaseModel):
    language_code: str = Field(pattern="^(ur|en)$")
    translated_text: str
    translated_help_text: Optional[str] = None
    translated_options: List[Dict[str, str]] = [] # [{"label": "خراب", "value": "Poor"}]

class QuestionTranslationCreate(QuestionTranslationBase):
    pass

class QuestionTranslationResponse(QuestionTranslationBase):
    id: str
    question_id: str

    class Config:
        from_attributes = True

# Questions
class QuestionBase(BaseModel):
    question_text: str
    question_type: str = Field(
        pattern="^(short_answer|long_answer|single_choice|multiple_choice|dropdown|checkboxes|rating_scale|date_time|image_upload|gps_location)$"
    )
    help_text: Optional[str] = None
    is_required: bool = False
    order_index: int = 0
    validation_rules: Dict[str, Any] = {}

class QuestionCreate(QuestionBase):
    options: List[QuestionOptionCreate] = []
    translations: List[QuestionTranslationCreate] = []

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    help_text: Optional[str] = None
    is_required: Optional[bool] = None
    order_index: Optional[int] = None
    validation_rules: Optional[Dict[str, Any]] = None
    options: Optional[List[QuestionOptionCreate]] = None
    translations: Optional[List[QuestionTranslationCreate]] = None

class QuestionResponse(QuestionBase):
    id: str
    questionnaire_id: str
    created_at: datetime
    options: List[QuestionOptionResponse] = []
    translations: List[QuestionTranslationResponse] = []

    class Config:
        from_attributes = True

class QuestionsReorderRequest(BaseModel):
    question_ids: List[str]

# Branching Rules
class BranchingRuleBase(BaseModel):
    source_question_id: str
    target_question_id: str
    condition_operator: str = Field(pattern="^(equals|not_equals|contains|greater_than|less_than)$")
    condition_value: str
    action: str = Field(default="show", pattern="^(show|hide|skip_to)$")

class BranchingRuleCreate(BranchingRuleBase):
    pass

class BranchingRuleResponse(BranchingRuleBase):
    id: str
    questionnaire_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Eligibility & OTP
class QuestionnaireEligibilityBase(BaseModel):
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    allowed_genders: Optional[str] = "All"
    target_cities: List[str] = []
    respondent_quota: Optional[int] = None

class QuestionnaireEligibilityUpdate(QuestionnaireEligibilityBase):
    pass

class QuestionnaireEligibilityResponse(QuestionnaireEligibilityBase):
    id: str
    questionnaire_id: str

    class Config:
        from_attributes = True

class OTPConfigurationBase(BaseModel):
    is_otp_required: bool = False
    provider_name: str = "twilio"
    otp_expiry_seconds: int = 300
    max_retry_attempts: int = 3

class OTPConfigurationUpdate(OTPConfigurationBase):
    pass

class OTPConfigurationResponse(OTPConfigurationBase):
    id: str
    questionnaire_id: str

    class Config:
        from_attributes = True

# Versions
class QuestionnaireVersionResponse(BaseModel):
    id: str
    questionnaire_id: str
    version_number: int
    status: str
    schema_snapshot: Dict[str, Any]
    changelog: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Questionnaires
class QuestionnaireBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = Field(pattern="^(Retail|Billboard|Competitor|Field)$")

class QuestionnaireCreate(QuestionnaireBase):
    pass

class QuestionnaireUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(Draft|Published|Archived)$")

class QuestionnaireResponse(QuestionnaireBase):
    id: str
    company_id: str
    created_by: str
    status: str
    current_version: int
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    class Config:
        from_attributes = True

class QuestionnaireDetailResponse(QuestionnaireResponse):
    questions: List[QuestionResponse] = []
    branching_rules: List[BranchingRuleResponse] = []
    eligibility: Optional[QuestionnaireEligibilityResponse] = None
    otp_config: Optional[OTPConfigurationResponse] = None
    versions: List[QuestionnaireVersionResponse] = []

    class Config:
        from_attributes = True

# Preview Dynamic Evaluation
class DynamicEvaluationRequest(BaseModel):
    answers: Dict[str, Any] = {} # {question_id: answer_value}

class DynamicEvaluationResponse(BaseModel):
    visible_question_ids: List[str]
    hidden_question_ids: List[str]
    evaluated_rules_count: int
