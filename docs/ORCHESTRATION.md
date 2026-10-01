# Orchestration — ish tartibi va token strategiyasi

## Oltin qoida: 1 sessiya = 1 task

Har bir chat sessiyasida `docs/TASKS.md` dan FAQAT BITTA task bajariladi.
Katta task bo'lsa — avval TASKS.md da kichik sub-tasklarga bo'linadi, keyin bittadan bajariladi.
Sessiya cho'zilib kontekst katta bo'lsa — yangi sessiya ochiladi, chunki katta kontekst = katta token sarfi.

## Prompt shabloni (foydalanuvchi uchun)

```
Task: <TASKS.md dagi task raqami yoki matni>
Doira: faqat <fayl/modul>. Boshqa hech narsa.
```

Misol: `Task: 2.3 — bookings CRUD endpointlari. Doira: faqat backend/app/modules/bookings/.`

## Agent uchun sessiya oqimi

1. Taskni o'qi → qaysi hujjat kerakligini AGENTS.md jadvalidan aniqla.
2. Kerakli hujjat + tegishli mavjud kodni o'qi (grep bilan, to'liq emas).
3. Bajar. Yangi dependency kerak bo'lsa — TO'XTA, so'ra.
4. Ishlashini minimal tekshir (build/import xatosi yo'qligi). So'ralmagan test yozma.
5. TASKS.md da `[x]` belgila, 1-3 gap hisobot, to'xta.

## Token tejash taktikalari

- **O'qish**: grep → aniq fayl → aniq qator. "Umumiy tanishish" uchun o'qish yo'q.
- **Yozish**: mavjud faylga edit, chatda kodni takrorlamaslik.
- **Javob**: caveman uslubi (`.cursor/skills/caveman/`).
- **Qidiruv**: keng exploration kerak bo'lsa subagent (explore) ishlatiladi — asosiy kontekst toza qoladi.
- **Xatolar**: xato chiqsa faqat xato qatori atrofini o'qi, butun faylni emas.

## Parallel sessiyalar (4-5+ terminal)

Bir vaqtda bir nechta sessiya ishlatish mumkin, lekin qoidalar bilan (to'liq: `.cursor/rules/parallel-control.mdc`):

- **Lock**: sessiya taskni boshlashda TASKS.md da `[ ]` → `[~]` qiladi. `[~]` turgan taskni boshqa sessiya olmaydi.
- **Ajratish**: parallel tasklar har xil modullarda bo'lishi shart. Masalan: bir sessiya `customers` backend, ikkinchisi `bookings` UI — OK. Ikkalasi ham `bookings` — TAQIQ.
- **Commit**: har task tugagach darhol git commit — bu tiklanish nuqtasi.
- **Terminal o'chib-yonsa**: yangi sessiya holatni `TASKS.md` + `git status` dan tiklaydi, taxmin qilmaydi.

Belgi ma'nolari: `[ ]` ochiq · `[~]` bajarilmoqda (band) · `[x]` tugadi.

## Fazalar tartibi (TASKS.md bilan sinxron)

Phase 0 (tozalash) → Phase 1 (skelet) → Phase 2 (backend core) → Phase 3 (frontend core)
→ Phase 4 (CRM modullari) → Phase 5 (polish/deploy).
Faza tugamasdan keyingi fazaga o'tilmaydi.
