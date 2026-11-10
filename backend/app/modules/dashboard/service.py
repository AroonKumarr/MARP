from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from app.modules.users.models import User, Role, RegisteredDevice, AuditLog
from app.modules.questionnaires.models import Questionnaire
from app.modules.campaigns.models import Campaign, CampaignAssignment, CampaignEvidence
from app.modules.dashboard.schemas import (
    DashboardMetricsResponse, WorkflowBoardResponse, WorkflowBoardItem,
    CategoryDonutResponse, CategoryDonutItem, WeeklyActivityResponse, WeeklyActivityItem
)

COLOR_MAP = {
    "Retail": {"color": "#D9F66A", "badge": "lime"},
    "Billboard": {"color": "#91ACF8", "badge": "periwinkle"},
    "Competitor": {"color": "#B6A0F3", "badge": "lavender"},
    "Field": {"color": "#9DD9C7", "badge": "mint"},
    "Other": {"color": "#F2B77C", "badge": "orange"}
}

class DashboardService:
    @staticmethod
    def get_metrics(db: Session, company_id: str) -> DashboardMetricsResponse:
        active_camps = db.query(Campaign).filter(
            Campaign.company_id == company_id,
            Campaign.status.in_(["Active", "In Progress"])
        ).count()

        field_staff_count = db.query(User).join(User.roles).filter(
            User.company_id == company_id,
            User.is_active == True,
            Role.name == "Field Staff"
        ).distinct().count()

        pub_questionnaires = db.query(Questionnaire).filter(
            Questionnaire.company_id == company_id,
            Questionnaire.status == "Published"
        ).count()

        pending_reviews = db.query(CampaignEvidence).join(Campaign).filter(
            Campaign.company_id == company_id,
            CampaignEvidence.verification_status == "Pending"
        ).count()

        total_users = db.query(User).filter(
            User.company_id == company_id,
            User.is_active == True
        ).count()

        reg_devices = db.query(RegisteredDevice).filter(
            RegisteredDevice.company_id == company_id,
            RegisteredDevice.status == "Approved"
        ).count()

        return DashboardMetricsResponse(
            active_campaigns=active_camps,
            total_field_staff=field_staff_count,
            published_questionnaires=pub_questionnaires,
            pending_reviews=pending_reviews,
            total_users=total_users,
            registered_devices=reg_devices
        )

    @staticmethod
    def get_workflow_board(db: Session, company_id: str) -> WorkflowBoardResponse:
        assignments = db.query(CampaignAssignment).join(Campaign).filter(
            Campaign.company_id == company_id
        ).order_by(CampaignAssignment.due_date.asc()).all()

        todo: List[WorkflowBoardItem] = []
        in_progress: List[WorkflowBoardItem] = []
        review: List[WorkflowBoardItem] = []

        for asgn in assignments:
            cat = asgn.campaign.research_category if asgn.campaign else "Field"
            conf = COLOR_MAP.get(cat, COLOR_MAP["Other"])
            
            assignees = []
            if asgn.user:
                assignees.append({
                    "name": asgn.user.full_name,
                    "avatar": asgn.user.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={asgn.user.full_name}"
                })

            item = WorkflowBoardItem(
                id=asgn.id,
                title=f"{asgn.campaign.title if asgn.campaign else 'Task'} - {asgn.location.name if asgn.location else 'Site'}",
                description=asgn.notes or (asgn.questionnaire.title if asgn.questionnaire else "On-ground audit inspection"),
                category=cat,
                badge_color=conf["badge"],
                due_date_formatted=asgn.due_date.strftime("%d %b"),
                assignees=assignees,
                attachment_count=len(asgn.evidence) if asgn.evidence else 0,
                comment_count=1 if asgn.notes else 0,
                status=asgn.status
            )

            if asgn.status == "Scheduled":
                todo.append(item)
            elif asgn.status == "In Progress":
                in_progress.append(item)
            elif asgn.status == "Completed":
                review.append(item)

        return WorkflowBoardResponse(
            todo=todo,
            in_progress=in_progress,
            review=review
        )

    @staticmethod
    def get_category_donut(db: Session, company_id: str) -> CategoryDonutResponse:
        results = db.query(
            Questionnaire.category,
            func.count(Questionnaire.id)
        ).filter(
            Questionnaire.company_id == company_id
        ).group_by(Questionnaire.category).all()

        total = sum(r[1] for r in results)
        items: List[CategoryDonutItem] = []

        for cat, cnt in results:
            color = COLOR_MAP.get(cat, COLOR_MAP["Other"])["color"]
            items.append(CategoryDonutItem(
                name=cat,
                value=cnt,
                color=color
            ))

        return CategoryDonutResponse(total=total, items=items)

    @staticmethod
    def get_weekly_activity(db: Session, company_id: str) -> WeeklyActivityResponse:
        today = date.today()
        # Find start of current week (Monday)
        start_of_week = today - timedelta(days=today.weekday())

        days = []
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        total_week = 0

        for i in range(7):
            current_day = start_of_week + timedelta(days=i)
            # Count assignments scheduled or completed on this day
            cnt = db.query(CampaignAssignment).join(Campaign).filter(
                Campaign.company_id == company_id,
                CampaignAssignment.scheduled_date == current_day
            ).count()

            is_today = (current_day == today)
            total_week += cnt
            days.append(WeeklyActivityItem(
                day=day_names[i],
                count=cnt,
                date_str=current_day.strftime("%d %b"),
                is_active=is_today
            ))

        headline = f"{total_week:,} Tasks" if total_week != 1 else "1 Task"
        subtext = "Active assignments this week"

        return WeeklyActivityResponse(
            total_count=total_week,
            headline_metric=headline,
            subtext=subtext,
            days=days
        )
