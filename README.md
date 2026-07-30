# OBSIDIAN — Ilyos Salayev portfolio

Kinematik shaxsiy portfolio va uni to'liq boshqaradigan admin panel.
Qorong'u rejim, oltin aksent, mobil-birinchi tuzilma.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 ·
Drizzle ORM + SQLite · Zod 4 · jose (JWT sessiya)

---

## Ishga tushirish

```bash
npm install
cp .env.example .env.local
# .env.local ichida SESSION_SECRET ni to'ldiring:
#   openssl rand -base64 32
npm run db:seed     # jadvallarni yaratadi va boshlang'ich kontentni yozadi
npm run dev
```

Sayt: <http://localhost:3000> · Panel: <http://localhost:3000/admin>

Seed yaratadigan birinchi admin `ADMIN_EMAIL` / `ADMIN_PASSWORD` dan olinadi
(`.env.example` da namunasi bor). **Ishlab chiqarishga chiqarishdan oldin
parolni albatta almashtiring.**

## Skriptlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Ishlab chiqarish qurilishi va serveri |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Sxema o'zgarganda migratsiya yaratadi |
| `npm run db:seed` | Bo'sh bazani to'ldiradi (mavjud ma'lumotga tegmaydi) |

## Tuzilma

```
src/
  app/
    (site)/          ommaviy sahifalar — bosh, ishlar, keys, men haqimda,
                     xizmatlar, jurnal, bog'lanish
    admin/
      login/         kirish
      (dash)/        himoyalangan panel: umumiy, loyihalar, xizmatlar,
                     jurnal, xabarlar, sozlamalar
  components/site/   sayt komponentlari
  components/admin/  panel formalari va qobiq
  db/                Drizzle sxemasi, ulanish, seed
  lib/               sessiya, parol, so'rovlar, validatorlar, server aksiyalari
drizzle/             SQL migratsiyalari
data/                SQLite fayli (git'ga kirmaydi)
```

## Dizayn tizimi

Barcha tokenlar `src/app/globals.css` da, Tailwind 4 `@theme` bloki ichida.

Kontrast o'lchangan (fon `#050607`): birlamchi matn **18.2:1**, ikkilamchi
**9.2:1**, uchlamchi **4.9:1** — barchasi WCAG AA dan yuqori.

Shrift juftligi: **Instrument Serif** (display) · **Geist** (interfeys) ·
**Geist Mono** (metadata).

## Kontentni boshqarish

Panelda tahrirlanadi: loyihalar (keys matni, texnologiya, natijalar),
xizmatlar, jurnal yozuvlari, kiruvchi xabarlar va sayt sozlamalari
(bosh sahifa matni, bandlik holati, aloqa havolalari).

Barcha sahifalar `force-dynamic` — panelda saqlangan o'zgarish saytda
darhol ko'rinadi.

## Ma'lum cheklovlar

- **Sessiya cookie'si `Secure` bayrog'ini `NEXT_PUBLIC_SITE_URL` `https://`
  bilan boshlansagina qo'yadi.** Domenga chiqarganda uni to'g'ri qiymatga
  o'rnating, aks holda cookie shifrlanmagan ulanishda ham yuboriladi.
- SQLite bitta fayl — bir vaqtda bitta yozuvchi. Bu hajmdagi sayt uchun
  yetarli; ko'p instansiyali deploy kerak bo'lsa Postgres'ga o'tish lozim.
- Portret rasmlari hozircha CSS bilan chizilgan o'rin egallovchi
  (`components/site/media-frame.tsx`). Haqiqiy suratlar qo'shilganda
  faqat shu komponent o'zgaradi.

### Next.js 16.2 bilan bog'liq ikki chekinish

Kodda ataylab qilingan, izohlangan ikki qaror bor:

1. **Server aksiyalarida `.bind()` ishlatilmaydi.** `useActionState` bilan
   bog'langan aksiya javobini oxirigacha yubormaydi — yozuv bazaga tushadi,
   lekin interfeys abadiy kutadi. Shuning uchun qator `id` si yashirin maydon
   orqali uzatiladi (`src/lib/actions/admin.ts`).
2. **`revalidatePath("/", "layout")` ishlatilmaydi.** Ildiz layoutini bekor
   qilish butun dinamik daraxtni aksiyaning o'z render bosqichi ichida qayta
   renderga majburlaydi va javob oqimi qulflanadi. O'rniga sahifa darajasidagi
   tor bekor qilish qo'llaniladi.
