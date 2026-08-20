/**
 * The starting catalogue.
 *
 * Every figure here is derived from a price Ilyos has actually published, not
 * invented to fill a table:
 *
 *   Qurilish   $4500 dan, 6–12 hafta  -> the web-application base and span
 *   Diagnostika $900 belgilangan       -> kept as the one genuinely fixed service
 *   Hamrohlik  $1200/oy                -> the top monthly care tier
 *   Dog/Wolf   $500 / $1500            -> the landing and business-site bases
 *   Tayyor saytlar $400–$1100          -> the floor the simplest custom work sits above
 *
 * The intermediate rows are interpolated between those anchors. They are a
 * defensible starting point, not a decision — every one is editable from the
 * panel, and this file is only ever read once, to fill an empty database.
 */

export type SeedService = {
  slug: string;
  name: string;
  summary: string;
  description: string;
  kind: "project" | "fixed" | "retainer";
  basePrice: number;
  minimumPrice: number;
  weeksMin: number;
  weeksMax: number;
  includes: string[];
  groups: string[];
  position: number;
};

/** Steps that apply to anything built from scratch. */
const FULL = [
  "size",
  "design",
  "features",
  "backend",
  "integrations",
  "content",
  "animation",
  "delivery",
  "care",
];

/** A landing page has no backend step to answer and no roles to configure. */
const LIGHT = ["size", "design", "features", "content", "animation", "delivery", "care"];

export const SERVICES: SeedService[] = [
  {
    slug: "landing",
    name: "Landing sahifa",
    summary: "Bitta maqsad, bitta sahifa, bitta harakat.",
    description:
      "Mahsulot yoki xizmatni bitta sahifada sotadigan yechim. Tez ishga tushadi va " +
      "reklama trafigini qabul qilishga tayyor bo'ladi.",
    kind: "project",
    basePrice: 500,
    minimumPrice: 400,
    weeksMin: 1,
    weeksMax: 2,
    includes: ["Responsive interfeys", "Aloqa formasi", "SEO poydevori", "Domen va deploy"],
    groups: LIGHT,
    position: 1,
  },
  {
    slug: "business-site",
    name: "Biznes sayt",
    summary: "Kompaniyaning raqamli yuzi — bir necha sahifa, boshqariladigan kontent.",
    description:
      "Xizmatlar, portfolio, jamoa va aloqa sahifalari. Kontentni o'zingiz " +
      "yangilay olasiz, kod tegishi shart emas.",
    kind: "project",
    basePrice: 1500,
    minimumPrice: 1200,
    weeksMin: 2,
    weeksMax: 4,
    includes: ["Custom dizayn", "Kontent boshqaruvi", "SEO", "Analitika", "Deploy"],
    groups: FULL,
    position: 2,
  },
  {
    slug: "store",
    name: "Onlayn do'kon",
    summary: "Katalog, savat, to'lov va buyurtma boshqaruvi.",
    description:
      "Mahsulot katalogi, savat, to'lov tizimi va buyurtmalarni boshqarish paneli. " +
      "Payme va Click integratsiyasi bilan.",
    kind: "project",
    basePrice: 2500,
    minimumPrice: 2000,
    weeksMin: 4,
    weeksMax: 8,
    includes: ["Mahsulot katalogi", "Savat va to'lov", "Buyurtma paneli", "Deploy"],
    groups: FULL,
    position: 3,
  },
  {
    slug: "web-app",
    name: "Web ilova",
    summary: "Biznes mantiqi bor tizim — foydalanuvchilar, ma'lumot, jarayonlar.",
    description:
      "Mahsulotni noldan yoki mavjudining ustiga quraman. Haftalik demo, ochiq " +
      "repozitoriy, hech qanday qora quti yo'q.",
    kind: "project",
    basePrice: 4500,
    minimumPrice: 3500,
    weeksMin: 6,
    weeksMax: 12,
    includes: ["To'liq muhandislik", "Test qoplami", "Hujjatlashtirish", "Bir oylik yordam"],
    groups: FULL,
    position: 4,
  },
  {
    slug: "dashboard",
    name: "Admin panel",
    summary: "Ma'lumotni ko'rish, tahrirlash va boshqarish uchun ichki tizim.",
    description:
      "Jadvallar, filtrlar, rollar va hisobotlar. Mavjud bazaning ustiga ham qurilishi mumkin.",
    kind: "project",
    basePrice: 2800,
    minimumPrice: 2200,
    weeksMin: 4,
    weeksMax: 8,
    includes: ["Rollar va huquqlar", "Jadval va filtrlar", "Auth", "Deploy"],
    groups: FULL,
    position: 5,
  },
  {
    slug: "ai-system",
    name: "AI va avtomatlashtirish",
    summary: "Ovoz, matn va oqim ustida ishlaydigan tizimlar.",
    description:
      "Ovozli agentlar, hujjat qidiruvi, avtomatik jarayonlar. Modelni tanlash va " +
      "xarajatni nazorat qilish ham ish tarkibiga kiradi.",
    kind: "project",
    basePrice: 3500,
    minimumPrice: 2500,
    weeksMin: 4,
    weeksMax: 10,
    includes: ["Model tanlovi", "API integratsiyasi", "Xarajat nazorati", "Deploy"],
    groups: FULL,
    position: 6,
  },
  {
    slug: "mobile-app",
    name: "Mobil ilova",
    summary: "iOS va Android uchun bitta kod bazasi.",
    description:
      "Do'konlarga chiqarish, push bildirishnomalar va backend bilan to'liq bog'lanish.",
    kind: "project",
    basePrice: 6000,
    minimumPrice: 5000,
    weeksMin: 8,
    weeksMax: 16,
    includes: ["iOS va Android", "Backend bog'lanishi", "Do'konga chiqarish"],
    groups: FULL,
    position: 7,
  },
  {
    slug: "diagnostika",
    name: "Diagnostika",
    summary: "Mavjud tizimni ko'rib chiqaman va nima buzilayotganini yozib beraman.",
    description:
      "Kod yozilmaydi — faqat aniqlik. Arxitektura auditi, tezlik profili va yo'l xaritasi " +
      "yozma hisobotda topshiriladi.",
    kind: "fixed",
    basePrice: 900,
    minimumPrice: 900,
    weeksMin: 1,
    weeksMax: 2,
    includes: ["Arxitektura auditi", "Tezlik profili", "Yo'l xaritasi"],
    groups: [],
    position: 8,
  },
];

