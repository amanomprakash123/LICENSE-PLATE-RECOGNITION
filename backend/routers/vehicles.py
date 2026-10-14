from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/vehicles", tags=["vehicle registry"])

@router.get("", response_model=List[schemas.VehicleResponse])
def get_vehicles(
    query: Optional[str] = Query(None, description="Search by plate text or owner name"),
    is_whitelist: Optional[bool] = Query(None),
    is_watchlist: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = db.query(models.Vehicle)
    if query:
        term = f"%{query.strip().upper()}%"
        q = q.filter(
            (models.Vehicle.plate_text.like(term)) | 
            (models.Vehicle.owner_name.like(f"%{query}%"))
        )
    if is_whitelist is not None:
        q = q.filter(models.Vehicle.is_whitelist == is_whitelist)
    if is_watchlist is not None:
        q = q.filter(models.Vehicle.is_watchlist == is_watchlist)
        
    vehicles = q.order_by(models.Vehicle.created_at.desc()).offset(offset).limit(limit).all()
    return vehicles

@router.post("", response_model=schemas.VehicleResponse)
def create_vehicle(v_in: schemas.VehicleCreate, db: Session = Depends(get_db)):
    clean_plate = v_in.plate_text.strip().upper()
    existing = db.query(models.Vehicle).filter(models.Vehicle.plate_text == clean_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle with plate number '{clean_plate}' already exists")
    
    vehicle = models.Vehicle(
        plate_text=clean_plate,
        owner_name=v_in.owner_name,
        vehicle_model=v_in.vehicle_model,
        is_whitelist=v_in.is_whitelist,
        is_watchlist=v_in.is_watchlist,
        notes=v_in.notes
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.put("/{vehicle_id}", response_model=schemas.VehicleResponse)
def update_vehicle(vehicle_id: int, v_in: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if v_in.owner_name is not None:
        vehicle.owner_name = v_in.owner_name
    if v_in.vehicle_model is not None:
        vehicle.vehicle_model = v_in.vehicle_model
    if v_in.is_whitelist is not None:
        vehicle.is_whitelist = v_in.is_whitelist
    if v_in.is_watchlist is not None:
        vehicle.is_watchlist = v_in.is_watchlist
    if v_in.notes is not None:
        vehicle.notes = v_in.notes

    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return {"status": "success", "message": f"Deleted vehicle #{vehicle_id}"}
