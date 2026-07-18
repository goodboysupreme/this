"""FastAPI dependencies for bearer-token authentication."""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .db import get_db
from .models import User
from .services import auth as auth_service


def _user_from_header(
    authorization: str | None, db: Session
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    user_id = auth_service.decode_access_token(authorization[7:].strip())
    if user_id is None:
        return None
    return db.get(User, user_id)


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Require a valid ``Authorization: Bearer <token>`` header (401 otherwise)."""
    user = _user_from_header(authorization, db)
    if user is None:
        raise HTTPException(status_code=401, detail="missing or invalid bearer token")
    return user


def get_optional_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """Resolve the caller when a token is present; anonymous (None) otherwise."""
    return _user_from_header(authorization, db)
