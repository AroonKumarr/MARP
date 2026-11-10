from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.core.dependencies import get_current_active_user, require_role
from app.common.schemas import PaginatedResponse, MessageResponse
from app.modules.users.models import User
from app.modules.questionnaires.models import (
    Questionnaire, QuestionnaireVersion, Question, QuestionOption,
    QuestionTranslation, BranchingRule, QuestionnaireEligibility, OTPConfiguration
)
from app.modules.questionnaires.schemas import (
    QuestionnaireCreate, QuestionnaireUpdate, QuestionnaireResponse,
    QuestionnaireDetailResponse, QuestionCreate, QuestionUpdate, QuestionResponse,
    QuestionsReorderRequest, BranchingRuleCreate, BranchingRuleResponse,
    QuestionnaireEligibilityUpdate, QuestionnaireEligibilityResponse,
    OTPConfigurationUpdate, OTPConfigurationResponse, QuestionnaireVersionResponse,
    DynamicEvaluationRequest, DynamicEvaluationResponse
)
from app.modules.questionnaires.service import QuestionnaireService
from app.modules.users.service import create_audit_log

questionnaires_router = APIRouter(prefix="/questionnaires", tags=["Questionnaire Management"])
questions_router = APIRouter(prefix="/questions", tags=["Question Builder"])
rules_router = APIRouter(prefix="/rules", tags=["Branching Rules"])

