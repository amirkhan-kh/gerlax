# Tasklar — loyihani to'liq tugatish rejasi

Qoida: 1 sessiya = 1 task. Tugagach `[x]` belgilanadi. Tartib buzilmaydi.

## Phase 0 — Tozalash

- [x] 0.1 Eski skeletni o'chirish: `apps/`, `packages/`, `pnpm-workspace.yaml`, root `package.json` (docker-compose.yml QOLADI).

## Phase 1 — Skelet

- [x] 1.1 `backend/` skelet: uv init, FastAPI + stack, health, `core/config.py`, `core/database.py`, Docker local
- [x] 1.2 Alembic + birinchi migratsiya
- [x] 1.3 `frontend/` skelet: create-next-app, papkalar, `lib/api.ts`
- [x] 1.4 CORS + frontend↔backend health

## Phase 2 — Backend core (tour CRM, lean)

- [x] 2.1 `users` + seed (admin/employee)
- [x] 2.2 `auth`: login/refresh/logout/me, JWT cookie
- [x] 2.3 `tours` CRUD
- [x] 2.4 `leads` CRUD + period filter (day/week/month/3m/1y)
- [x] 2.5 `customers` CRUD
- [x] 2.6 `bookings` CRUD (status oqimi)
- [x] 2.7 `spends` CRUD (manager xarajatlar)
- [x] 2.8 `dashboard` statistika
- [x] 2.9 Rol tekshiruvi (admin/employee)

## Phase 3 — Frontend core

- [x] 3.1 `components/ui/` primitivlar
- [x] 3.2 Login + middleware
- [x] 3.3 Dashboard layout
- [x] 3.4 Dashboard sahifasi

## Phase 4 — CRM UI → real API

- [x] 4.1–4.3 Customers/Bookings UI
- [x] 4.4 Mock olib tashlash; FE↔BE ulash (auth, tours, leads, customers, bookings, spends, dashboard)
- [x] 4.5 Lidlar: period filter UI (kun/hafta/oy/3 oy/1 yil)
- [x] 4.7 Turlar + Lidlar Kanban UI

## Phase 5 — Yakunlash

- [x] 5.1 Oqim tekshiruv (login → lid → tur → mijoz → bron)
- [x] 5.2 Build tekshiruv (`pnpm build`)
- [x] 5.3 README (local Docker + production DATABASE_URL)
## Phase 6 — UX

- [x] 6.1 Loading skeleton + empty/error ("Ma'lumot topilmadi") barcha CRM sahifalarda; local backend run
- [x] 6.2 Forma validatsiya (lid/mijoz/tur/xarajat/bron), telefon davlat-kod select, sana inputlar, UZS/$ valyuta almashtirish; backend validatsiya + migratsiya
- [x] 6.3 Admin nomi → Soyibjon; faqat admin uchun "Boshqaruv" sahifasi (xodimlar CRUD: ism/email/parol/rol, o'chirish); employee ko'rmaydi

## Phase 7 — Integratsiyalar

- [x] 7.1 Google Sheets (Instagram target) → Lidlar Kanban: webhook upsert, status map, qo'lda lidlar alohida
- [x] 7.2 Sheets CSV pull (poller): Apps Scriptsiz real-time sync, 25 lid kelishi
- [x] 7.3 Lid karta dinamik + tahrirlash modal; Mijozlar sahifasi → Sheets lidlar jadvali (delete, pagination); destination/people maydonlari, soft-delete

## Phase 8 — Gerlax do'kon

- [x] 8.1 Aksesuar do'koni: login, tovar turlari, buyurtma, sotuv, admin xodimlar
- [x] 8.2 Buyurtma modal: X yopish, kamera auto ochilish (barcha qurilma), rasm DB da data URL (har qanday format → JPEG), tovar kartada rasm



