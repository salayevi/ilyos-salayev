import { db } from "./index";
import { admins, messages, posts, projects, services, settings, testimonials } from "./schema";
import { hashPassword } from "../lib/password";

const PROJECTS = [
  {
    slug: "altron",
    title: "Altron",
    summary: "Menyu satrida yashaydigan lokal SI yordamchisi.",
    category: "Tizim",
    year: "2025",
    role: "Arxitektura · Muhandislik",
    client: "Ichki mahsulot",
    tone: "gold",
    overview:
      "Python orkestratsiya qiladi, Rust audio oqimini, C++ esa xotira indeksini oladi. Uchala til bitta jarayonda, aniq chegaralar bilan yashaydi.",
    problem:
      "Elektron ilovalar 400 MB RAM yeydi va mikrofonni doimiy band qiladi. Menyu satrida turadigan yordamchi sezilmasligi kerak — aks holda foydalanuvchi uni birinchi kuni o'chiradi.",
    research:
      "Uchta mavjud yordamchining xotira va CPU profilini o'lchadim. Hammasida to'siq bir xil chiqdi: audio halqasi bilan mantiq bitta ip ustida ishlaydi.",
    solution:
      "Issiq yo'llarni mahalliy kodga ko'chirdim. Audio halqa Rustda, GIL ga umuman tegmaydi; xotira indeksi C++ da; Python faqat qaror qabul qiladi.",
    process:
      "Avval profil, keyin chegara, keyin ko'chirish. Har bir ko'chirishdan keyin bir xil o'lchov takrorlandi — taxminga o'rin qolmadi.",
    stack: JSON.stringify(["Python", "Rust", "C++", "Tauri", "CoreAudio"]),
    metrics: JSON.stringify([
      { value: "38 MB", label: "Xotira izi" },
      { value: "12 ms", label: "Audio kechikish" },
      { value: "0", label: "Kadr yo'qolishi" },
    ]),
    featured: true,
    position: 1,
  },
  {
    slug: "obunazona",
    title: "ObunaZona",
    summary: "Obuna mahsulotlari uchun marketpleys, to'liq boshqaruv paneli bilan.",
    category: "Mahsulot",
    year: "2025",
    role: "Bosh muhandis",
    client: "ObunaZona",
    tone: "azure",
    overview:
      "Admin va SuperAdmin panellari, real autentifikatsiya, sessiyalar va rollar. Interfeys to'liq a11y auditidan o'tgan.",
    problem:
      "Zustand holati sahifa yuklanishida serverdagi HTML bilan to'qnashardi. Panel bir soniya davomida noto'g'ri ma'lumot ko'rsatib turardi — bu esa moliyaviy sahifada qabul qilib bo'lmaydigan xato.",
    research:
      "Poygani takrorlash uchun sekin tarmoq profilida yozib oldim. Muammo har doim bitta joyda: store hydration tugamasdan komponent o'qiyapti.",
    solution:
      "Har bir iste'molchi hydration tugaguncha gate qilindi. skipHydration yolg'iz yetarli emasligi shu yerda aniqlandi — u faqat store tomonini hal qiladi, iste'molchini emas.",
    process:
      "Besh bosqich: modellar, auth, panel, a11y, tozalash. Har bosqich oxirida ochiq demo.",
    stack: JSON.stringify(["Next.js", "NestJS", "PostgreSQL", "Zustand", "Tailwind"]),
    metrics: JSON.stringify([
      { value: "5", label: "Bosqich yakuni" },
      { value: "0", label: "Hydration xatosi" },
      { value: "AA", label: "a11y darajasi" },
    ]),
    featured: true,
    position: 2,
  },
  {
    slug: "raqamli-suhbatdosh",
    title: "Raqamli Suhbatdosh",
    summary: "Bitta portretdan ovoz personasini quradigan real vaqt agenti.",
    category: "SI",
    year: "2026",
    role: "Arxitektura · Muhandislik",
    client: "Ichki mahsulot",
    tone: "green",
    overview:
      "Foydalanuvchi portret yuklaydi. Tizim yuzdan yosh va tembr belgilarini chiqarib, mos ovoz personasini yig'adi — so'ng real vaqtda gaplashadi.",
    problem:
      "Silero bitta spikerni beradi. Ovozni personaga moslash uchun balandlikni surish kerak, lekin ±3 yarim tondan oshsa ovoz sun'iy eshitiladi va ishonch yo'qoladi.",
    research:
      "Qirq kishilik korpusda balandlik surilishining qabul qilinish chegarasini o'lchadim. Chegara barcha yosh guruhlarida ±3 atrofida turg'un chiqdi.",
    solution:
      "Persona paketi balandlikni ±3 yarim ton bilan cheklaydi, TRUE_AEC aks-sadoni bostiradi, ega ovozi profili esa suhbatdoshni ajratadi.",
    process:
      "O'n bosqich, har birida avtotest. Ovoz sifati quloq bilan emas, takrorlanadigan o'lchov bilan baholandi.",
    stack: JSON.stringify(["Python", "Silero TTS", "Whisper", "WebRTC AEC", "PyTorch", "pytest"]),
    metrics: JSON.stringify([
      { value: "143", label: "O'tgan test" },
      { value: "±3", label: "Yarim ton chegara" },
      { value: "10", label: "Bosqich yakuni" },
    ]),
    featured: true,
    position: 3,
  },
  {
    slug: "sensor-mesh",
    title: "Sensor Mesh",
    summary: "Dala sensorlaridan telemetriya yig'adigan va uzilishni oldindan aytadigan tarmoq.",
    category: "Tizim",
    year: "2024",
    role: "Backend muhandis",
    client: "Agro hamkor",
    tone: "azure",
    overview: "Ikki yarim ming qurilma, bitta yig'uvchi va bashorat qiluvchi model.",
    problem:
      "Qishloq joyida ulanish soatlab uziladi. Ma'lumot yo'qolsa, kunlik hisobot yaroqsiz bo'ladi.",
    research: "Uch oylik uzilish jurnalini tahlil qildim: uzilishlarning 80% i 40 daqiqadan qisqa.",
    solution:
      "Qurilmada navbat, ulanish tiklanganda ketma-ket yuborish va server tomonda idempotent qabul. Qayta yuborish hech qachon dublikat yaratmaydi.",
    process: "Avval dala sinovi, keyin ishlab chiqarish. Har bir qurilma o'z jurnalini olib yuradi.",
    stack: JSON.stringify(["Go", "MQTT", "TimescaleDB", "Grafana"]),
    metrics: JSON.stringify([
      { value: "99.9%", label: "Uptime" },
      { value: "2 400", label: "Qurilma" },
      { value: "0", label: "Yo'qolgan yozuv" },
    ]),
    featured: false,
    position: 4,
  },
  {
    slug: "nota",
    title: "Nota",
    summary: "Agentlar uchun uzoq muddatli xotira — eskirgan faktni o'zi arxivlaydi.",
    category: "SI",
    year: "2024",
    role: "Mustaqil muhandis",
    client: "Ochiq kod",
    tone: "gold",
    overview: "Bir fakt — bir fayl. Qidiruv gibrid: to'liq matn va vektor bitta reytingda.",
    problem:
      "Sof vektor qidiruv aniq nomlarni topa olmasdi. Foydalanuvchi fayl nomini yozganda javob bo'sh kelardi — bu esa xotira tizimi uchun o'lim.",
    research:
      "Yuz so'rovlik to'plamda ikki usulni yonma-yon o'lchadim. Vektor semantikada, FTS aniqlikda yutardi.",
    solution:
      "To'liq matnli indeks va vektor o'xshashligi bitta reyting funksiyasida birlashtirildi. Og'irlik so'rov uzunligiga qarab siljiydi.",
    process: "Har bir o'zgarish oldin o'lchov to'plamida sinaldi, keyin qo'shildi.",
    stack: JSON.stringify(["Python", "SQLite", "FTS5", "sentence-transformers"]),
    metrics: JSON.stringify([
      { value: "31 ms", label: "Qidiruv medianasi" },
      { value: "94%", label: "Recall@5" },
      { value: "1 fayl", label: "Bir fakt" },
    ]),
    featured: false,
    position: 5,
  },
  {
    slug: "qadam",
    title: "Qadam",
    summary: "O'zbek tilidagi kurslar platformasi — video, topshiriq va sertifikat oqimi.",
    category: "Mahsulot",
    year: "2023",
    role: "Backend muhandis",
    client: "Qadam",
    tone: "violet",
    overview: "Olti ming talaba, to'lov va sertifikat bitta oqimda.",
    problem:
      "Talabalar uchinchi darsdan keyin tashlab ketardi. Jarayonda ko'rinadigan yutuq yo'q edi — faqat uzun video ro'yxati.",
    research:
      "Tashlab ketganlarning ellik nafari bilan suhbat. Umumiy javob: «qayerdaligimni bilmayman».",
    solution:
      "Har bir darsdan keyin qisqa amaliy topshiriq va ko'rinadigan progress chizig'i qo'shildi. Sertifikat endi qadamma-qadam to'ladi.",
    process: "A/B sinov ikki oy davom etdi, natija barqaror bo'lgach to'liq yoyildi.",
    stack: JSON.stringify(["React", "Node.js", "PostgreSQL", "Stripe"]),
    metrics: JSON.stringify([
      { value: "+41%", label: "Tugatish darajasi" },
      { value: "6 200", label: "Talaba" },
      { value: "4.7", label: "O'rtacha baho" },
    ]),
    featured: false,
    position: 6,
  },
];

