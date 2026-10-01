# Travel Booking CRM — Master Orchestrator

Bu loyiha: travel agentlik uchun CRM (ticket bron qilish va boshqa xizmatlarni boshqarish).
Stack: **Python (FastAPI) backend** + **Next.js App Router frontend** + PostgreSQL.

## Hujjatlar xaritasi (faqat keraklisini o'qi)

| Hujjat | Qachon o'qiladi |
|---|---|
| `docs/ORCHESTRATION.md` | Har yangi sessiya boshida (qisqa, majburiy) |
| `docs/TASKS.md` | Task tanlash/belgilashda |
| `docs/ARCHITECTURE.md` | Umumiy tizim savollari, yangi modul boshlashda |
| `docs/BACKEND.md` | Faqat backend task |
| `docs/FRONTEND.md` | Faqat frontend/UI task |

Backend taskda FRONTEND.md o'qilmaydi va aksincha — token tejash.

## Asosiy tamoyillar (qisqacha, to'liqrog'i .cursor/rules/ da)

1. **Scope**: faqat so'ralgan ish. Yangi dependency — faqat foydalanuvchi tasdig'i bilan.
2. **Token**: qisqa javob (caveman uslubi), minimal fayl o'qish, bir sessiya = bitta task.
3. **UI**: prompt asosida, dizaynda o'zboshimchalik yo'q.
4. **Sifat**: senior darajada sodda, tushunarli kod — lekin so'ralmagan abstraksiyasiz.

## Sessiya protokoli

1. `docs/TASKS.md` ni yangidan o'qi, taskni aniqla. Task `[~]` bo'lsa — band, olma.
2. Taskni `[~]` deb belgila (band qilish). Faqat shu taskga tegishli hujjat + fayllarni o'qi.
3. Taskni bajar. Scope tashqarisiga chiqma, faqat o'z modulingga yoz.
4. `docs/TASKS.md` da `[x]` belgila va commit qil: `git add <fayllaring> && git commit -m "task X.Y: tavsif"`.
5. Hisobot faqat: `Bajarildi: <1 gap>` yoki `Bajarilmadi: <sabab>`. To'xta.

Parallel sessiyalar qoidasi: `.cursor/rules/parallel-control.mdc`.

## Eslatma: eski skelet

`apps/` va `packages/` da eski NestJS + Vite skeleti bor — u YANGI stackga mos emas.
Phase 0 (docs/TASKS.md) da olib tashlanadi. Ungacha `apps/`, `packages/` ga tegilmaydi.
