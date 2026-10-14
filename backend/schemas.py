from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    role: Optional[str] = "operator"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

# Vehicle Schemas
class VehicleBase(BaseModel):
    plate_text: str
    owner_name: Optional[str] = None
    vehicle_model: Optional[str] = None
    is_whitelist: bool = False
    is_watchlist: bool = False
    notes: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    owner_name: Optional[str] = None
    vehicle_model: Optional[str] = None
    is_whitelist: Optional[bool] = None
    is_watchlist: Optional[bool] = None
    notes: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Recognition Schemas
class RecognitionRecordResponse(BaseModel):
    id: int
    plate_text: str
    confidence: float
    timestamp: datetime
    original_image_url: Optional[str] = None
    crop_image_url: Optional[str] = None
    annotated_image_url: Optional[str] = None
    is_corrected: bool
    corrected_text: Optional[str] = None
    status: str
    vehicle: Optional[VehicleResponse] = None

    class Config:
        from_attributes = True

class CorrectionRequest(BaseModel):
    corrected_text: str

# Stats Schema
class SystemStats(BaseModel):
    total_processed: int
    high_confidence_count: int
    high_confidence_rate: float
    whitelisted_matches: int
    watchlist_alerts: int
    total_vehicles: int
    tesseract_version: str
    yolo_model_loaded: bool