const SERVICES = [
  {
    title: "Diagnostika",
    duration: "1–2 hafta",
    description:
      "Mavjud tizimni ko'rib chiqaman va nima buzilayotganini yozma hisobotda beraman. Kod yozilmaydi — faqat aniqlik.",
    features: JSON.stringify(["Arxitektura auditi", "Tezlik profili", "Yo'l xaritasi"]),
    priceNote: "Belgilangan narx",
    highlighted: false,
    position: 1,
  },
  {
    title: "Qurilish",
    duration: "6–12 hafta",
    description:
      "Mahsulotni noldan yoki mavjudining ustiga quraman. Haftalik demo, ochiq repozitoriy, hech qanday qora quti yo'q.",
    features: JSON.stringify([
      "To'liq muhandislik",
      "Test qoplami",
      "Hujjatlashtirish",
      "Bir oylik qo'llab-quvvatlash",
    ]),
    priceNote: "Bosqichma-bosqich",
    highlighted: true,
    position: 2,
  },
  {
    title: "Hamrohlik",
    duration: "Oylik",
    description:
      "Jamoangiz bilan yonma-yon ishlayman — kod ko'rigi, arxitektura qarorlari, chaqiruv bo'yicha yordam.",
    features: JSON.stringify(["Kod ko'rigi", "Arxitektura qarorlari", "Chaqiruv bo'yicha"]),
    priceNote: "Oylik to'lov",
    highlighted: false,
    position: 3,
  },
];

