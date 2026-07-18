"""SQLAlchemy 2.x models for the PlaceIQ intelligence hub."""

from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

OFFER_TYPES = ("placement", "ps1", "ps2", "si")
ROLE_CATEGORIES = ("sde", "core", "analytics", "finance", "consulting", "other")


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    offers: Mapped[list["Offer"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    cutoff_stats: Mapped[list["CutoffStat"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    experiences: Mapped[list["Experience"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(String(20), index=True)  # placement|ps1|ps2|si
    year: Mapped[int] = mapped_column(Integer, index=True)
    role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role_category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    cgpa_cutoff: Mapped[float | None] = mapped_column(Float, nullable=True)
    stipend_ctc: Mapped[float | None] = mapped_column(Float, nullable=True)
    slots: Mapped[int | None] = mapped_column(Integer, nullable=True)

    company: Mapped[Company] = relationship(back_populates="offers")


class CutoffStat(Base):
    __tablename__ = "cutoff_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(String(20), index=True)
    year: Mapped[int] = mapped_column(Integer)
    min_cg: Mapped[float | None] = mapped_column(Float, nullable=True)
    median_cg: Mapped[float | None] = mapped_column(Float, nullable=True)
    p25: Mapped[float | None] = mapped_column(Float, nullable=True)
    p75: Mapped[float | None] = mapped_column(Float, nullable=True)

    company: Mapped[Company] = relationship(back_populates="cutoff_stats")


class Experience(Base):
    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(String(20))
    year: Mapped[int] = mapped_column(Integer)
    author_hint: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    approved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    company: Mapped[Company] = relationship(back_populates="experiences")


# --- Pillar C: cold emailing centre ---

CAMPAIGN_STATUSES = ("pending", "running", "done", "failed")
CAMPAIGN_LOG_STATUSES = ("sent", "failed", "dryrun")


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    campaign_logs: Mapped[list["CampaignLog"]] = relationship(
        back_populates="contact", cascade="all, delete-orphan"
    )


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    subject: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text)  # supports {name},{company},{role}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    campaigns: Mapped[list["Campaign"]] = relationship(back_populates="template")


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    template_id: Mapped[int] = mapped_column(ForeignKey("email_templates.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    dry_run: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    template: Mapped[EmailTemplate] = relationship(back_populates="campaigns")
    logs: Mapped[list["CampaignLog"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan"
    )


class CampaignLog(Base):
    __tablename__ = "campaign_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), index=True
    )
    contact_id: Mapped[int] = mapped_column(
        ForeignKey("contacts.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(20))  # sent|failed|dryrun
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    campaign: Mapped[Campaign] = relationship(back_populates="logs")
    contact: Mapped[Contact] = relationship(back_populates="campaign_logs")


# --- Pillar D: auth, favorites, analytics ---


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(200))  # "salt_hex$hash_hex"
    name: Mapped[str] = mapped_column(String(200))
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    degree: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grad_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cgpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    favorites: Mapped[list["Favorite"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "company_id", name="uq_favorite_pair"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    user: Mapped[User] = relationship(back_populates="favorites")
    company: Mapped[Company] = relationship()


class PageEvent(Base):
    __tablename__ = "page_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    path: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