export type SeedGroup = {
  key: string;
  label: string;
  help: string;
  select: "one" | "many";
  required: boolean;
  position: number;
};

export const GROUPS: SeedGroup[] = [
  { key: "size", label: "Hajm", help: "Nechta sahifa yoki ekran kerak?", select: "one", required: true, position: 1 },
  { key: "design", label: "Dizayn", help: "Tayyor komponentlarmi yoki o'ziga xos vizual yo'nalishmi?", select: "one", required: true, position: 2 },
  { key: "features", label: "Funksiyalar", help: "Keraklisini belgilang. Bog'liq qismlar o'zi qo'shiladi.", select: "many", required: false, position: 3 },
  { key: "backend", label: "Backend", help: "Ma'lumot saqlanadimi, kim kirishini nazorat qilish kerakmi?", select: "one", required: true, position: 4 },
  { key: "integrations", label: "Integratsiyalar", help: "Tashqi xizmatlar. Ularning oylik to'lovi alohida ko'rsatiladi.", select: "many", required: false, position: 5 },
  { key: "content", label: "Kontent", help: "Matn va rasmni kim tayyorlaydi?", select: "one", required: true, position: 6 },
  { key: "animation", label: "Harakat", help: "Sayt qanchalik jonli bo'lsin?", select: "one", required: true, position: 7 },
  { key: "delivery", label: "Muddat", help: "Tezlashtirish ishni zichlashtiradi, arzonlashtirmaydi.", select: "one", required: true, position: 8 },
  { key: "care", label: "Oylik parvarish", help: "Topshirilgandan keyin nima bo'ladi?", select: "one", required: true, position: 9 },
];

export type SeedOption = {
  groupKey: string;
  key: string;
  label: string;
  description?: string;
  mode?: "flat" | "multiplier";
  amount?: number;
  monthly?: number;
  externalMin?: number;
  externalMax?: number;
  weeks?: number;
  /** Basis points scaling the whole timeline. 10000 leaves it alone. */
  weeksFactor?: number;
  requires?: string[];
  conflicts?: string[];
  needsReview?: boolean;
  position: number;
};

