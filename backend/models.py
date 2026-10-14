from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="operator")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    plate_text = Column(String, unique=True, index=True, nullable=False)
    owner_name = Column(String, nullable=True)
    vehicle_model = Column(String, nullable=True)
    is_whitelist = Column(Boolean, default=False)
    is_watchlist = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    records = relationship("RecognitionRecord", back_populates="vehicle")

class RecognitionRecord(Base):
    __tablename__ = "recognition_records"
    
    id = Column(Integer, primary_key=True, index=True)
    plate_text = Column(String, index=True, nullable=False)
    confidence = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    original_image_url = Column(String, nullable=True)
    crop_image_url = Column(String, nullable=True)
    annotated_image_url = Column(String, nullable=True)
    
    is_corrected = Column(Boolean, default=False)
    corrected_text = Column(String, nullable=True)
    status = Column(String, default="valid") # "valid", "review_required", "whitelisted", "watchlist_alert"
    
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    vehicle = relationship("Vehicle", back_populates="records")
