"""Auth endpoints: register, login, profile (JWT bearer)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth_deps import get_current_user
from ..db import get_db
from ..models import User
from ..schemas import (
    LoginIn,
    ProfileOut,
    ProfilePatchIn,
    RegisterIn,
    TokenOut,
    UserOut,
)
from ..services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _profile_out(user: User) -> ProfileOut:
    return ProfileOut(
        id=user.id,
        email=user.email,
        name=user.name,
        branch=user.branch,
        degree=user.degree,
        grad_year=user.grad_year,
        cgpa=user.cgpa,
    )


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> UserOut:
    email = payload.email.strip().lower()
    if not email or not payload.password or not payload.name.strip():
        raise HTTPException(status_code=422, detail="email, password and name are required")
    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="email already registered")
    user = User(
        email=email,
        hashed_password=auth_service.hash_password(payload.password),
        name=payload.name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut(id=user.id, email=user.email, name=user.name)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    email = payload.email.strip().lower()
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None or not auth_service.verify_password(
        payload.password, user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="invalid email or password")
    return TokenOut(access_token=auth_service.create_access_token(user.id))


@router.get("/me", response_model=ProfileOut)
def read_me(user: User = Depends(get_current_user)) -> ProfileOut:
    return _profile_out(user)


@router.patch("/me", response_model=ProfileOut)
def update_me(
    payload: ProfilePatchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _profile_out(user)
