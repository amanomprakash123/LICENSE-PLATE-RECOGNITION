import os
import logging
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

logger = logging.getLogger(__name__)

DATABASE_URL = settings.DATABASE_URL
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import models
    from auth import get_password_hash
    
    # If SQLite file exists, verify schema consistency across all tables
    inspector = inspect(engine)
    needs_drop = False
    
    if inspector.has_table("users"):
        cols = [c["name"] for c in inspector.get_columns("users")]
        if "email" not in cols:
            needs_drop = True

    if inspector.has_table("recognition_records"):
        cols = [c["name"] for c in inspector.get_columns("recognition_records")]
        if "original_image_url" not in cols or "crop_image_url" not in cols:
            needs_drop = True

    if inspector.has_table("vehicles"):
        cols = [c["name"] for c in inspector.get_columns("vehicles")]
        if "vehicle_model" not in cols:
            needs_drop = True

    if needs_drop:
        logger.info("Outdated DB schema detected. Dropping old tables to recreate...")
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed default admin user if not exists
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            admin_user = models.User(
                username="admin",
                email="admin@autolpr.local",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            logger.info("Created default admin user (admin / admin123)")

        # Seed sample whitelist and watchlist vehicles if empty
        if db.query(models.Vehicle).count() == 0:
            sample_vehicles = [
                models.Vehicle(
                    plate_text="ABC1234",
                    owner_name="John Doe",
                    vehicle_model="Toyota Camry (Blue)",
                    is_whitelist=True,
                    is_watchlist=False,
                    notes="Executive Parking Pass"
                ),
                models.Vehicle(
                    plate_text="XYZ9876",
                    owner_name="Jane Smith",
                    vehicle_model="Honda Civic (Black)",
                    is_whitelist=False,
                    is_watchlist=True,
                    notes="Security Alert: Flagged Vehicle"
                ),
                models.Vehicle(
                    plate_text="LPR2026",
                    owner_name="System Demo",
                    vehicle_model="Tesla Model 3 (White)",
                    is_whitelist=True,
                    is_watchlist=False,
                    notes="Demonstration Vehicle"
                ),
            ]
            db.add_all(sample_vehicles)
            logger.info("Seeded initial vehicle registry records")
        
        db.commit()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
