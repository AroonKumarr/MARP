import uuid
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.core.dependencies import (
    get_current_user, get_current_active_user, get_current_company,
    require_role, require_permission
)
from app.common.schemas import PaginatedResponse, MessageResponse
from app.modules.users.models import (
    User, Company, Role, Permission, RegisteredDevice, AuditLog, UserInvitation, WorkspaceSetting
)
from app.modules.users.schemas import (
    LoginRequest, Token, RegisterRequest, PasswordResetRequest, PasswordResetConfirm,
    UserCreate, UserUpdate, UserProfileUpdate, UserResponse, UserRoleUpdate,
    CompanyUpdate, CompanyResponse, WorkspaceSettingUpdate, WorkspaceSettingResponse,
    RoleResponse, PermissionResponse, DeviceRegisterRequest, DeviceStatusUpdate, DeviceResponse,
    UserInviteRequest, UserInviteResponse, AuditLogResponse
)
from app.modules.users.service import UserService, WorkspaceService, DeviceService, create_audit_log

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
workspace_router = APIRouter(prefix="/workspaces", tags=["Workspace Management"])
users_router = APIRouter(prefix="/users", tags=["User Management"])
roles_router = APIRouter(prefix="/roles", tags=["Roles & Permissions"])
devices_router = APIRouter(prefix="/devices", tags=["Device Management"])
audit_router = APIRouter(prefix="/audit-logs", tags=["Audit Activity"])

# --- Authentication Routes ---

@auth_router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = UserService.authenticate(db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your workspace administrator."
        )

    role_names = [role.name for role in user.roles]
    token = create_access_token(
        subject=user.id,
        claims={"company_id": user.company_id, "roles": role_names, "email": user.email}
    )

    create_audit_log(
        db=db,
        company_id=user.company_id,
        actor_id=user.id,
        action="user.login",
        resource_type="User",
        resource_id=user.id,
        metadata_json={"email": user.email}
    )

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        company_id=user.company_id,
        roles=role_names
    )

@auth_router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(reg_data: RegisterRequest, db: Session = Depends(get_db)):
    existing = UserService.get_by_email(db, reg_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    company, admin_user = WorkspaceService.register_company_with_admin(
        db=db,
        company_name=reg_data.company_name,
        admin_name=reg_data.full_name,
        admin_email=reg_data.email,
        admin_password=reg_data.password
    )

    role_names = [role.name for role in admin_user.roles]
    token = create_access_token(
        subject=admin_user.id,
        claims={"company_id": company.id, "roles": role_names, "email": admin_user.email}
    )

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=admin_user.id,
        full_name=admin_user.full_name,
        email=admin_user.email,
        company_id=company.id,
        roles=role_names
    )

