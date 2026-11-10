import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column, Table, ForeignKey, String, Boolean, DateTime, Integer, Text, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import TimestampedUUIDModel, Base, GUID

# Association table: User <-> Role
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", GUID(), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", GUID(), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("assigned_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
)

# Association table: Role <-> Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", GUID(), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", GUID(), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

class Company(TimestampedUUIDModel):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Karachi", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="company", cascade="all, delete-orphan")
    settings: Mapped[Optional["WorkspaceSetting"]] = relationship("WorkspaceSetting", back_populates="company", uselist=False, cascade="all, delete-orphan")
    devices: Mapped[List["RegisteredDevice"]] = relationship("RegisteredDevice", back_populates="company", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="company", cascade="all, delete-orphan")
    invitations: Mapped[List["UserInvitation"]] = relationship("UserInvitation", back_populates="company", cascade="all, delete-orphan")

class WorkspaceSetting(TimestampedUUIDModel):
    __tablename__ = "workspace_settings"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), unique=True, nullable=False)
    allow_device_auto_approval: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    require_mfa_for_admins: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    branding_accent: Mapped[str] = mapped_column(String(50), default="#D9F66A", nullable=False)
    custom_domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="settings")

class User(TimestampedUUIDModel):
    __tablename__ = "users"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="users")
    roles: Mapped[List["Role"]] = relationship("Role", secondary=user_roles, back_populates="users")
    devices: Mapped[List["RegisteredDevice"]] = relationship("RegisteredDevice", back_populates="user")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="actor")

class Role(TimestampedUUIDModel):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    users: Mapped[List["User"]] = relationship("User", secondary=user_roles, back_populates="roles")
    permissions: Mapped[List["Permission"]] = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(TimestampedUUIDModel):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    module: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    roles: Mapped[List["Role"]] = relationship("Role", secondary=role_permissions, back_populates="permissions")

class RegisteredDevice(TimestampedUUIDModel):
    __tablename__ = "registered_devices"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    device_identifier: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    device_name: Mapped[str] = mapped_column(String(150), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    os_version: Mapped[str] = mapped_column(String(50), nullable=False)
    app_version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Pending", nullable=False) # Pending, Approved, Revoked, Deactivated
    last_active_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="devices")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="devices")

class UserInvitation(TimestampedUUIDModel):
    __tablename__ = "user_invitations"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str] = mapped_column(GUID(), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Pending", nullable=False) # Pending, Accepted, Expired, Revoked
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="invitations")
    role: Mapped["Role"] = relationship("Role")

class AuditLog(TimestampedUUIDModel):
    __tablename__ = "audit_logs"

    company_id: Mapped[str] = mapped_column(GUID(), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    actor_id: Mapped[Optional[str]] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="audit_logs")
    actor: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
