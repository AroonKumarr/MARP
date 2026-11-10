from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.dashboard.schemas import (
    DashboardMetricsResponse, WorkflowBoardResponse,
    CategoryDonutResponse, WeeklyActivityResponse
)
from app.modules.dashboard.service import DashboardService

dashboard_router = APIRouter(prefix="/dashboard", tags=["Operational Dashboard"])

@dashboard_router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return DashboardService.get_metrics(db, current_user.company_id)

@dashboard_router.get("/workflow-board", response_model=WorkflowBoardResponse)
def get_workflow_board(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return DashboardService.get_workflow_board(db, current_user.company_id)

@dashboard_router.get("/analytics/donut", response_model=CategoryDonutResponse)
def get_category_donut(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return DashboardService.get_category_donut(db, current_user.company_id)

@dashboard_router.get("/analytics/weekly", response_model=WeeklyActivityResponse)
def get_weekly_activity(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return DashboardService.get_weekly_activity(db, current_user.company_id)
