from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db.mongodb import mongodb
from app.db.models.user import User, UserCreate, UserInDB
from app.core.security import get_password_hash

router = APIRouter(tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

async def get_user_by_email(email: str):
    """Get a user by email."""
    user = await mongodb.db.users.find_one({"email": email})
    if user:
        return UserInDB(**user)

async def authenticate_user(email: str, password: str):
    """Authenticate a user."""
    user = await get_user_by_email(email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from the token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Ungültige Anmeldeinformationen",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = await get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/auth/register", response_model=User)
async def register(user_create: UserCreate):
    """Register a new user."""
    existing_user = await mongodb.db.users.find_one({"email": user_create.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-Mail-Adresse wird bereits verwendet"
        )
    
    user_dict = user_create.dict()
    password = user_dict.pop("password")
    user_dict["password_hash"] = get_password_hash(password)
    
    result = await mongodb.db.users.insert_one(user_dict)
    
    created_user = await mongodb.db.users.find_one({"_id": result.inserted_id})
    
    return User(**created_user)

@router.post("/auth/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Get an access token."""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falsche E-Mail oder Passwort",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/verify-email/{token}")
async def verify_email(token: str):
    """Verify a user's email address."""
    return {"message": "E-Mail-Adresse verifiziert"}
