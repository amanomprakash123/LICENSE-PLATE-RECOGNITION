import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "License Plate Recognition System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lpr.db")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "auto_lpr_secret_key_change_in_production_2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:8000"
    ).split(",")
    
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "uploads")
    SAMPLES_DIR: str = os.path.join(os.path.dirname(__file__), "uploads", "samples")

settings = Settings()
