import { getAnalyticsOverview } from "@/lib/analytics";

function BarList({ rows, empty }: { rows: { label: string; count: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  if (!rows.length) return <p className="py-6 text-sm text-tt">{empty}</p>;
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate text-ts">{row.label}</span>
            <span className="font-mono text-xs text-tp">{row.count}</span>
          </div>
          <div className="mt-1.5 h-px bg-line-2">
            <div className="h-px bg-gold" style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsOverview();
  const stats = [
    { label: "Noyob mehmon", value: analytics.uniqueVisitors },
    { label: "Sahifa ko'rish", value: analytics.pageviews },
    { label: "Ichki o'tish", value: analytics.navigations },
  ];

  return (
    <>
      <header>
        <p className="label text-[10px]">Oxirgi 30 kun</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.02em] md:text-5xl">Tashriflar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-[1.6] text-tt">
          Faqat rozilik bergan mehmonlarning umumiy oqimi. IP manzil yoki aniq shaxsiy profil saqlanmaydi.
        </p>
      </header>

      <div className="mt-7 grid grid-cols-3 gap-3 md:mt-9 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[12px] border border-line bg-s1 p-4 md:p-5">
            <p className="label text-[10px]">{stat.label}</p>
            <p className="mt-2 font-display text-3xl text-gold md:text-5xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[16px] border border-line bg-s1 p-5 md:p-6">
          <h2 className="label text-[10px]">Qurilmalar</h2>
          <BarList rows={analytics.devices} empty="Hali rozilikli tashrif yo'q." />
        </section>
        <section className="rounded-[16px] border border-line bg-s1 p-5 md:p-6">
          <h2 className="label text-[10px]">Eng ko&apos;p ko&apos;rilgan sahifalar</h2>
          <BarList rows={analytics.paths} empty="Hali sahifa ko'rilishi yo'q." />
        </section>
      </div>

      <section className="mt-8 rounded-[16px] border border-line bg-s1 p-5 md:p-6">
        <h2 className="label text-[10px]">So&apos;nggi tashriflar</h2>
        {!analytics.recent.length ? (
          <p className="mt-5 text-sm text-tt">Hali rozilikli tashrif yo&apos;q.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {analytics.recent.map((visit, index) => (
              <li
                key={`${visit.lastSeenAt.toISOString()}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 text-sm"
              >
                <span className="text-ts">{visit.device} · {visit.browser} · {visit.os}</span>
                <span className="text-tt">{[visit.city, visit.country].filter(Boolean).join(", ") || "Hudud berilmagan"}</span>
                <time className="font-mono text-[11px] text-tt">{visit.lastSeenAt.toLocaleString("uz-UZ")}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
