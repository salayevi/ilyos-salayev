# Implementation state

Oxirgi yangilanish: 2026-08-25 · branch `brand/is-dragon-crimson`

Bu fayl katta spetsifikatsiyaning qaysi qismi **haqiqatan ishlaydi**, qaysi biri
hali yo'q va nima uchun — shuni yozib boradi. "Bajarildi" faqat tekshirilgan
narsa uchun yoziladi.

---

## Bajarildi va tekshirildi

### Baza va production
- Migratsiyalar `0003`–`0005` production'ga qo'llandi. Mavjud ma'lumot
  butunlay saqlandi (6 loyiha, 3 xizmat, 3 mahsulot, 4 maqola, 2 xabar,
  14 sozlama, 1 admin). Barcha migratsiyalar qo'shimcha — `CREATE TABLE`,
  `ADD COLUMN … DEFAULT`, `CREATE INDEX`. Hech qanday `DROP` yo'q.
- Katalog production'ga to'ldirildi: 8 xizmat, 9 qadam, 60 variant.
- `NEXT_PUBLIC_SITE_URL` va `DATABASE_URL` Vercel'da tuzatildi, jonli saytda
  tasdiqlandi.

### Yagona narx tizimi
- `service_catalog` / `pricing_groups` / `pricing_options` / `estimates`.
- Sof funksiya narx mexanizmi (`lib/pricing/engine.ts`), 18 test bilan.
- 9 bosqichli konfigurator, jonli narx, qatorma-qator breakdown.
- `/services` o'chirildi, 301 bilan `/pricing` ga yo'naltiriladi.
- Narxlar `/admin/pricing` dan tahrirlanadi (8 katalog qatori, 60 variant).
- Hisob → lead oqimi: `/hisob/[id]` → aloqa formasi → `/admin/estimates`.

### Xavfsizlik (bu urinishda)
- **Standart admin parol olib tashlandi.** `seed.ts` endi fail-closed:
  `ADMIN_EMAIL` va `ADMIN_PASSWORD` (≥12 belgi) bo'lmasa admin yaratilmaydi
  va sabab aytiladi. `obsidian-2026` hech qayerda qolmadi.
- **Rate limiter doimiy bo'ldi.** Jarayon xotirasidan `rate_limits` jadvaliga
  ko'chirildi. Bitta `INSERT … ON CONFLICT DO UPDATE` — Postgres bir xil
  kalitga yozishni ketma-ketlashtiradi, ya'ni bir millisekundda kelgan ikki
  so'rov ham eskirgan hisobni o'qib, ikkalasi ham "chegara ostida" deb qaror
  qila olmaydi. Baza yetib bo'lmasa `allowed` qaytaradi — limiter mitigatsiya,
  xavfsizlik chegarasi emas.
- **Rezervatsiya atomik bo'ldi.** Rezerv va buyurtma yozuvi bitta
  tranzaksiyada. Ilgari INSERT yiqilsa mahsulot abadiy `reserved` qolardi.
- **Rezervatsiya muddati** (`products.reservedUntil`, 30 daqiqa). Mahsulot
  o'qishlari muddati o'tganini bo'shatadi — cron kerak emas.
- **Buyurtma ↔ inventar sinxronizatsiyasi.** `paid`/`done` → `sold`,
  `declined` → `available`. Buyurtma o'chirilsa rezerv bo'shatiladi, lekin
  `sold` tegilmaydi.

### Regressiyalar
- **Google Fonts olib tashlandi.** `next/font/local`, fayllar
  `src/app/fonts/` da (4 ta woff2, 82 KB). Build endi internetsiz ishlaydi —
  `.next` ichida `fonts.gstatic.com` so'rovi yo'q.
- **`.reveal` endi JS'siz ham ko'rinadi.** CSS yashirishni faqat `html.js`
  bo'lganda qiladi, root layout'dagi inline skript esa 4 soniyalik nazoratchi
  qo'yadi: hydration bo'lmasa hamma element ochiladi.
