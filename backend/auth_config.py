import os
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

class Auth0Config:
    """Auth0 configuration settings"""
    DOMAIN: str = os.getenv('AUTH0_DOMAIN', '')
    API_AUDIENCE: str = os.getenv('AUTH0_API_AUDIENCE', '')
    ALGORITHMS: list = ["RS256"]
    ISSUER: str = f"https://{os.getenv('AUTH0_DOMAIN', '')}/"
    REDIRECT_URI: str = os.getenv('AUTH0_REDIRECT_URI', 'http://localhost:5174/callback')
    REDIRECT_URI: str = "http://localhost:5174/callback"
    
    # Auth0 Management API (for user management)
    CLIENT_ID: str = os.getenv('AUTH0_CLIENT_ID', '')
    CLIENT_SECRET: str = os.getenv('AUTH0_CLIENT_SECRET', '')
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate that all required Auth0 settings are present"""
        required = [cls.DOMAIN, cls.API_AUDIENCE, cls.CLIENT_ID, cls.CLIENT_SECRET]
        return all(required)


# Pydantic models for request/response
class SignUpRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    id_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: int

class UserInfo(BaseModel):
    sub: str
    email: str
    email_verified: bool
    name: Optional[str] = None
    picture: Optional[str] = None
    updated_at: Optional[str] = None

