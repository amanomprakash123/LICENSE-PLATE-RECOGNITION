@echo off
echo Starting Backend...
start cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Application started! Backend is on port 8000, frontend is on port 5173.
