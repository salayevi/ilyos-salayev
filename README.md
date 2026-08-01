# OBSIDIAN — Ilyos Salayev portfolio

Kinematik shaxsiy portfolio va uni to'liq boshqaradigan admin panel.
Qorong'u rejim, oltin aksent, mobil-birinchi tuzilma.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 ·
Drizzle ORM + PostgreSQL · Zod 4 · jose (JWT sessiya)

---

## Ishga tushirish

```bash
npm install
cp .env.example .env.local
# .env.local ichida to'ldiring:
#   SESSION_SECRET  — openssl rand -base64 32
#   DATABASE_URL    — postgresql://user:parol@localhost:5432/portfolio
npm run db:migrate  # jadvallarni yaratadi
npm run db:seed     # boshlang'ich kontentni yozadi
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
| `npm run db:migrate` | Migratsiyalarni bazaga qo'llaydi |
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
  db/                Drizzle sxemasi (pg-core), ulanish, seed
  lib/               sessiya, parol, so'rovlar, validatorlar, server aksiyalari
drizzle/             SQL migratsiyalari
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
- Vaqt ustunlari `timestamptz`, ya'ni sana formatlash foydalanuvchi
  brauzerining mintaqasiga tayanadi.
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

### PostgreSQL sozlash eslatmasi

Rol `NOLOGIN` bilan yaratilgan bo'lsa ilova ulana olmaydi. Superuser sifatida:

```sql
ALTER ROLE portfolio_user LOGIN;
GRANT ALL ON SCHEMA public TO portfolio_user;  -- PG15+ da majburiy
```

---

## Kinematik hero (scroll-scrub)

Bosh sahifadagi birinchi ekran — video emas, **kadrlar ketma-ketligi**. Vaqtni
foydalanuvchi boshqaradi: scroll pozitsiyasi to'g'ridan-to'g'ri kadr indeksiga
bog'langan. Scroll to'xtasa, sahna aynan o'sha kadrda qotadi; orqaga scroll
qilinsa, animatsiya ham orqaga qaytadi. Avtomatik ijro yo'q.

**Aktivlar.** `public/hero/hd` (1280×720, 134 kadr, 3.6 MB) va `public/hero/sd`
(720×405, 1.5 MB). Manba videodan qayta yaratish:

```bash
FF=$(node -p "require('ffmpeg-static')")
"$FF" -v error -i manba.mp4 -vsync 0 /tmp/f/%04d.png
for f in /tmp/f/*.png; do n=$(basename "$f" .png)
  cwebp -quiet -q 76 -resize 1280 0 "$f" -o public/hero/hd/$n.webp
  cwebp -quiet -q 70 -resize 720 0 "$f" -o public/hero/sd/$n.webp
done
```
Keyin `public/hero/manifest.json` dagi `total` ni yangilang.

**Arxitektura sabablari.** Har biri ataylab tanlangan:

- **Canvas 2D, WebGL emas.** Kontent — tekis kadr ketma-ketligi; WebGL har
  kadrda tekstura yuklashni qo'shadi va vizual yutuq bermaydi.
- **`HTMLImageElement`, `ImageBitmap` emas.** 1280×720 RGBA bitta kadrda
  3.7 MB joy egallaydi — 134 kadr ~500 MB bo'lib, mobil brauzerni o'ldiradi.
  Image obyekti faqat siqilgan baytlarni ushlaydi va dekodlangan nusxani
  brauzerning o'zi xotira bosimida tozalaydi.
- **Ikki bosqichli yuklash.** Avval har 8-kadr — scrub bir necha yuz millisekundda
  ishlay boshlaydi; keyin oraliqlar, har doim playhead'ga eng yaqinidan.
  Kerakli kadr hali kelmagan bo'lsa, eng yaqin tayyor kadr chiziladi — kanvas
  hech qachon bo'sh qolmaydi.
- **Dekodlash oynasi.** Playhead atrofidagi ±12 kadr oldindan `decode()`
  qilinadi, shuning uchun yetib borilganda rasterlash kutilmaydi.
- **Interfeys DOM orqali yangilanadi.** Har kadrda `setState` chaqirish sekundiga
  60 marta React render qilar va kadr byudjetini yeb qo'yardi.
- **GSAP ScrollTrigger ishlatilmadi.** Bu yerda kerak bo'lgani — bitta rAF sikli,
  inersiyali playhead va yuklash navbati; kutubxona qo'shimcha bayt olib kelib,
  lerp ustidan nazoratni kamaytirardi.

**Ovoz.** Yozib olingan trek emas — Web Audio'da sintez qilinadi. Sabab: fayl
o'rtasida to'xtatilgan musiqa buzilgandek eshitiladi. Bu yerda garmoniya,
filtr va oktava scroll **pozitsiyasining** funksiyasi, shuning uchun to'xtasangiz
tovush ham aynan o'sha yerda qotadi — uni oldinga suradigan soat yo'q. Shamol
qatlami scroll **tezligiga** bog'langan. Brauzerlar avtoijroni bloklagani uchun
ovoz «Ovoz» tugmasi bosilgandan keyin yonadi.

**Qisqartirilgan harakat.** `prefers-reduced-motion: reduce` yoqilgan bo'lsa
scrub butunlay o'chadi va bitta statik kadr ko'rsatiladi.
