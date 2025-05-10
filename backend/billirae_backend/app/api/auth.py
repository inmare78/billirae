from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta

from billirae_backend.app.core.security import create_access_token, verify_password, get_password_hash
from billirae_backend.app.db.models.user import UserInDB, UserCreate

router = APIRouter()

class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str
    token_type: str
    user_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login with username and password.
    
    Args:
        form_data: OAuth2 password request form
        
    Returns:
        LoginResponse with access token and user info
        
    Raises:
        HTTPException: If login fails
    """
    user = await UserInDB.get_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token = create_access_token(subject=str(user.id))
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name
    )

@router.post("/register", response_model=LoginResponse)
async def register(user_create: UserCreate):
    """
    Register a new user.
    
    Args:
        user_create: User creation data
        
    Returns:
        LoginResponse with access token and user info
        
    Raises:
        HTTPException: If registration fails
    """
    # Check if email already exists
    existing_user = await UserInDB.get_by_email(user_create.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create new user
    hashed_password = get_password_hash(user_create.password)
    
    user_data = user_create.dict(exclude={"password"})
    user_data["hashed_password"] = hashed_password
    user_data["is_active"] = True
    
    new_user = UserInDB(**user_data)
    await new_user.save()
    
    # Create access token
    access_token = create_access_token(subject=str(new_user.id))
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(new_user.id),
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name
    )
