import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from fastapi import HTTPException, status

from app.core.security import get_password_hash, verify_password, create_access_token
from app.modules.users.models import (
    User, Company, Role, Permission, WorkspaceSetting, RegisteredDevice, UserInvitation, AuditLog
)
from app.modules.users.schemas import (
    UserCreate, UserUpdate, UserProfileUpdate, CompanyCreate, CompanyUpdate,
    WorkspaceSettingUpdate, DeviceRegisterRequest, UserInviteRequest
)

def create_audit_log(
    db: Session,
    company_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    actor_id: Optional[str] = None,
    metadata_json: Optional[dict] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    log_entry = AuditLog(
        company_id=company_id,
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        ip_address=ip_address,
        metadata_json=metadata_json or {}
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

class UserService:
    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        return user

    @staticmethod
    def get_by_id(db: Session, user_id: str, company_id: Optional[str] = None) -> Optional[User]:
        query = db.query(User).filter(User.id == user_id)
        if company_id:
            query = query.filter(User.company_id == company_id)
        return query.first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def list_users(
        db: Session,
        company_id: str,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role_name: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[User], int]:
        query = db.query(User).filter(User.company_id == company_id)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.phone.ilike(search_term)
                )
            )

        if role_name:
            query = query.join(User.roles).filter(Role.name == role_name)

        total = query.count()
        users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
        return users, total

    @staticmethod
    def create_user(
        db: Session,
        company_id: str,
        user_in: UserCreate,
        actor_id: Optional[str] = None
    ) -> User:
        existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists"
            )
        
        db_user = User(
            company_id=company_id,
            email=user_in.email.lower().strip(),
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name.strip(),
            phone=user_in.phone,
            avatar_url=user_in.avatar_url,
            is_active=user_in.is_active,
            is_verified=True
        )

        # Assign roles
        if user_in.role_names:
            roles = db.query(Role).filter(Role.name.in_(user_in.role_names)).all()
            db_user.roles = roles
        else:
            default_role = db.query(Role).filter(Role.name == "Field Staff").first()
            if default_role:
                db_user.roles = [default_role]

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=actor_id,
            action="user.create",
            resource_type="User",
            resource_id=db_user.id,
            metadata_json={"email": db_user.email, "roles": [r.name for r in db_user.roles]}
        )

        return db_user

    @staticmethod
    def update_user(
        db: Session,
        user: User,
        user_in: UserUpdate,
        actor_id: Optional[str] = None
    ) -> User:
        if user_in.full_name is not None:
            user.full_name = user_in.full_name.strip()
        if user_in.phone is not None:
            user.phone = user_in.phone
        if user_in.avatar_url is not None:
            user.avatar_url = user_in.avatar_url
        if user_in.is_active is not None:
            user.is_active = user_in.is_active
        if user_in.role_names is not None:
            roles = db.query(Role).filter(Role.name.in_(user_in.role_names)).all()
            user.roles = roles

        db.commit()
        db.refresh(user)

        create_audit_log(
            db=db,
            company_id=user.company_id,
            actor_id=actor_id,
            action="user.update",
            resource_type="User",
            resource_id=user.id,
            metadata_json={"is_active": user.is_active, "roles": [r.name for r in user.roles]}
        )
        return user

    @staticmethod
    def set_user_status(
        db: Session,
        user: User,
        is_active: bool,
        actor_id: Optional[str] = None
    ) -> User:
        user.is_active = is_active
        db.commit()
        db.refresh(user)

        action_name = "user.activate" if is_active else "user.deactivate"
        create_audit_log(
            db=db,
            company_id=user.company_id,
            actor_id=actor_id,
            action=action_name,
            resource_type="User",
            resource_id=user.id,
            metadata_json={"email": user.email, "is_active": is_active}
        )
        return user

