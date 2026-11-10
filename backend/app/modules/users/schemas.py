from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Authentication
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    email: str
    company_id: str
    roles: List[str]

class TokenData(BaseModel):
    user_id: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

# Permissions & Roles
class PermissionResponse(BaseModel):
    id: str
    code: str
    name: str
    module: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    is_system_role: bool
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role_names: List[str]

# Company & Workspace
class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = None
    contact_email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    timezone: str = "Asia/Karachi"

class CompanyCreate(CompanyBase):
    slug: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    timezone: Optional[str] = None

class WorkspaceSettingResponse(BaseModel):
    id: str
    company_id: str
    allow_device_auto_approval: bool
    require_mfa_for_admins: bool
    branding_accent: str
    custom_domain: Optional[str] = None

    class Config:
        from_attributes = True

class WorkspaceSettingUpdate(BaseModel):
    allow_device_auto_approval: Optional[bool] = None
    require_mfa_for_admins: Optional[bool] = None
    branding_accent: Optional[str] = None
    custom_domain: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: str
    slug: str
    status: str
    created_at: datetime
    settings: Optional[WorkspaceSettingResponse] = None

    class Config:
        from_attributes = True

# Users
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role_names: List[str] = ["Field Staff"]

class RegisterRequest(BaseModel):
    company_name: str
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    role_names: Optional[List[str]] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=8)

class UserResponse(UserBase):
    id: str
    company_id: str
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    roles: List[RoleResponse] = []

    class Config:
        from_attributes = True

# Device Management
class DeviceRegisterRequest(BaseModel):
    device_identifier: str
    device_name: str
    model: str
    os_version: str
    app_version: str
    user_id: Optional[str] = None

class DeviceStatusUpdate(BaseModel):
    status: str = Field(pattern="^(Pending|Approved|Revoked|Deactivated)$")

class DeviceResponse(BaseModel):
    id: str
    company_id: str
    user_id: Optional[str] = None
    device_identifier: str
    device_name: str
    model: str
    os_version: str
    app_version: str
    status: str
    last_active_at: Optional[datetime] = None
    created_at: datetime
    registered_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
        from_attributes = True

# Invitations
class UserInviteRequest(BaseModel):
    email: EmailStr
    role_name: str = "Field Staff"

class UserInviteResponse(BaseModel):
    id: str
    email: str
    role_name: str
    status: str
    token: str
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Logs
class AuditLogResponse(BaseModel):
    id: str
    company_id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    ip_address: Optional[str] = None
    metadata_json: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True
