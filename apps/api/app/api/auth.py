from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import User
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {
        "access_token": create_access_token(user.email, user.role),
        "role": user.role,
    }


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "role": user.role}


@router.post("/logout")
def logout():
    return {"detail": "Logged out (client should discard token)"}
