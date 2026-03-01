# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from typing import List, Optional
from app.core.config import get_settings
from loguru import logger

security = HTTPBearer()
settings = get_settings()

jwks_cache = None

async def get_jwks():
    global jwks_cache
    if not jwks_cache:
        url = f"{settings.SUPABASE_URL}/auth/v1/jwks"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url)
                if resp.is_success:
                    jwks_cache = resp.json()
                else:
                    logger.error(f"Failed to fetch JWKS config from Supabase: {resp.status_code}")
        except Exception as e:
            logger.error(f"JWKS fetch failed: {e}")
    return jwks_cache

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate the Supabase JWT token and return the user payload.
    Ensures endpoints are protected by Supabase Authentication using public key.
    """
    token = credentials.credentials
    try:
        # Require RS256 and kid strictly without fallbacks
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg")
        
        if alg != "RS256":
            raise ValueError("Invalid algorithm. Strict RS256 enforcement applied.")
            
        kid = unverified_header.get("kid")
        if not kid:
            raise ValueError("Missing 'kid' in token header.")
            
        jwks = await get_jwks()
        key = None
        if jwks:
            for jwk in jwks.get("keys", []):
                if jwk.get("kid") == kid:
                    key = jwk
                    break
                    
        if not key:
            raise ValueError("Key ID (kid) not found in JWKS.")
            
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"{settings.SUPABASE_URL}/auth/v1",
            options={
                "verify_aud": True, 
                "verify_iss": True,
                "verify_exp": True
            } 
        )
        
        # Extract user ID and role
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

class RoleChecker:
    """Implement Role-Based Access Control (RBAC)"""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict = Depends(get_current_user)):
        # Default role is viewer
        user_role = user.get("user_role") or user.get("role") or user.get("app_metadata", {}).get("role", "viewer")
        
        # "authenticated" is the default role in supabase app_metadata or JWT when not explicitly set
        # Treat as 'viewer' if that's the base role
        if user_role == "authenticated":
            # Some platforms default authenticated users to have basic view access
            user_role = "viewer"
            
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Role {user_role} is not in {self.allowed_roles}"
            )
        return user
