# Backend — FastAPI arxitekturasi

Stack: Python 3.12+ + FastAPI + SQLAlchemy 2.0 async + Alembic + Pydantic v2. Paket menejeri: `uv`.

## Papka tuzilishi

```
backend/
  pyproject.toml
  alembic.ini
  alembic/
  .env.example              # production: faqat DATABASE_URL / SECRET_KEY
  app/
    main.py
    seed.py
    core/                   # config, database, security, deps, schemas
    modules/
      auth/ users/ tours/ leads/ customers/ bookings/ spends/ dashboard/
```

Har modul: `models.py` → `schemas.py` → `repository.py` → `service.py` → `router.py`.
Oqim: `router → service → repository → DB`.

## API

- Prefix: `/api/v1/<modul>`
- Auth cookie: `access_token`, `refresh_token` (httpOnly)
- Lidlar filter: `GET /api/v1/leads/?period=day|week|month|3m|1y`
- Rollar: `admin`, `employee`

## Local

```bash
docker compose up -d
cd backend && uv sync && uv run alembic upgrade head && uv run python -m app.seed
uv run uvicorn app.main:app --reload --port 8000
```
