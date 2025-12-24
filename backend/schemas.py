from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role: str

    class Config:
        orm_mode = True

UserResponse = User

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AIInsightBase(BaseModel):
    title: str
    type: str
    content: str
    confidence_score: float

class AIInsightCreate(AIInsightBase):
    pass

class AIInsightResponse(AIInsightBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True
