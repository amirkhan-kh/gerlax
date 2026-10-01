# Frontend — Next.js App Router arxitekturasi

Stack: Next.js (oxirgi stable, App Router, `src/` layout, Turbopack dev) + TypeScript + Tailwind CSS.
Yaratish: `pnpm create next-app frontend --ts --tailwind --app --src-dir --no-eslint --turbopack`.

Tamoyil (nextjs.org tavsiyasi): **`app/` faqat routing va kompozitsiya** — business logic va UI
route ichida `_components/` da yoki `src/` qatlamlarida yashaydi.

## Papka tuzilishi

```
frontend/src/
  app/
    layout.tsx                 # root layout
    (auth)/
      login/page.tsx
    (dashboard)/               # sidebar layout guruhi
      layout.tsx               # sidebar + header
      page.tsx                 # dashboard (statistika)
      customers/
        page.tsx               # ro'yxat
        [id]/page.tsx          # detal
        _components/           # faqat shu route komponentlari
      bookings/
        page.tsx
        [id]/page.tsx
        _components/
      payments/page.tsx
      tasks/page.tsx
  components/
    ui/                        # umumiy primitivlar: button, input, table, badge, dialog
    layout/                    # sidebar, header
  lib/
    api.ts                     # backendga fetch wrapper (cookie bilan)
    types.ts                   # API tiplar (backend sxemalariga mos)
    utils.ts
  actions/                     # Server Actions (mutatsiyalar), modul bo'yicha fayl
    bookings.ts
    customers.ts
```

## Qoidalar (batafsil: .cursor/rules/frontend.mdc)

- Server Component default; data fetch server-da `lib/api.ts` orqali; mutatsiya Server Action.
- Route-ga xos komponent `_components/` da qoladi; faqat 2+ joyda kerak bo'lsa `components/` ga ko'chadi.
- `loading.tsx` / `error.tsx` faqat so'ralgan sahifalarda.
- Auth: middleware.ts cookie tekshiradi, login sahifasiga redirect.

## Ishga tushirish

```bash
cd frontend && pnpm dev   # :3000, backend :8000 ga NEXT_PUBLIC_API_URL orqali
```
