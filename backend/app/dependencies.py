"""
Authentication dependency.

Identity is ALWAYS derived from a verified Supabase JWT — never from a
user_id/reporter_id supplied in the request body. This is the single place
JWTs get decoded so the verification logic isn't duplicated/drifted.
"""
import jwt
from fastapi import Header, HTTPException, status
from pydantic import BaseModel

from app.config import get_settings


class CurrentUser(BaseModel):
    id: str
    role: str = "authenticated"


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
        )

    token = authorization.split(" ", 1)[1].strip()
    settings = get_settings()

    try:
        claims = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    role = claims.get("role", "authenticated")
    return CurrentUser(id=user_id, role=role)