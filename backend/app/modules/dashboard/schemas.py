from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel

class DashboardMetricsResponse(BaseModel):
    active_campaigns: int
    total_field_staff: int
    published_questionnaires: int
    pending_reviews: int
    total_users: int
    registered_devices: int

class WorkflowBoardItem(BaseModel):
    id: str
    title: str
    description: str
    category: str # "Web", "Mobile", "Retail", "Billboard", etc.
    badge_color: str # "lime", "periwinkle", "lavender", "mint", "orange"
    due_date_formatted: str
    assignees: List[Dict[str, str]] = [] # [{"name": "Aroon Kumar", "avatar": "..."}]
    attachment_count: int = 0
    comment_count: int = 0
    status: str # "Scheduled" (To Do), "In Progress", "Completed" (Review)

class WorkflowBoardResponse(BaseModel):
    todo: List[WorkflowBoardItem]
    in_progress: List[WorkflowBoardItem]
    review: List[WorkflowBoardItem]

class CategoryDonutItem(BaseModel):
    name: str
    value: int
    color: str

class CategoryDonutResponse(BaseModel):
    total: int
    items: List[CategoryDonutItem]

class WeeklyActivityItem(BaseModel):
    day: str # "Mon", "Tue", etc.
    count: int
    date_str: str
    is_active: bool = False

class WeeklyActivityResponse(BaseModel):
    total_count: int
    headline_metric: str
    subtext: str
    days: List[WeeklyActivityItem]
