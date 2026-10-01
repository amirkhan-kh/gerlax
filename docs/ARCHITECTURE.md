# Arxitektura — umumiy ko'rinish

Travel Booking CRM: agentlik xodimlari mijozlar, ticket bronlari, to'lovlar va vazifalarni boshqaradi.

## Tizim

```
[Next.js frontend] --HTTP/JSON--> [FastAPI backend] --SQLAlchemy--> [PostgreSQL]
     :3000                            :8000                            :5432 (docker)
```

- Frontend backend bilan faqat REST API (`/api/v1/...`) orqali gaplashadi.
- Auth: JWT (access + refresh), httpOnly cookie orqali.
- PostgreSQL mavjud `docker-compose.yml` dagi konteynerda.

## Ruxsat etilgan stack (qat'iy — boshqasi tasdiqsiz qo'shilmaydi)

| Qatlam | Texnologiya |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, pydantic-settings, uvicorn, asyncpg, passlib, python-jose |
| Frontend | Next.js (App Router, src/ layout), TypeScript, Tailwind CSS |
| DB | PostgreSQL 16 (docker) |
| Tooling | uv (python paketlar), pnpm (frontend) |

## Papka tuzilishi (root)

```
booking-agency/
  backend/        # FastAPI — docs/BACKEND.md
  frontend/       # Next.js — docs/FRONTEND.md
  docs/           # arxitektura va orchestration hujjatlari
  docker-compose.yml
  AGENTS.md
```

## CRM domenlari (modullar)

| Modul | Vazifasi |
|---|---|
| `auth` | Login, JWT cookie, joriy foydalanuvchi |
| `users` | Xodimlar (admin, employee) — 2–3 kishi |
| `tours` | Tur katalogi |
| `leads` | Lidlar/kanban + period filter (kun/hafta/oy/3m/1y) |
| `customers` | Mijozlar bazasi |
| `bookings` | Ticket bronlari (`new → confirmed → paid → completed / cancelled`) |
| `spends` | Menejer xarajatlari |
| `dashboard` | Statistika (lid/bron/moliya) |

Har bir domen backendda ham frontendda ham bir xil nom bilan yuritiladi.
