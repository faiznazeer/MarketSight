from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
import requests
from auth_config import (
    Auth0Config, 
    SignUpRequest, 
    LoginRequest, 
    TokenResponse,
    UserInfo
)
from auth_middleware import require_auth
from urllib.parse import quote

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_management_api_token() -> str:
    """Get Auth0 Management API token for user operations"""
    url = f"https://{Auth0Config.DOMAIN}/oauth/token"
    
    payload = {
        "client_id": Auth0Config.CLIENT_ID,
        "client_secret": Auth0Config.CLIENT_SECRET,
        "audience": f"https://{Auth0Config.DOMAIN}/api/v2/",
        "grant_type": "client_credentials"
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get management token: {str(e)}"
        )

@router.post("/signup", response_model=Dict[str, Any])
async def signup(request: SignUpRequest):
    """
    Sign up a new user with email and password
    
    Args:
        request: SignUpRequest containing email, password, and optional name
        
    Returns:
        User creation confirmation
    """
    try:
        # Get management API token
        mgmt_token = get_management_api_token()
        
        # Create user in Auth0
        url = f"https://{Auth0Config.DOMAIN}/api/v2/users"
        headers = {
            "Authorization": f"Bearer {mgmt_token}",
            "Content-Type": "application/json"
        }
        
        user_data = {
            "email": request.email,
            "password": request.password,
            "connection": "Username-Password-Authentication",
            "email_verified": False
        }
        
        if request.name:
            user_data["name"] = request.name
            user_data["given_name"] = request.name
        
        response = requests.post(url, json=user_data, headers=headers)
        
        if response.status_code == 409:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )
        
        response.raise_for_status()
        user = response.json()
        
        return {
            "message": "User created successfully",
            "user_id": user.get("user_id"),
            "email": user.get("email"),
            "email_verified": user.get("email_verified", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Login with email and password
    
    Args:
        request: LoginRequest containing email and password
        
    Returns:
        TokenResponse with access token and other auth details
    """
    try:
        url = f"https://{Auth0Config.DOMAIN}/oauth/token"
        
        payload = {
            "grant_type": "password",
            "username": request.email,
            "password": request.password,
            "client_id": Auth0Config.CLIENT_ID,
            "client_secret": Auth0Config.CLIENT_SECRET,
            "audience": Auth0Config.API_AUDIENCE,
            "scope": "openid profile email"
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 403:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        response.raise_for_status()
        data = response.json()
        
        return TokenResponse(
            access_token=data["access_token"],
            id_token=data.get("id_token"),
            token_type=data.get("token_type", "Bearer"),
            expires_in=data.get("expires_in", 86400)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/google/authorize")
async def google_authorize(redirect_uri: str | None = Query(default=None)):
    """
    Get Google OAuth authorization URL
    
    Returns:
        Authorization URL for Google login
    """
    target_redirect = redirect_uri or Auth0Config.REDIRECT_URI

    auth_url = (
        f"https://{Auth0Config.DOMAIN}/authorize"
        f"?response_type=token"
        f"&client_id={Auth0Config.CLIENT_ID}"
        f"&connection=google-oauth2"
        f"&redirect_uri={target_redirect}"
        f"&scope=openid%20profile%20email"
        f"&audience={Auth0Config.API_AUDIENCE}"
    )
    
    return {
        "authorization_url": auth_url,
        "message": "Redirect user to this URL for Google authentication"
    }

@router.post("/token/exchange")
async def exchange_code_for_token(code: str, redirect_uri: str):
    """
    Exchange authorization code for access token (for OAuth flows)
    
    Args:
        code: Authorization code from OAuth provider
        redirect_uri: Redirect URI used in the authorization request
        
    Returns:
        TokenResponse with access token
    """
    try:
        url = f"https://{Auth0Config.DOMAIN}/oauth/token"
        
        payload = {
            "grant_type": "authorization_code",
            "client_id": Auth0Config.CLIENT_ID,
            "client_secret": Auth0Config.CLIENT_SECRET,
            "code": code,
            "redirect_uri": redirect_uri,
            "audience": Auth0Config.API_AUDIENCE
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        return TokenResponse(
            access_token=data["access_token"],
            id_token=data.get("id_token"),
            token_type=data.get("token_type", "Bearer"),
            expires_in=data.get("expires_in", 86400)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Token exchange failed: {str(e)}"
        )

security = HTTPBearer()

@router.get("/user/me", response_model=UserInfo)
async def get_user_profile(
    current_user: Dict[str, Any] = Depends(require_auth),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get current authenticated user's profile
    
    Args:
        current_user: Current authenticated user (injected by dependency)
        
    Returns:
        UserInfo with user profile details
    """
    # First try /userinfo with the user's access token (works for social logins)
    try:
        userinfo_url = f"https://{Auth0Config.DOMAIN}/userinfo"
        ui_resp = requests.get(
            userinfo_url,
            headers={"Authorization": f"Bearer {credentials.credentials}"},
            timeout=10
        )
        if ui_resp.ok:
            data = ui_resp.json()
            return UserInfo(
                sub=data.get("sub", current_user.get("user_id")),
                email=data.get("email", ""),
                email_verified=data.get("email_verified", False),
                name=data.get("name"),
                picture=data.get("picture"),
                updated_at=data.get("updated_at")
            )
    except Exception:
        pass

    # Fallback to Management API if /userinfo not available
    try:
        mgmt_token = get_management_api_token()
        user_id = current_user["user_id"]
        encoded_user_id = quote(user_id, safe="")
        url = f"https://{Auth0Config.DOMAIN}/api/v2/users/{encoded_user_id}"
        headers = {"Authorization": f"Bearer {mgmt_token}"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        user_data = response.json()
        return UserInfo(
            sub=user_data.get("user_id", user_id),
            email=user_data.get("email", ""),
            email_verified=user_data.get("email_verified", False),
            name=user_data.get("name"),
            picture=user_data.get("picture"),
            updated_at=user_data.get("updated_at")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(require_auth)):
    """
    Logout current user
    
    Note: With JWT tokens, actual logout is handled client-side by removing the token.
    This endpoint serves as a confirmation and can be used for logging purposes.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Logout confirmation
    """
    return {
        "message": "Logged out successfully",
        "logout_url": f"https://{Auth0Config.DOMAIN}/v2/logout?client_id={Auth0Config.CLIENT_ID}"
    }

@router.get("/validate")
async def validate_token(current_user: Dict[str, Any] = Depends(require_auth)):
    """
    Validate current authentication token
    
    Args:
        current_user: Current authenticated user (injected by dependency)
        
    Returns:
        Validation confirmation with user details
    """
    return {
        "valid": True,
        "user": current_user
    }