@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@auth_router.put("/me", response_model=UserResponse)
def update_me(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name.strip()
    if profile_in.phone is not None:
        current_user.phone = profile_in.phone
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url
    
    if profile_in.new_password:
        if not profile_in.current_password:
            raise HTTPException(status_code=400, detail="Current password required to change password")
        from app.core.security import verify_password
        if not verify_password(profile_in.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password verification failed")
        current_user.hashed_password = get_password_hash(profile_in.new_password)
        create_audit_log(
            db=db,
            company_id=current_user.company_id,
            actor_id=current_user.id,
            action="user.password_change",
            resource_type="User",
            resource_id=current_user.id
        )

    db.commit()
    db.refresh(current_user)
    return current_user

@auth_router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = UserService.get_by_email(db, req.email)
    if user:
        # Generate token
        reset_token = create_access_token(
            subject=user.id,
            claims={"purpose": "password_reset"},
            expires_delta=timedelta(hours=2)
        )
        create_audit_log(
            db=db,
            company_id=user.company_id,
            actor_id=user.id,
            action="user.password_reset_request",
            resource_type="User",
            resource_id=user.id,
            metadata_json={"reset_token": reset_token}
        )
    return MessageResponse(message="If the email exists in our records, password reset instructions have been generated.")

@auth_router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    from app.core.security import decode_token
    payload = decode_token(req.token)
    if not payload or payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()

    create_audit_log(
        db=db,
        company_id=user.company_id,
        actor_id=user.id,
        action="user.password_reset_success",
        resource_type="User",
        resource_id=user.id
    )
    return MessageResponse(message="Password reset successfully. You may now login with your new credentials.")

# --- Workspace Management Routes ---

@workspace_router.get("/current", response_model=CompanyResponse)
def get_current_workspace(
    company: Company = Depends(get_current_company),
    current_user: User = Depends(get_current_active_user)
):
    return company

@workspace_router.put("/current", response_model=CompanyResponse)
def update_current_workspace(
    comp_in: CompanyUpdate,
    company: Company = Depends(get_current_company),
    current_user: User = Depends(require_role(["Company Administrator"])),
    db: Session = Depends(get_db)
):
    return WorkspaceService.update_workspace(db, company, comp_in, actor_id=current_user.id)

@workspace_router.get("/settings", response_model=WorkspaceSettingResponse)
def get_workspace_settings(
    company: Company = Depends(get_current_company),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    settings = db.query(WorkspaceSetting).filter(WorkspaceSetting.company_id == company.id).first()
    if not settings:
        settings = WorkspaceSetting(company_id=company.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@workspace_router.put("/settings", response_model=WorkspaceSettingResponse)
def update_workspace_settings(
    set_in: WorkspaceSettingUpdate,
    company: Company = Depends(get_current_company),
    current_user: User = Depends(require_role(["Company Administrator"])),
    db: Session = Depends(get_db)
):
    return WorkspaceService.update_settings(db, company.id, set_in, actor_id=current_user.id)

# --- Users Routes ---

@users_router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role_name: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * page_size
    users, total = UserService.list_users(
        db=db,
        company_id=current_user.company_id,
        skip=skip,
        limit=page_size,
        search=search,
        role_name=role_name,
        is_active=is_active
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@users_router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    return UserService.create_user(
        db=db,
        company_id=current_user.company_id,
        user_in=user_in,
        actor_id=current_user.id
    )

@users_router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user = UserService.get_by_id(db, user_id=user_id, company_id=current_user.company_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@users_router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    user = UserService.get_by_id(db, user_id=user_id, company_id=current_user.company_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserService.update_user(db=db, user=user, user_in=user_in, actor_id=current_user.id)

@users_router.post("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: str,
    current_user: User = Depends(require_role(["Company Administrator"])),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user = UserService.get_by_id(db, user_id=user_id, company_id=current_user.company_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserService.set_user_status(db, user, is_active=False, actor_id=current_user.id)

@users_router.post("/{user_id}/reactivate", response_model=UserResponse)
def reactivate_user(
    user_id: str,
    current_user: User = Depends(require_role(["Company Administrator"])),
    db: Session = Depends(get_db)
):
    user = UserService.get_by_id(db, user_id=user_id, company_id=current_user.company_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserService.set_user_status(db, user, is_active=True, actor_id=current_user.id)

@users_router.post("/{user_id}/roles", response_model=UserResponse)
def assign_user_roles(
    user_id: str,
    roles_in: UserRoleUpdate,
    current_user: User = Depends(require_role(["Company Administrator"])),
    db: Session = Depends(get_db)
):
    user = UserService.get_by_id(db, user_id=user_id, company_id=current_user.company_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    roles = db.query(Role).filter(Role.name.in_(roles_in.role_names)).all()
    user.roles = roles
    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="user.roles_update",
        resource_type="User",
        resource_id=user.id,
        metadata_json={"new_roles": [r.name for r in user.roles]}
    )
    return user

@users_router.post("/invite", response_model=UserInviteResponse, status_code=status.HTTP_201_CREATED)
def invite_user(
    inv_in: UserInviteRequest,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.name == inv_in.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    invite = UserInvitation(
        company_id=current_user.company_id,
        email=inv_in.email.lower().strip(),
        role_id=role.id,
        token=str(uuid.uuid4()),
        status="Pending",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        actor_id=current_user.id,
        action="user.invite",
        resource_type="UserInvitation",
        resource_id=invite.id,
        metadata_json={"email": invite.email, "role": role.name}
    )

    return UserInviteResponse(
        id=invite.id,
        email=invite.email,
        role_name=role.name,
        status=invite.status,
        token=invite.token,
        expires_at=invite.expires_at,
        created_at=invite.created_at
    )

# --- Roles & Permissions Routes ---

@roles_router.get("", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

@roles_router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(db: Session = Depends(get_db)):
    return db.query(Permission).all()

# --- Device Management Routes ---

@devices_router.get("", response_model=List[DeviceResponse])
def list_devices(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(RegisteredDevice).filter(RegisteredDevice.company_id == current_user.company_id)
    if status:
        query = query.filter(RegisteredDevice.status == status)
    devices = query.order_by(desc(RegisteredDevice.created_at)).all()
    
    result = []
    for d in devices:
        res = DeviceResponse.from_orm(d) if hasattr(DeviceResponse, "from_orm") else DeviceResponse.model_validate(d)
        if d.user:
            res.user_name = d.user.full_name
        result.append(res)
    return result

@devices_router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    dev_in: DeviceRegisterRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    device = DeviceService.register_device(
        db=db,
        company_id=current_user.company_id,
        dev_in=dev_in,
        actor_id=current_user.id
    )
    res = DeviceResponse.model_validate(device)
    if device.user:
        res.user_name = device.user.full_name
    return res

@devices_router.put("/{device_id}/approve", response_model=DeviceResponse)
def approve_device(
    device_id: str,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager"])),
    db: Session = Depends(get_db)
):
    device = DeviceService.update_status(db, device_id, current_user.company_id, "Approved", actor_id=current_user.id)
    res = DeviceResponse.model_validate(device)
    if device.user:
        res.user_name = device.user.full_name
    return res

@devices_router.put("/{device_id}/revoke", response_model=DeviceResponse)
def revoke_device(
    device_id: str,
    current_user: User = Depends(require_role(["Company Administrator"])),
    db: Session = Depends(get_db)
):
    device = DeviceService.update_status(db, device_id, current_user.company_id, "Revoked", actor_id=current_user.id)
    res = DeviceResponse.model_validate(device)
    if device.user:
        res.user_name = device.user.full_name
    return res

@devices_router.put("/{device_id}/status", response_model=DeviceResponse)
def update_device_status(
    device_id: str,
    status_in: DeviceStatusUpdate,
    current_user: User = Depends(require_role(["Company Administrator"])),
    db: Session = Depends(get_db)
):
    device = DeviceService.update_status(db, device_id, current_user.company_id, status_in.status, actor_id=current_user.id)
    res = DeviceResponse.model_validate(device)
    if device.user:
        res.user_name = device.user.full_name
    return res

# --- Audit Logs Routes ---

@audit_router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_user: User = Depends(require_role(["Company Administrator", "Research Manager", "Analyst"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.company_id == current_user.company_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    
    total = query.count()
    logs = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    result = []
    for l in logs:
        r = AuditLogResponse.model_validate(l)
        if l.actor:
            r.actor_name = l.actor.full_name
        result.append(r)
        
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(
        items=result,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
