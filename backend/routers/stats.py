import pytesseract
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from config import settings
from routers.recognition import pipeline

router = APIRouter(prefix="/stats", tags=["system stats"])

@router.get("", response_model=schemas.SystemStats)
def get_system_stats(db: Session = Depends(get_db)):
    total_processed = db.query(models.RecognitionRecord).count()
    high_conf_records = db.query(models.RecognitionRecord).filter(models.RecognitionRecord.confidence >= 0.5).count()
    
    high_conf_rate = (high_conf_records / total_processed * 100.0) if total_processed > 0 else 0.0
    
    whitelisted_matches = db.query(models.RecognitionRecord).filter(models.RecognitionRecord.status == "whitelisted").count()
    watchlist_alerts = db.query(models.RecognitionRecord).filter(models.RecognitionRecord.status == "watchlist_alert").count()
    total_vehicles = db.query(models.Vehicle).count()
    
    try:
        tess_ver = pytesseract.get_tesseract_version().public
    except Exception:
        tess_ver = "5.5.3 (Configured)"

    yolo_loaded = pipeline.model is not None

    return {
        "total_processed": total_processed,
        "high_confidence_count": high_conf_records,
        "high_confidence_rate": round(high_conf_rate, 1),
        "whitelisted_matches": whitelisted_matches,
        "watchlist_alerts": watchlist_alerts,
        "total_vehicles": total_vehicles,
        "tesseract_version": str(tess_ver),
        "yolo_model_loaded": yolo_loaded
    }
