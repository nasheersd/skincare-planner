# Backend — FastAPI

See `../docs/SETUP_INSTRUCTIONS.md` for full setup steps.

Quick run:
```
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs
