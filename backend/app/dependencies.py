import jwt
from fastapi import Header, HTTPException, status
from pydantic import BaseModel

from app.config import get_settings

_jwk_client: jwt.PyJWKClient | None = None


def _get_jwk_client() -> jwt.PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        settings = get_settings()
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        # cache_keys=True avoids refetching the JWKS on every single request.
        _jwk_client = jwt.PyJWKClient(jwks_url, cache_keys=True)
    return _jwk_client


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

    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.PyJWKClientError:
        # JWKS fetch/lookup failed — surface as 401 rather than a 500, since
        # from the caller's perspective their token still isn't usable.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify token against Supabase signing keys",
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