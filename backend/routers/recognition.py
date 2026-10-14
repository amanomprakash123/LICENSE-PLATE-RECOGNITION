import io
import csv
from typing import Optional, List
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models
import schemas
from lpr_pipeline import LPRPipeline

router = APIRouter(tags=["recognition"])
pipeline = LPRPipeline()

MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB limit

@router.post("/recognize", response_model=schemas.RecognitionRecordResponse)
async def recognize_plate(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPEG, PNG, WEBP)")
    
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image file size exceeds maximum limit of 10MB")
    
    try:
        pipeline_result = pipeline.process_image(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing error: {str(e)}")
    
    plate_text = pipeline_result.get("plate_text", "UNKNOWN")
    confidence = pipeline_result.get("confidence", 0.0)

    # Check vehicle registry for matches
    matching_vehicle = None
    status_label = "valid"
    if plate_text and plate_text != "UNKNOWN":
        matching_vehicle = db.query(models.Vehicle).filter(models.Vehicle.plate_text == plate_text).first()
        if matching_vehicle:
            if matching_vehicle.is_watchlist:
                status_label = "watchlist_alert"
            elif matching_vehicle.is_whitelist:
                status_label = "whitelisted"
        elif confidence < 0.5:
            status_label = "review_required"

    # Save persistent record in SQLite DB
    record = models.RecognitionRecord(
        plate_text=plate_text,
        confidence=confidence,
        original_image_url=pipeline_result.get("original_image_url"),
        crop_image_url=pipeline_result.get("crop_image_url"),
        annotated_image_url=pipeline_result.get("annotated_image_url"),
        status=status_label,
        vehicle_id=matching_vehicle.id if matching_vehicle else None,
        is_corrected=False
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Reload record with vehicle relationship
    record = db.query(models.RecognitionRecord).options(joinedload(models.RecognitionRecord.vehicle)).filter(models.RecognitionRecord.id == record.id).first()
    return record

@router.get("/history", response_model=List[schemas.RecognitionRecordResponse])
def get_history(
    query: Optional[str] = Query(None, description="Search by plate text"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = db.query(models.RecognitionRecord).options(joinedload(models.RecognitionRecord.vehicle))
    
    if query:
        search_pattern = f"%{query.strip().upper()}%"
        q = q.filter(models.RecognitionRecord.plate_text.like(search_pattern))
    
    if status:
        q = q.filter(models.RecognitionRecord.status == status)
        
    records = q.order_by(models.RecognitionRecord.timestamp.desc()).offset(offset).limit(limit).all()
    return records

@router.get("/history/export/csv")
def export_history_csv(db: Session = Depends(get_db)):
    records = db.query(models.RecognitionRecord).order_by(models.RecognitionRecord.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Plate Text", "Confidence Score", "Status", "Timestamp", "Corrected Text", "Original Image", "Annotated Image"])
    
    for r in records:
        writer.writerow([
            r.id,
            r.plate_text,
            f"{r.confidence * 100:.1f}%",
            r.status,
            r.timestamp.isoformat(),
            r.corrected_text or "",
            r.original_image_url or "",
            r.annotated_image_url or ""
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=lpr_recognition_history.csv"}
    )

@router.get("/history/{record_id}", response_model=schemas.RecognitionRecordResponse)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.RecognitionRecord).options(joinedload(models.RecognitionRecord.vehicle)).filter(models.RecognitionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Recognition record not found")
    return record

@router.put("/history/{record_id}/correct", response_model=schemas.RecognitionRecordResponse)
def correct_record(
    record_id: int, 
    corr: schemas.CorrectionRequest, 
    db: Session = Depends(get_db)
):
    record = db.query(models.RecognitionRecord).filter(models.RecognitionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Recognition record not found")
    
    clean_corrected = corr.corrected_text.strip().upper()
    record.corrected_text = clean_corrected
    record.plate_text = clean_corrected
    record.is_corrected = True
    
    # Re-check vehicle registry
    matching_vehicle = db.query(models.Vehicle).filter(models.Vehicle.plate_text == clean_corrected).first()
    if matching_vehicle:
        record.vehicle_id = matching_vehicle.id
        record.status = "watchlist_alert" if matching_vehicle.is_watchlist else ("whitelisted" if matching_vehicle.is_whitelist else "valid")
    else:
        record.status = "valid"
        
    db.commit()
    db.refresh(record)
    
    record = db.query(models.RecognitionRecord).options(joinedload(models.RecognitionRecord.vehicle)).filter(models.RecognitionRecord.id == record.id).first()
    return record

@router.delete("/history/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.RecognitionRecord).filter(models.RecognitionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Recognition record not found")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Deleted record #{record_id}"}