const POSTS = [
  {
    slug: "hydration-poygasini-toxtatish",
    title: "Hydration poygasini qanday to'xtatdim",
    excerpt:
      "skipHydration yolg'iz yetarli emas. Muammo store tomonida emas, iste'molchi tomonida.",
    topic: "Zustand · Next.js",
    readMinutes: 8,
    body: "Zustand persist bilan ishlaganda store o'zini serverda ham, brauzerda ham tiklashga urinadi.\n\nskipHydration store tomonini to'xtatadi, lekin komponent baribir birinchi renderda bo'sh holatni o'qiydi va uni ekranga chizadi. Foydalanuvchi bir kadr davomida noto'g'ri raqamni ko'radi.\n\nYechim: har bir iste'molchini useHasMounted bilan gate qilish. Store tayyor bo'lgunicha komponent skelet chizadi.",
  },
  {
    slug: "silero-persona",
    title: "Silero bilan bitta spikerdan persona qurish",
    excerpt: "Balandlikni ±3 yarim tondan ko'proq surish ovozni sun'iy qiladi. Chegarani hurmat qiling.",
    topic: "Ovoz · TTS",
    readMinutes: 12,
    body: "Silero bitta spikerni beradi. Undan bir nechta persona yasash uchun balandlik va tezlikni o'zgartirish kerak.\n\nQirq kishilik korpusda o'lchadim: ±3 yarim tondan oshganda tinglovchilar ovozni «robot» deb belgilay boshlaydi. Bu chegara yosh guruhlari bo'ylab turg'un.\n\nShuning uchun persona paketi balandlikni qattiq cheklaydi va qolgan farqni tezlik hamda pauza naqshi bilan beradi.",
  },
  {
    slug: "rust-python-chegarasi",
    title: "Rust va Python o'rtasidagi chegara qayerda",
    excerpt: "Javob profilda, e'tiqodda emas.",
    topic: "Arxitektura",
    readMinutes: 9,
    body: "Gibrid arxitekturada eng qimmat xato — chegarani noto'g'ri joyga qo'yish.\n\nQoida oddiy: chegara ma'lumot oqimi eng tor bo'lgan joyda turishi kerak. Agar chegaradan sekundiga million marta o'tilsa, siz yutgan tezlikni serializatsiyaga qaytarasiz.\n\nAltronda chegara audio bufer darajasida turadi: Rust to'liq halqani oladi, Pythonga faqat qaror uchun xulosa chiqadi.",
  },
  {
    slug: "agent-xotirasi",
    title: "Agent xotirasi: vektor yetarli emas",
    excerpt: "Foydalanuvchi aniq nom yozganda vektor qidiruv jim qoladi.",
    topic: "Xotira · Qidiruv",
    readMinutes: 6,
    body: "Vektor qidiruv semantikada zo'r, aniqlikda zaif.\n\n«config.yaml dagi portni ko'rsat» degan so'rovda foydalanuvchi aniq satrni biladi. Vektor esa «sozlama», «server», «tarmoq» kabi yaqin hujjatlarni qaytaradi.\n\nGibrid reyting buni hal qiladi: so'rov qisqa va aniq bo'lsa FTS og'irligi oshadi, uzun va tavsifiy bo'lsa vektor og'irligi oshadi.",
  },
];

