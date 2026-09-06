from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models.models import User

bearer_scheme = HTTPBearer()


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(creds.credentials, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Admin role required")
    return user


def require_editor(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("editor", "admin"):
        raise HTTPException(403, "Editor role required")
    return user
