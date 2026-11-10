from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database import Base
from app.database.session import engine

# Import all routers
from app.modules.users.routes import (
    auth_router, workspace_router, users_router, roles_router, devices_router, audit_router
)
from app.modules.questionnaires.routes import (
    questionnaires_router, questions_router, rules_router
)
from app.modules.campaigns.routes import (
    campaigns_router, locations_router, advertisements_router,
    competitors_router, assignments_router, evidence_router
)
from app.modules.dashboard.routes import dashboard_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-Agent Market Research Platform (MARP) - Modules 01, 02, and 03 Production API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)

@app.get(f"{settings.API_V1_STR}/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "modules": [
            "Module 01: User Management & Workspaces",
            "Module 02: Questionnaire Management & Builder",
            "Module 03: Campaign Management & Asset Registry"
        ]
    }

# Register Routers
prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=prefix)
app.include_router(workspace_router, prefix=prefix)
app.include_router(users_router, prefix=prefix)
app.include_router(roles_router, prefix=prefix)
app.include_router(devices_router, prefix=prefix)
app.include_router(audit_router, prefix=prefix)

app.include_router(questionnaires_router, prefix=prefix)
app.include_router(questions_router, prefix=prefix)
app.include_router(rules_router, prefix=prefix)

app.include_router(campaigns_router, prefix=prefix)
app.include_router(locations_router, prefix=prefix)
app.include_router(advertisements_router, prefix=prefix)
app.include_router(competitors_router, prefix=prefix)
app.include_router(assignments_router, prefix=prefix)
app.include_router(evidence_router, prefix=prefix)

app.include_router(dashboard_router, prefix=prefix)