export const OPTIONS: SeedOption[] = [
  // ---- size -------------------------------------------------------------
  { groupKey: "size", key: "size-1", label: "1 sahifa", amount: 0, position: 1 },
  { groupKey: "size", key: "size-5", label: "2–5 sahifa", amount: 400, weeks: 1, position: 2 },
  { groupKey: "size", key: "size-10", label: "6–10 sahifa", amount: 900, weeks: 2, position: 3 },
  { groupKey: "size", key: "size-20", label: "11–20 sahifa", amount: 1800, weeks: 3, position: 4 },
  { groupKey: "size", key: "size-xl", label: "20 dan ortiq", amount: 3000, weeks: 4, needsReview: true, position: 5 },

  // ---- design -----------------------------------------------------------
  { groupKey: "design", key: "design-basic", label: "Bazaviy", description: "Toza tartib, standart komponentlar.", amount: 0, position: 1 },
  { groupKey: "design", key: "design-custom", label: "Custom UI/UX", description: "O'ziga xos tartib va komponentlar, brendga moslangan.", amount: 800, weeks: 2, position: 2 },
  { groupKey: "design", key: "design-premium", label: "Premium", description: "To'liq vizual yo'nalish, maxsus grafika, interaktiv tajriba.", amount: 2200, weeks: 3, position: 3 },

  // ---- features ---------------------------------------------------------
  { groupKey: "features", key: "f-contact", label: "Aloqa formasi", amount: 0, position: 1 },
  { groupKey: "features", key: "f-search", label: "Qidiruv", amount: 250, requires: ["be-crud"], position: 2 },
  { groupKey: "features", key: "f-filters", label: "Filtrlar", amount: 300, requires: ["be-crud"], position: 3 },
  { groupKey: "features", key: "f-blog", label: "Blog", amount: 350, requires: ["be-cms"], position: 4 },
  { groupKey: "features", key: "f-auth", label: "Foydalanuvchi kabineti", amount: 500, weeks: 1, requires: ["be-auth"], conflicts: ["be-none"], position: 5 },
  { groupKey: "features", key: "f-admin", label: "Admin panel", amount: 700, weeks: 1, requires: ["be-auth"], conflicts: ["be-none"], position: 6 },
  { groupKey: "features", key: "f-roles", label: "Rollar va huquqlar", amount: 450, requires: ["f-auth"], position: 7 },
  { groupKey: "features", key: "f-payments", label: "To'lov qabul qilish", amount: 600, weeks: 1, requires: ["be-crud"], conflicts: ["be-none"], position: 8 },
  { groupKey: "features", key: "f-subscription", label: "Obuna to'lovlari", amount: 500, requires: ["f-payments"], position: 9 },
  { groupKey: "features", key: "f-booking", label: "Bron qilish", amount: 550, requires: ["be-crud"], position: 10 },
  { groupKey: "features", key: "f-chat", label: "Chat", amount: 700, weeks: 1, requires: ["be-realtime"], position: 11 },
  { groupKey: "features", key: "f-notify", label: "Bildirishnomalar", amount: 350, requires: ["be-crud"], position: 12 },
  { groupKey: "features", key: "f-upload", label: "Fayl yuklash", amount: 300, requires: ["be-crud"], position: 13 },
  { groupKey: "features", key: "f-reviews", label: "Sharhlar va reyting", amount: 400, requires: ["be-crud"], position: 14 },
  { groupKey: "features", key: "f-multilang", label: "Ko'p tillilik", amount: 600, weeks: 1, position: 15 },
  { groupKey: "features", key: "f-analytics", label: "Analitika paneli", amount: 450, requires: ["be-crud"], position: 16 },
  { groupKey: "features", key: "f-realtime", label: "Real vaqt ma'lumoti", amount: 800, weeks: 1, requires: ["be-realtime"], position: 17 },
  { groupKey: "features", key: "f-custom", label: "Boshqa — tavsiflab beraman", description: "Yakuniy narx suhbatdan keyin aniqlanadi.", amount: 800, needsReview: true, position: 18 },

  // ---- backend ----------------------------------------------------------
  { groupKey: "backend", key: "be-none", label: "Backend kerak emas", description: "Statik sayt, ma'lumot saqlanmaydi.", amount: 0, position: 1 },
  { groupKey: "backend", key: "be-cms", label: "Kontent boshqaruvi", description: "Matn va rasmni o'zingiz yangilaysiz.", amount: 500, weeks: 1, position: 2 },
  { groupKey: "backend", key: "be-crud", label: "Baza va API", description: "Ma'lumot saqlanadi, o'qiladi va yangilanadi.", amount: 900, weeks: 2, position: 3 },
  { groupKey: "backend", key: "be-auth", label: "Auth va rollar", description: "Kim kirishi va nima qila olishi nazorat qilinadi.", amount: 1400, weeks: 2, requires: ["be-crud"], position: 4 },
  { groupKey: "backend", key: "be-realtime", label: "Real vaqt tizimi", description: "Sahifani yangilamasdan o'zgarishlar ko'rinadi.", amount: 2200, weeks: 3, requires: ["be-crud"], position: 5 },
  { groupKey: "backend", key: "be-complex", label: "Murakkab arxitektura", description: "Ko'p servis, navbatlar, tashqi tizimlar.", amount: 3500, weeks: 4, needsReview: true, position: 6 },

  // ---- integrations -----------------------------------------------------
  { groupKey: "integrations", key: "i-telegram", label: "Telegram", amount: 200, position: 1 },
  { groupKey: "integrations", key: "i-email", label: "Email yuborish", amount: 150, externalMin: 0, externalMax: 15, position: 2 },
  { groupKey: "integrations", key: "i-sms", label: "SMS", amount: 200, externalMin: 10, externalMax: 50, position: 3 },
  { groupKey: "integrations", key: "i-payme", label: "Payme", amount: 350, position: 4 },
  { groupKey: "integrations", key: "i-click", label: "Click", amount: 350, position: 5 },
  { groupKey: "integrations", key: "i-stripe", label: "Stripe", amount: 300, position: 6 },
  { groupKey: "integrations", key: "i-maps", label: "Xaritalar", amount: 200, externalMin: 0, externalMax: 20, position: 7 },
  { groupKey: "integrations", key: "i-analytics", label: "Analitika xizmati", amount: 150, position: 8 },
  { groupKey: "integrations", key: "i-ai", label: "AI model (OpenAI / Claude)", amount: 600, externalMin: 20, externalMax: 200, weeks: 1, position: 9 },
  { groupKey: "integrations", key: "i-crm", label: "CRM yoki ERP", amount: 800, weeks: 1, needsReview: true, position: 10 },
  { groupKey: "integrations", key: "i-custom", label: "Boshqa API", amount: 400, needsReview: true, position: 11 },

  // ---- content ----------------------------------------------------------
  { groupKey: "content", key: "c-client", label: "Kontent mendan", description: "Matn va rasmni siz berasiz.", amount: 0, position: 1 },
  { groupKey: "content", key: "c-format", label: "Joylashtirish kerak", description: "Kontent bor, lekin tartibga solish kerak.", amount: 250, position: 2 },
  { groupKey: "content", key: "c-copy", label: "Matn yozish kerak", amount: 600, weeks: 1, position: 3 },
  { groupKey: "content", key: "c-full", label: "Matn va grafika", description: "Yozish, rasm tanlash va maxsus grafika.", amount: 1200, weeks: 2, position: 4 },
  { groupKey: "content", key: "c-migration", label: "Katta ma'lumot ko'chirish", amount: 900, needsReview: true, position: 5 },

  // ---- animation --------------------------------------------------------
  { groupKey: "animation", key: "a-none", label: "Minimal", amount: 0, position: 1 },
  { groupKey: "animation", key: "a-micro", label: "Mikro-interaksiyalar", description: "Hover, o'tish, fokus holatlari.", amount: 250, position: 2 },
  { groupKey: "animation", key: "a-advanced", label: "Kengaytirilgan harakat", description: "Scroll bo'yicha ochilish, sahifa o'tishlari.", amount: 700, weeks: 1, position: 3 },
  { groupKey: "animation", key: "a-cinematic", label: "Kinematik", description: "Scroll bilan boshqariladigan ketma-ketlik, maxsus intro.", amount: 1800, weeks: 2, position: 4 },

  // ---- delivery ---------------------------------------------------------
  { groupKey: "delivery", key: "d-normal", label: "Odatiy", description: "Rejalashtirilgan muddat.", mode: "flat", amount: 0, position: 1 },
  { groupKey: "delivery", key: "d-priority", label: "Ustuvor", description: "Navbatda birinchi, muddat ~20% qisqaradi.", mode: "multiplier", amount: 11_500, weeksFactor: 8_000, position: 2 },
  { groupKey: "delivery", key: "d-urgent", label: "Shoshilinch", description: "Boshqa ishlar to'xtaydi. Muddat ~40% qisqaradi.", mode: "multiplier", amount: 13_500, weeksFactor: 6_000, position: 3 },

  // ---- care -------------------------------------------------------------
  { groupKey: "care", key: "care-none", label: "Kerak emas", description: "Topshirilgandan keyin o'zingiz yuritasiz.", amount: 0, position: 1 },
  { groupKey: "care", key: "care-basic", label: "Bazaviy", description: "Hosting nazorati, zaxira, xavfsizlik yangilanishlari.", monthly: 120, position: 2 },
  { groupKey: "care", key: "care-pro", label: "Professional", description: "Bazaviy + xatolarni tuzatish, kontent yangilash, oylik hisobot.", monthly: 350, position: 3 },
  { groupKey: "care", key: "care-business", label: "Biznes", description: "Professional + kichik yangi funksiyalar, ustuvor javob.", monthly: 700, position: 4 },
  { groupKey: "care", key: "care-partner", label: "Hamrohlik", description: "Jamoangiz bilan yonma-yon — kod ko'rigi, arxitektura qarorlari, chaqiruv bo'yicha.", monthly: 1200, position: 5 },
];

/**
 * Hosting and a domain are not optional and not mine, so they are stated once
 * as a floor rather than attached to an option somebody might not tick.
 */
export const BASE_EXTERNAL = { min: 5, max: 25 };