async function main() {
  const existing = await db.select().from(projects);
  if (existing.length > 0) {
    console.log("Seed o'tkazib yuborildi — bazada allaqachon ma'lumot bor.");
    console.log("Qayta seed qilish uchun avval data/portfolio.db faylini o'chiring.");
    return;
  }

  const email = process.env.ADMIN_EMAIL ?? "salayevi782@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "obsidian-2026";

  await db.insert(admins)
    .values({ email, name: "Ilyos Salayev", passwordHash: hashPassword(password) })
    ;

  await db.insert(projects).values(PROJECTS);
  await db.insert(services).values(SERVICES);
  await db.insert(posts).values(POSTS);

  await db.insert(testimonials)
    .values([
      {
        quote: "Ilyos murakkab tizimni oddiy ko'rinadigan qilib yechadi. Kod emas, natija yetkazadi.",
        author: "Aziz R.",
        roleLine: "CTO, ObunaZona",
        position: 1,
      },
      {
        quote:
          "Dala sinovida bitta yozuv ham yo'qolmadi. Bu men ishlagan birinchi telemetriya tizimi bo'ldi.",
        author: "Sardor N.",
        roleLine: "Operatsiyalar rahbari, Agro hamkor",
        position: 2,
      },
    ])
    ;

  await db.insert(messages)
    .values([
      {
        name: "Nodira K.",
        email: "nodira@example.uz",
        body: "Salom! Bizda ovozli buyurtma qabul qiluvchi bot kerak. Q3 da boshlash mumkinmi?",
      },
    ])
    ;

  const defaults: Record<string, string> = {
    availability: "open",
    availabilityLabel: "Q3 2026 uchun ochiq",
    heroEyebrow: "Sun'iy intellekt muhandisi · Toshkent",
    heroLine1: "Fikrlaydigan",
    heroLine2: "tizimlar",
    heroAccent: "quraman.",
    heroSubline:
      "Ovoz, xotira va real vaqt oqimlari ustida ishlaydigan mahsulotlar. Python orkestratsiya, Rust va C++ issiq yo'llar.",
    aboutTitle: "Men muammoni kodga emas, natijaga aylantiraman.",
    aboutBody:
      "Olti yildan beri ovoz, xotira va real vaqt tizimlari ustida ishlayman. Ko'p vaqtimni tezlik va aniqlik o'rtasidagi chegarani topishga sarflayman — chunki foydalanuvchi ikkalasini ham sezadi.\n\nToshkentda yashayman, masofadan ishlayman. O'zbek, rus va ingliz tillarida.",
    email,
    telegram: "@ilyos",
    github: "https://github.com/salayevi",
    linkedin: "https://linkedin.com/in/ilyos-salayev",
    location: "Toshkent",
  };

  await db.insert(settings)
    .values(Object.entries(defaults).map(([key, value]) => ({ key, value })))
    ;

  console.log("Seed tayyor.");
  console.log(`  Admin: ${email}`);
  console.log(`  Parol: ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
