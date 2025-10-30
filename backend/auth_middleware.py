from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import requests
from functools import lru_cache
from typing import Optional, Dict, Any
from auth_config import Auth0Config

security = HTTPBearer()

@lru_cache()
def get_jwks() -> Dict[str, Any]:
    """Fetch and cache Auth0 JWKS (JSON Web Key Set)"""
    try:
        jwks_url = f"https://{Auth0Config.DOMAIN}/.well-known/jwks.json"
        response = requests.get(jwks_url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch JWKS: {str(e)}"
        )

def get_rsa_key(token: str) -> Optional[Dict[str, Any]]:
    """Extract RSA key from JWKS for token verification"""
    try:
        unverified_header = jwt.get_unverified_header(token)
        jwks = get_jwks()
        
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        return rsa_key if rsa_key else None
    except Exception:
        return None

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict[str, Any]:
    """
    Verify Auth0 JWT token and return decoded payload
    
    Args:
        credentials: HTTP Authorization header credentials
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or verification fails
    """
    token = credentials.credentials
    
    try:
        # Get RSA key for verification
        rsa_key = get_rsa_key(token)
        
        if not rsa_key:
            raise HTTPException(
                status_code=401,
                detail="Unable to find appropriate key"
            )
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=Auth0Config.ALGORITHMS,
            audience=Auth0Config.API_AUDIENCE,
            issuer=Auth0Config.ISSUER
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.JWTClaimsError:
        raise HTTPException(
            status_code=401,
            detail="Invalid claims. Please check the audience and issuer."
        )
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Unable to validate token: {str(e)}"
        )

async def get_current_user(
    payload: Dict[str, Any] = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Get current authenticated user from token payload
    
    Args:
        payload: Decoded JWT payload
        
    Returns:
        User information dictionary
    """
    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "permissions": payload.get("permissions", []),
        "scope": payload.get("scope", "")
    }

async def require_auth(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to require authentication for protected routes
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current user information
    """
    if not current_user.get("user_id"):
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    return current_user