class WorkspaceService:
    @staticmethod
    def register_company_with_admin(
        db: Session,
        company_name: str,
        admin_name: str,
        admin_email: str,
        admin_password: str
    ) -> Tuple[Company, User]:
        slug = company_name.lower().replace(" ", "-").replace(".", "") + "-" + str(uuid.uuid4())[:6]
        
        company = Company(
            name=company_name,
            slug=slug,
            contact_email=admin_email.lower().strip(),
            timezone="Asia/Karachi",
            status="active"
        )
        db.add(company)
        db.flush()

        settings = WorkspaceSetting(
            company_id=company.id,
            allow_device_auto_approval=False,
            require_mfa_for_admins=False,
            branding_accent="#D9F66A"
        )
        db.add(settings)

        admin_role = db.query(Role).filter(Role.name == "Company Administrator").first()
        admin_user = User(
            company_id=company.id,
            email=admin_email.lower().strip(),
            hashed_password=get_password_hash(admin_password),
            full_name=admin_name.strip(),
            is_active=True,
            is_verified=True
        )
        if admin_role:
            admin_user.roles = [admin_role]

        db.add(admin_user)
        db.commit()
        db.refresh(company)
        db.refresh(admin_user)

        create_audit_log(
            db=db,
            company_id=company.id,
            actor_id=admin_user.id,
            action="workspace.create",
            resource_type="Company",
            resource_id=company.id,
            metadata_json={"company_name": company.name, "admin_email": admin_user.email}
        )
        return company, admin_user

    @staticmethod
    def update_workspace(
        db: Session,
        company: Company,
        comp_in: CompanyUpdate,
        actor_id: Optional[str] = None
    ) -> Company:
        if comp_in.name is not None:
            company.name = comp_in.name
        if comp_in.industry is not None:
            company.industry = comp_in.industry
        if comp_in.contact_email is not None:
            company.contact_email = comp_in.contact_email
        if comp_in.phone is not None:
            company.phone = comp_in.phone
        if comp_in.address is not None:
            company.address = comp_in.address
        if comp_in.timezone is not None:
            company.timezone = comp_in.timezone
        
        db.commit()
        db.refresh(company)
        create_audit_log(
            db=db,
            company_id=company.id,
            actor_id=actor_id,
            action="workspace.update",
            resource_type="Company",
            resource_id=company.id,
            metadata_json={"name": company.name}
        )
        return company

    @staticmethod
    def update_settings(
        db: Session,
        company_id: str,
        set_in: WorkspaceSettingUpdate,
        actor_id: Optional[str] = None
    ) -> WorkspaceSetting:
        settings = db.query(WorkspaceSetting).filter(WorkspaceSetting.company_id == company_id).first()
        if not settings:
            settings = WorkspaceSetting(company_id=company_id)
            db.add(settings)
            
        if set_in.allow_device_auto_approval is not None:
            settings.allow_device_auto_approval = set_in.allow_device_auto_approval
        if set_in.require_mfa_for_admins is not None:
            settings.require_mfa_for_admins = set_in.require_mfa_for_admins
        if set_in.branding_accent is not None:
            settings.branding_accent = set_in.branding_accent
        if set_in.custom_domain is not None:
            settings.custom_domain = set_in.custom_domain

        db.commit()
        db.refresh(settings)
        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=actor_id,
            action="workspace_settings.update",
            resource_type="WorkspaceSetting",
            resource_id=settings.id,
            metadata_json={"branding_accent": settings.branding_accent}
        )
        return settings

class DeviceService:
    @staticmethod
    def register_device(
        db: Session,
        company_id: str,
        dev_in: DeviceRegisterRequest,
        actor_id: Optional[str] = None
    ) -> RegisteredDevice:
        existing = db.query(RegisteredDevice).filter(
            RegisteredDevice.device_identifier == dev_in.device_identifier
        ).first()
        
        if existing:
            existing.last_active_at = datetime.now(timezone.utc)
            existing.model = dev_in.model
            existing.os_version = dev_in.os_version
            existing.app_version = dev_in.app_version
            if dev_in.user_id:
                existing.user_id = dev_in.user_id
            db.commit()
            db.refresh(existing)
            return existing

        # Check workspace auto-approval setting
        settings = db.query(WorkspaceSetting).filter(WorkspaceSetting.company_id == company_id).first()
        initial_status = "Approved" if (settings and settings.allow_device_auto_approval) else "Pending"

        device = RegisteredDevice(
            company_id=company_id,
            user_id=dev_in.user_id,
            device_identifier=dev_in.device_identifier,
            device_name=dev_in.device_name,
            model=dev_in.model,
            os_version=dev_in.os_version,
            app_version=dev_in.app_version,
            status=initial_status,
            last_active_at=datetime.now(timezone.utc)
        )
        db.add(device)
        db.commit()
        db.refresh(device)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=actor_id,
            action="device.register",
            resource_type="RegisteredDevice",
            resource_id=device.id,
            metadata_json={"device_name": device.device_name, "identifier": device.device_identifier, "status": device.status}
        )
        return device

    @staticmethod
    def update_status(
        db: Session,
        device_id: str,
        company_id: str,
        new_status: str,
        actor_id: Optional[str] = None
    ) -> RegisteredDevice:
        device = db.query(RegisteredDevice).filter(
            RegisteredDevice.id == device_id,
            RegisteredDevice.company_id == company_id
        ).first()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        device.status = new_status
        db.commit()
        db.refresh(device)

        create_audit_log(
            db=db,
            company_id=company_id,
            actor_id=actor_id,
            action=f"device.{new_status.lower()}",
            resource_type="RegisteredDevice",
            resource_id=device.id,
            metadata_json={"status": new_status, "device_identifier": device.device_identifier}
        )
        return device
