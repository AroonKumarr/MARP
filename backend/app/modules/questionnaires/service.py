import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from fastapi import HTTPException, status

from app.modules.questionnaires.models import (
    Questionnaire, QuestionnaireVersion, Question, QuestionOption,
    QuestionTranslation, BranchingRule, QuestionnaireEligibility, OTPConfiguration
)
from app.modules.questionnaires.schemas import (
    QuestionnaireCreate, QuestionnaireUpdate, QuestionCreate, QuestionUpdate,
    BranchingRuleCreate, QuestionnaireEligibilityUpdate, OTPConfigurationUpdate
)
from app.modules.users.service import create_audit_log

class QuestionnaireService:
    @staticmethod
    def list_questionnaires(
        db: Session,
        company_id: str,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> Tuple[List[Questionnaire], int]:
        query = db.query(Questionnaire).filter(Questionnaire.company_id == company_id)

        if category:
            query = query.filter(Questionnaire.category == category)
        if status_filter:
            query = query.filter(Questionnaire.status == status_filter)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Questionnaire.title.ilike(search_term),
                    Questionnaire.description.ilike(search_term)
                )
            )

        total = query.count()
        items = query.order_by(desc(Questionnaire.created_at)).offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, questionnaire_id: str, company_id: str) -> Optional[Questionnaire]:
        return db.query(Questionnaire).filter(
            Questionnaire.id == questionnaire_id,
            Questionnaire.company_id == company_id
        ).first()

    @staticmethod
    def create_questionnaire(
        db: Session,
        company_id: str,
        user_id: str,
        q_in: QuestionnaireCreate
    ) -> Questionnaire:
        questionnaire = Questionnaire(
            company_id=company_id,
            created_by=user_id,
            title=q_in.title.strip(),
            description=q_in.description,
            category=q_in.category,
            status="Draft",
            current_version=1
        )
        db.add(questionnaire)
        db.flush()

        # Create default eligibility and OTP configuration records
        eligibility = QuestionnaireEligibility(
            questionnaire_id=questionnaire.id,
            allowed_genders="All",
            target_cities=["Islamabad", "Rawalpindi", "Lahore", "Karachi"]
        )
        otp_config = OTPConfiguration(
            questionnaire_id=questionnaire.id,
            is_otp_required=False,
            provider_name="twilio",
            otp_expiry_seconds=300,
            max_retry_attempts=3
        )
        db.add(eligibility)
        db.add(otp_config)

        db.commit()
        db.refresh(questionnaire)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=user_id,
            action="questionnaire.create",
            resource_type="Questionnaire",
            resource_id=questionnaire.id,
            metadata_json={"title": questionnaire.title, "category": questionnaire.category}
        )
        return questionnaire

    @staticmethod
    def update_questionnaire(
        db: Session,
        questionnaire: Questionnaire,
        q_in: QuestionnaireUpdate,
        user_id: str
    ) -> Questionnaire:
        if q_in.title is not None:
            questionnaire.title = q_in.title.strip()
        if q_in.description is not None:
            questionnaire.description = q_in.description
        if q_in.category is not None:
            questionnaire.category = q_in.category
        if q_in.status is not None:
            questionnaire.status = q_in.status

        db.commit()
        db.refresh(questionnaire)

        create_audit_log(
            db=db,
            company_id=questionnaire.company_id,
            actor_id=user_id,
            action="questionnaire.update",
            resource_type="Questionnaire",
            resource_id=questionnaire.id,
            metadata_json={"status": questionnaire.status}
        )
        return questionnaire

    @staticmethod
    def duplicate_questionnaire(
        db: Session,
        questionnaire_id: str,
        company_id: str,
        user_id: str
    ) -> Questionnaire:
        original = QuestionnaireService.get_by_id(db, questionnaire_id, company_id)
        if not original:
            raise HTTPException(status_code=404, detail="Questionnaire not found")

        clone = Questionnaire(
            company_id=company_id,
            created_by=user_id,
            title=f"{original.title} (Copy)",
            description=original.description,
            category=original.category,
            status="Draft",
            current_version=1
        )
        db.add(clone)
        db.flush()

        # Copy questions and options
        id_mapping = {}
        for q in original.questions:
            cloned_q = Question(
                questionnaire_id=clone.id,
                question_text=q.question_text,
                question_type=q.question_type,
                help_text=q.help_text,
                is_required=q.is_required,
                order_index=q.order_index,
                validation_rules=q.validation_rules
            )
            db.add(cloned_q)
            db.flush()
            id_mapping[q.id] = cloned_q.id

            for opt in q.options:
                cloned_opt = QuestionOption(
                    question_id=cloned_q.id,
                    label=opt.label,
                    value=opt.value,
                    order_index=opt.order_index
                )
                db.add(cloned_opt)

            for tr in q.translations:
                cloned_tr = QuestionTranslation(
                    question_id=cloned_q.id,
                    language_code=tr.language_code,
                    translated_text=tr.translated_text,
                    translated_help_text=tr.translated_help_text,
                    translated_options=tr.translated_options
                )
                db.add(cloned_tr)

        # Copy branching rules with mapped IDs
        for rule in original.branching_rules:
            if rule.source_question_id in id_mapping and rule.target_question_id in id_mapping:
                cloned_rule = BranchingRule(
                    questionnaire_id=clone.id,
                    source_question_id=id_mapping[rule.source_question_id],
                    target_question_id=id_mapping[rule.target_question_id],
                    condition_operator=rule.condition_operator,
                    condition_value=rule.condition_value,
                    action=rule.action
                )
                db.add(cloned_rule)

        # Copy eligibility
        if original.eligibility:
            db.add(QuestionnaireEligibility(
                questionnaire_id=clone.id,
                min_age=original.eligibility.min_age,
                max_age=original.eligibility.max_age,
                allowed_genders=original.eligibility.allowed_genders,
                target_cities=original.eligibility.target_cities,
                respondent_quota=original.eligibility.respondent_quota
            ))

        # Copy OTP config
        if original.otp_config:
            db.add(OTPConfiguration(
                questionnaire_id=clone.id,
                is_otp_required=original.otp_config.is_otp_required,
                provider_name=original.otp_config.provider_name,
                otp_expiry_seconds=original.otp_config.otp_expiry_seconds,
                max_retry_attempts=original.otp_config.max_retry_attempts
            ))

        db.commit()
        db.refresh(clone)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=user_id,
            action="questionnaire.duplicate",
            resource_type="Questionnaire",
            resource_id=clone.id,
            metadata_json={"original_id": original.id, "new_title": clone.title}
        )
        return clone

    @staticmethod
    def publish_questionnaire(
        db: Session,
        questionnaire: Questionnaire,
        user_id: str,
        changelog: Optional[str] = "Version published"
    ) -> QuestionnaireVersion:
        if not questionnaire.questions:
            raise HTTPException(
                status_code=400,
                detail="Cannot publish a questionnaire with zero questions"
            )

        # Build schema snapshot
        snapshot_questions = []
        for q in questionnaire.questions:
            snapshot_questions.append({
                "id": q.id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "help_text": q.help_text,
                "is_required": q.is_required,
                "order_index": q.order_index,
                "validation_rules": q.validation_rules,
                "options": [{"id": opt.id, "label": opt.label, "value": opt.value} for opt in q.options],
                "translations": [
                    {
                        "language_code": tr.language_code,
                        "translated_text": tr.translated_text,
                        "translated_options": tr.translated_options
                    } for tr in q.translations
                ]
            })

        snapshot_rules = [
            {
                "id": r.id,
                "source_question_id": r.source_question_id,
                "target_question_id": r.target_question_id,
                "condition_operator": r.condition_operator,
                "condition_value": r.condition_value,
                "action": r.action
            } for r in questionnaire.branching_rules
        ]

        full_snapshot = {
            "title": questionnaire.title,
            "category": questionnaire.category,
            "description": questionnaire.description,
            "questions": snapshot_questions,
            "branching_rules": snapshot_rules,
            "eligibility": {
                "min_age": questionnaire.eligibility.min_age if questionnaire.eligibility else None,
                "max_age": questionnaire.eligibility.max_age if questionnaire.eligibility else None,
                "allowed_genders": questionnaire.eligibility.allowed_genders if questionnaire.eligibility else "All",
                "target_cities": questionnaire.eligibility.target_cities if questionnaire.eligibility else []
            },
            "otp_config": {
                "is_otp_required": questionnaire.otp_config.is_otp_required if questionnaire.otp_config else False,
                "provider_name": questionnaire.otp_config.provider_name if questionnaire.otp_config else "twilio"
            }
        }

        version_record = QuestionnaireVersion(
            questionnaire_id=questionnaire.id,
            version_number=questionnaire.current_version,
            status="Published",
            schema_snapshot=full_snapshot,
            changelog=changelog
        )
        db.add(version_record)

        questionnaire.status = "Published"
        questionnaire.published_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(version_record)
        db.refresh(questionnaire)

        create_audit_log(
            db=db,
            company_id=questionnaire.company_id,
            actor_id=user_id,
            action="questionnaire.publish",
            resource_type="Questionnaire",
            resource_id=questionnaire.id,
            metadata_json={"version": questionnaire.current_version, "title": questionnaire.title}
        )
        return version_record

    @staticmethod
    def branch_new_version(
        db: Session,
        questionnaire: Questionnaire,
        user_id: str
    ) -> Questionnaire:
        """Called when editing a published questionnaire to preserve published integrity."""
        questionnaire.current_version += 1
        questionnaire.status = "Draft"
        db.commit()
        db.refresh(questionnaire)

        create_audit_log(
            db=db,
            company_id=questionnaire.company_id,
            actor_id=user_id,
            action="questionnaire.branch_version",
            resource_type="Questionnaire",
            resource_id=questionnaire.id,
            metadata_json={"new_version": questionnaire.current_version}
        )
        return questionnaire

    @staticmethod
    def evaluate_branching(
        questionnaire: Questionnaire,
        answers: Dict[str, Any]
    ) -> Tuple[List[str], List[str], int]:
        """Evaluates conditional branching rules in real-time.
        Returns: (visible_question_ids, hidden_question_ids, count_of_rules_evaluated)
        """
        all_q_ids = [q.id for q in questionnaire.questions]
        hidden_ids = set()

        # Questions targeted by 'show' rules are hidden by default UNLESS condition is satisfied
        rules = questionnaire.branching_rules
        conditional_target_ids = {r.target_question_id for r in rules if r.action == "show"}

        # Initialize condition targets as hidden
        hidden_ids.update(conditional_target_ids)

        evaluated_count = 0
        for rule in rules:
            evaluated_count += 1
            source_ans = answers.get(rule.source_question_id)
            if source_ans is None:
                continue

            cond_val = rule.condition_value
            op = rule.condition_operator
            is_match = False

            # Normalize for comparison
            str_source_ans = str(source_ans).strip().lower()
            str_cond_val = str(cond_val).strip().lower()

            if op == "equals":
                is_match = (str_source_ans == str_cond_val)
            elif op == "not_equals":
                is_match = (str_source_ans != str_cond_val)
            elif op == "contains":
                is_match = (str_cond_val in str_source_ans)
            elif op == "greater_than":
                try:
                    is_match = float(str_source_ans) > float(str_cond_val)
                except ValueError:
                    is_match = False
            elif op == "less_than":
                try:
                    is_match = float(str_source_ans) < float(str_cond_val)
                except ValueError:
                    is_match = False

            if rule.action == "show" and is_match:
                hidden_ids.discard(rule.target_question_id)
            elif rule.action == "hide" and is_match:
                hidden_ids.add(rule.target_question_id)

        visible_ids = [qid for qid in all_q_ids if qid not in hidden_ids]
        return visible_ids, list(hidden_ids), evaluated_count
