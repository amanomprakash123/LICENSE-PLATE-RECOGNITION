# License Plate Recognition (LPR) System
### OpenCV + Tesseract OCR 5.5 + FastAPI + React TypeScript + Tailwind CSS

A complete, full-stack, local License Plate Recognition System built with Python FastAPI, OpenCV, Tesseract OCR 5.5, SQLAlchemy SQLite, React 19, TypeScript, and Tailwind CSS.

---

## 🌟 Features

- **Full-Stack License Plate Recognition**: Upload vehicle photos for instant license plate detection, cropping, annotation, and OCR character extraction.
- **OpenCV & YOLO Detection Pipeline**: Hybrid detection using YOLO (`yolov8n.pt`), OpenCV Haar Cascades (`haarcascade_russian_plate_number.xml`), and aspect-ratio contour analysis.
- **Tesseract OCR 5.5 Integration**: Uses Windows Tesseract executable (`C:\Program Files\Tesseract-OCR\tesseract.exe`) with multi-PSM character recognition.
- **Vehicle Registry (Whitelist & Watchlist)**: Classify license plates as Whitelisted (granted access pass) or Watchlist (security alert).
- **Audit Logs & Manual Review**: Review past recognitions with original image, cropped plate image, annotated detection image, confidence score, and inline text correction.
- **CSV Log Export**: One-click export of recognition logs to CSV format.
- **System Diagnostics**: Live monitoring of FastAPI health, Tesseract version, YOLO model status, and SQLite database.
- **Authentication**: Pre-configured JWT token authentication (`admin` / `admin123`).

---

## 🚀 Quick Start Instructions

### 1. Requirements & Prerequisites
- **Windows PC** with Python 3.10+ and Node.js 18+
- **Tesseract OCR 5.5** installed at: `C:\Program Files\Tesseract-OCR\tesseract.exe`

### 2. Backend Setup & Startup (PowerShell)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup & Startup (PowerShell)
```powershell
cd frontend
npm install
npm run dev
```

### 4. Direct One-Click Batch Startup
Double-click `start.bat` in the root directory to open two console windows running the backend and frontend servers simultaneously.

---

## 🔗 Local Application URLs

- **React Dashboard UI**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc API Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔐 Default Authentication Credentials

- **Username**: `admin`
- **Password**: `admin123`

---

## 🧪 Running Automated Tests

### Backend Automated Test Suite
```powershell
cd backend
python test_backend.py
```

### Frontend Production Build Test
```powershell
cd frontend
npm run build
```