@questionnaires_router.get("", response_model=PaginatedResponse[QuestionnaireResponse])
def list_questionnaires(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * page_size
    items, total = QuestionnaireService.list_questionnaires(
        db=db,
        company_id=current_user.company_id,
        skip=skip,
        limit=page_size,
        search=search,
        category=category,
        status_filter=status
    )
    
    result = []
    for q in items:
        resp = QuestionnaireResponse.model_validate(q)
        resp.question_count = len(q.questions)
        result.append(resp)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(
        items=result,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@questionnaires_router.post("", response_model=QuestionnaireResponse, status_code=status.HTTP_201_CREATED)
def create_questionnaire(
    q_in: QuestionnaireCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager", "Analyst"])),
    db: Session = Depends(get_db)
):
    questionnaire = QuestionnaireService.create_questionnaire(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        q_in=q_in
    )
    resp = QuestionnaireResponse.model_validate(questionnaire)
    resp.question_count = 0
    return resp

@questionnaires_router.get("/{questionnaire_id}", response_model=QuestionnaireDetailResponse)
def get_questionnaire(
    questionnaire_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    q = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    
    resp = QuestionnaireDetailResponse.model_validate(q)
    resp.question_count = len(q.questions)
    return resp

@questionnaires_router.put("/{questionnaire_id}", response_model=QuestionnaireResponse)
def update_questionnaire(
    questionnaire_id: str,
    q_in: QuestionnaireUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    q = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    
    # If currently published and modifying metadata, auto-branch or warn
    if q.status == "Published":
        QuestionnaireService.branch_new_version(db, q, current_user.id)

    updated = QuestionnaireService.update_questionnaire(db, q, q_in, current_user.id)
    resp = QuestionnaireResponse.model_validate(updated)
    resp.question_count = len(updated.questions)
    return resp

@questionnaires_router.delete("/{questionnaire_id}", response_model=MessageResponse)
def delete_questionnaire(
    questionnaire_id: str,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    q = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    
    title = q.title
    db.delete(q)
    db.commit()

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="questionnaire.delete",
        resource_type="Questionnaire",
        resource_id=questionnaire_id,
        metadata_json={"title": title}
    )
    return MessageResponse(message=f"Questionnaire '{title}' deleted successfully")

@questionnaires_router.post("/{questionnaire_id}/duplicate", response_model=QuestionnaireResponse)
def duplicate_questionnaire(
    questionnaire_id: str,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    cloned = QuestionnaireService.duplicate_questionnaire(
        db=db,
        questionnaire_id=questionnaire_id,
        company_id=current_user.company_id,
        user_id=current_user.id
    )
    resp = QuestionnaireResponse.model_validate(cloned)
    resp.question_count = len(cloned.questions)
    return resp

@questionnaires_router.post("/{questionnaire_id}/publish", response_model=QuestionnaireVersionResponse)
def publish_questionnaire(
    questionnaire_id: str,
    changelog: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    q = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    
    version = QuestionnaireService.publish_questionnaire(
        db=db,
        questionnaire=q,
        user_id=current_user.id,
        changelog=changelog or f"Version {q.current_version} published"
    )
    return version

@questionnaires_router.post("/{questionnaire_id}/branch", response_model=QuestionnaireResponse)
def branch_new_version(
    questionnaire_id: str,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    q = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    
    branched = QuestionnaireService.branch_new_version(db, q, current_user.id)
    resp = QuestionnaireResponse.model_validate(branched)
    resp.question_count = len(branched.questions)
    return resp

@questionnaires_router.get("/{questionnaire_id}/versions", response_model=List[QuestionnaireVersionResponse])
def get_questionnaire_versions(
    questionnaire_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    q = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not q:
        raise HTTPException(status_code=404, detail="Questionnaire not found")
    return q.versions

# --- Question CRUD & Builder ---

@questionnaires_router.post("/{questionnaire_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question(
    questionnaire_id: str,
    q_in: QuestionCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    questionnaire = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    if questionnaire.status == "Published":
        QuestionnaireService.branch_new_version(db, questionnaire, current_user.id)

    order_idx = len(questionnaire.questions) if q_in.order_index == 0 else q_in.order_index

    question = Question(
        questionnaire_id=questionnaire.id,
        question_text=q_in.question_text.strip(),
        question_type=q_in.question_type,
        help_text=q_in.help_text,
        is_required=q_in.is_required,
        order_index=order_idx,
        validation_rules=q_in.validation_rules
    )
    db.add(question)
    db.flush()

    for idx, opt in enumerate(q_in.options):
        db_opt = QuestionOption(
            question_id=question.id,
            label=opt.label,
            value=opt.value,
            order_index=idx
        )
        db.add(db_opt)

    for tr in q_in.translations:
        db_tr = QuestionTranslation(
            question_id=question.id,
            language_code=tr.language_code,
            translated_text=tr.translated_text,
            translated_help_text=tr.translated_help_text,
            translated_options=tr.translated_options
        )
        db.add(db_tr)

    db.commit()
    db.refresh(question)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="question.create",
        resource_type="Question",
        resource_id=question.id,
        metadata_json={"questionnaire_id": questionnaire.id, "text": question.question_text[:50]}
    )
    return question

@questions_router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: str,
    q_in: QuestionUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    questionnaire = QuestionnaireService.get_by_id(db, question.questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if questionnaire.status == "Published":
        QuestionnaireService.branch_new_version(db, questionnaire, current_user.id)

    if q_in.question_text is not None:
        question.question_text = q_in.question_text.strip()
    if q_in.question_type is not None:
        question.question_type = q_in.question_type
    if q_in.help_text is not None:
        question.help_text = q_in.help_text
    if q_in.is_required is not None:
        question.is_required = q_in.is_required
    if q_in.order_index is not None:
        question.order_index = q_in.order_index
    if q_in.validation_rules is not None:
        question.validation_rules = q_in.validation_rules

    if q_in.options is not None:
        # Replace options
        db.query(QuestionOption).filter(QuestionOption.question_id == question.id).delete()
        for idx, opt in enumerate(q_in.options):
            db.add(QuestionOption(
                question_id=question.id,
                label=opt.label,
                value=opt.value,
                order_index=idx
            ))

    if q_in.translations is not None:
        db.query(QuestionTranslation).filter(QuestionTranslation.question_id == question.id).delete()
        for tr in q_in.translations:
            db.add(QuestionTranslation(
                question_id=question.id,
                language_code=tr.language_code,
                translated_text=tr.translated_text,
                translated_help_text=tr.translated_help_text,
                translated_options=tr.translated_options
            ))

    db.commit()
    db.refresh(question)
    return question

@questions_router.delete("/{question_id}", response_model=MessageResponse)
def delete_question(
    question_id: str,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    questionnaire = QuestionnaireService.get_by_id(db, question.questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if questionnaire.status == "Published":
        QuestionnaireService.branch_new_version(db, questionnaire, current_user.id)

    db.delete(question)
    db.commit()
    return MessageResponse(message="Question deleted successfully")

@questionnaires_router.post("/{questionnaire_id}/questions/reorder", response_model=MessageResponse)
def reorder_questions(
    questionnaire_id: str,
    reorder_in: QuestionsReorderRequest,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    questionnaire = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    for idx, q_id in enumerate(reorder_in.question_ids):
        q = db.query(Question).filter(
            Question.id == q_id,
            Question.questionnaire_id == questionnaire_id
        ).first()
        if q:
            q.order_index = idx

    db.commit()
    return MessageResponse(message="Questions reordered successfully")

# --- Branching Rules Routes ---

@questionnaires_router.post("/{questionnaire_id}/rules", response_model=BranchingRuleResponse, status_code=status.HTTP_201_CREATED)
def add_branching_rule(
    questionnaire_id: str,
    rule_in: BranchingRuleCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    questionnaire = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    # Validate source and target questions belong to questionnaire
    source_q = db.query(Question).filter(Question.id == rule_in.source_question_id, Question.questionnaire_id == questionnaire_id).first()
    target_q = db.query(Question).filter(Question.id == rule_in.target_question_id, Question.questionnaire_id == questionnaire_id).first()
    if not source_q or not target_q:
        raise HTTPException(status_code=400, detail="Invalid source or target question ID for this questionnaire")

    rule = BranchingRule(
        questionnaire_id=questionnaire_id,
        source_question_id=rule_in.source_question_id,
        target_question_id=rule_in.target_question_id,
        condition_operator=rule_in.condition_operator,
        condition_value=rule_in.condition_value,
        action=rule_in.action
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="branching_rule.create",
        resource_type="BranchingRule",
        resource_id=rule.id,
        metadata_json={"source": source_q.question_text[:30], "target": target_q.question_text[:30]}
    )
    return rule

@rules_router.delete("/{rule_id}", response_model=MessageResponse)
def delete_branching_rule(
    rule_id: str,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    rule = db.query(BranchingRule).filter(BranchingRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    questionnaire = QuestionnaireService.get_by_id(db, rule.questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(rule)
    db.commit()
    return MessageResponse(message="Branching rule deleted successfully")

# --- Settings & Preview Routes ---

@questionnaires_router.put("/{questionnaire_id}/eligibility", response_model=QuestionnaireEligibilityResponse)
def update_eligibility(
    questionnaire_id: str,
    elig_in: QuestionnaireEligibilityUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    questionnaire = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    elig = questionnaire.eligibility
    if not elig:
        elig = QuestionnaireEligibility(questionnaire_id=questionnaire_id)
        db.add(elig)

    elig.min_age = elig_in.min_age
    elig.max_age = elig_in.max_age
    elig.allowed_genders = elig_in.allowed_genders
    elig.target_cities = elig_in.target_cities
    elig.respondent_quota = elig_in.respondent_quota

    db.commit()
    db.refresh(elig)
    return elig

@questionnaires_router.put("/{questionnaire_id}/otp-config", response_model=OTPConfigurationResponse)
def update_otp_config(
    questionnaire_id: str,
    otp_in: OTPConfigurationUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    questionnaire = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    cfg = questionnaire.otp_config
    if not cfg:
        cfg = OTPConfiguration(questionnaire_id=questionnaire_id)
        db.add(cfg)

    cfg.is_otp_required = otp_in.is_otp_required
    cfg.provider_name = otp_in.provider_name
    cfg.otp_expiry_seconds = otp_in.otp_expiry_seconds
    cfg.max_retry_attempts = otp_in.max_retry_attempts

    db.commit()
    db.refresh(cfg)
    return cfg

@questionnaires_router.post("/{questionnaire_id}/preview-evaluate", response_model=DynamicEvaluationResponse)
def preview_evaluate(
    questionnaire_id: str,
    eval_req: DynamicEvaluationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    questionnaire = QuestionnaireService.get_by_id(db, questionnaire_id, current_user.company_id)
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionnaire not found")

    visible_ids, hidden_ids, count = QuestionnaireService.evaluate_branching(questionnaire, eval_req.answers)
    return DynamicEvaluationResponse(
        visible_question_ids=visible_ids,
        hidden_question_ids=hidden_ids,
        evaluated_rules_count=count
    )