- **Intro tuzog'i yopildi.** `timeupdate` bo'yicha stall detektor: 8 soniya
  kadr surilmasa yoki `error` bo'lsa sahna avtomatik o'tkazib yuboriladi.
  Escape va skip tugmasi avvaldan bor edi.
- **Bosh sahifadagi "sotuvdagi" sanoq** sotilganlarni hisoblamaydi.
- **README** yangilandi (qirmizi, `/pricing`, fail-closed parol).

### Testlar
31 ta, hammasi o'tadi: narx mexanizmi (18), pul formati (6), inventar
qoidalari (7).

---

## Qilinmadi — aniq ro'yxat

Quyidagilar spetsifikatsiyada bor, lekin bu urinishda **boshlanmadi**.
Hech biri yarim holatda qoldirilmadi — mavjud kod ularsiz izchil ishlaydi.

### Telegram ikki tomonlama Inbox
Yo'q. Kerak bo'ladi: `conversations` / `telegram_messages` jadvallari, webhook
route (secret tekshiruvi + idempotency), deep-link payload, Bot API orqali
javob yuborish, SSE/WebSocket real-time. Hozirgi Telegram integratsiyasi —
faqat bir tomonlama tayyor matn havolasi, u ishlaydi.

### Auth provayderlar
Yo'q. Hozir faqat email+parol admin sessiyasi. Kerak: Google OAuth, Telegram
Login (hash tekshiruvi bilan), email OTP/magic-link, SMS OTP, account linking,
trusted devices, `users`/`roles` jadvallari, RBAC.

### Integratsiya secret boshqaruvi (to'liq)
Qisman. `integration_secrets` jadvali va shifrlash bor
(`lib/integrations.ts`), lekin faqat 3 kalit uchun (GitHub, Vercel,
screenshot). Kerak: setup wizard, "Test connection", rotation, xavfsiz delete,
health, `APP_MASTER_KEY` ga o'tish.

### Desktop (Tauri 2) va Mobile (Expo)
Yo'q. Bitta qator kod ham yozilmadi. Ularni "bor" deb ko'rsatadigan hech narsa
qo'shilmadi.

### Boshqalar
- GitHub/Vercel webhook + reconciliation (hozir faqat qo'lda import).
- Playwright screenshot + SSRF himoyasi (hozir tashqi provider/mShots).
- Comments/reviews moderation.
- Analytics qayta qurish (session/dwell/scroll/funnel).
- Har sahifa uchun alohida ochilish interaksiyasi.
- Hero 134 kadr yuklash strategiyasi (`Save-Data`, lazy).
- Nav scroll xulqi (hozir bor, lekin fokus/pointer qoidasi yo'q).
- CSP/HSTS sarlavhalari.
- E2E testlar.
- Branch tozalash (`cinematic-timeline`, `vercel-agent/canonical-www-redirect`
  hali tekshirilmagan — `0e823e3` dagi redirect commit'ini taqqoslash kerak).

---

## Keyingi urinishda qayerdan davom etish

Auditni qayta boshlash shart emas. Tartib bo'yicha eng qimmatlisi:

1. **Telegram Inbox** — spetsifikatsiyaning markazi va hozir umuman yo'q.
2. **Auth provayderlar** — buyurtma/comment oqimi shunga bog'liq.
3. **Integratsiya wizard** — Telegram tokeni shu yerdan kiritiladi, ya'ni (1)
   uchun old shart.
4. Desktop/Mobile — (1) va (2) tugagach mantiqiy.

## Egadan kerak bo'ladigan ma'lumotlar

Bular hech qanday kod bilan hal qilinmaydi:

- Telegram Bot token (`@BotFather`) va webhook secret.
- Google OAuth client ID/secret.
- SMS provayder kaliti (Eskiz/Play Mobile).
- Apple Developer signing sertifikati — iOS build uchun.
- Android keystore — release AAB uchun.
- `APP_MASTER_KEY` — baza ichidagi secretlarni ochadigan ildiz kalit.
