import Link from "next/link";

import { getAnalyticsOverview } from "@/lib/analytics";
import { ORDER_STATUS_LABELS, formatMoney } from "@/lib/format";
import {
  getCatalog,
  getMessages,
  getOrders,
  getPosts,
  getProducts,
  getProjects,
  getSettings,
} from "@/lib/queries";

export default async function AdminHome() {
  const [projects, products, catalog, posts, inbox, orders, s, analytics] = await Promise.all([
    getProjects(),
    getProducts(),
    getCatalog(),
    getPosts(),
    getMessages(),
    getOrders(),
    getSettings(),
    getAnalyticsOverview(),
  ]);

  const openOrders = orders.filter(
    (o) => o.status !== "done" && o.status !== "declined" && o.status !== "expired",
  );
  const forSale = products.filter((p) => p.status === "available" && p.published);

  const stats = [
    {
      label: "Men qilganlarim",
      value: projects.length,
      sub: `${projects.filter((p) => p.previewImage).length} ta screenshot bilan`,
      href: "/admin/projects",
    },
    {
      label: "Sotuvdagi saytlar",
      value: forSale.length,
      sub: `${products.filter((p) => p.status === "sold").length} ta sotilgan`,
      href: "/admin/store",
    },
    {
      label: "Buyurtmalar",
      value: openOrders.length,
      sub: `${orders.length} ta jami`,
      href: "/admin/orders",
    },
    {
      label: "Xabarlar",
      value: inbox.length,
      sub: `${inbox.filter((m) => !m.read).length} o'qilmagan`,
      href: "/admin/messages",
    },
    {
      label: "Mehmonlar",
      value: analytics.uniqueVisitors,
      sub: "30 kun · rozilik bilan",
      href: "/admin/analytics",
    },
  ];

  return (
    <>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Umumiy</h1>
        <span className="label text-[10px]">{s.availabilityLabel}</span>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-5 md:gap-4">
        {stats.map((st) => (
          <Link
            key={st.label}
            href={st.href}
            className="rounded-[12px] border border-line bg-s1 p-4 transition-colors hover:border-line-3 md:p-5"
          >
            <p className="label text-[10px]">{st.label}</p>
            <p className="mt-2 font-display text-4xl text-accent-text md:text-5xl">{st.value}</p>
            <p className="mt-1 text-xs text-tt">{st.sub}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8 md:mt-10">
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
          <h2 className="label text-[10px]">Oxirgi buyurtmalar</h2>
          <Link href="/admin/orders" className="text-[13px] text-accent-text hover:text-crimson-100">
            Hammasi &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="py-8 text-sm text-tt">
            Hozircha buyurtma yo&apos;q. Xizmat tariflariga narx qo&apos;ying va tayyor
            saytlarni sotuvga chiqaring.
          </p>
        ) : (
          <ul>
            {orders.slice(0, 5).map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {o.serviceTitle}
                    <span className="ml-2 rounded bg-s3 px-1.5 py-0.5 text-[10px] text-tt">
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-tt">
                    {o.name} · {o.email}
                  </p>
                  {o.telegramConfirmedAt && (
                    <p className="mt-1 text-[11px] text-ok">Telegram tasdiqlandi</p>
                  )}
                </div>
                <p className="font-mono text-sm text-accent-text">
                  {formatMoney(o.amount, o.currency) ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 md:mt-10">
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
          <h2 className="label text-[10px]">Oxirgi xabarlar</h2>
          <Link href="/admin/messages" className="text-[13px] text-accent-text hover:text-crimson-100">
            Hammasi &rarr;
          </Link>
        </div>

        {inbox.length === 0 ? (
          <p className="py-8 text-sm text-tt">Hozircha xabar yo&apos;q.</p>
        ) : (
          <ul>
            {inbox.slice(0, 5).map((m) => (
              <li key={m.id} className="border-b border-line py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {m.name}
                    {!m.read && (
                      <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-tp">
                        yangi
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-tt">
                    {m.createdAt.toLocaleDateString("uz-UZ")}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-ts">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 md:mt-10">
        <h2 className="label text-[10px]">Tez amallar</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { href: "/admin/projects/new", label: "Yangi loyiha" },
            { href: "/admin/store/new", label: "Saytni sotuvga qo'yish" },
            { href: "/admin/journal/new", label: "Yangi yozuv" },
            { href: "/admin/settings", label: "Sozlamalar" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="inline-flex h-11 items-center rounded-lg border border-line-2 px-4 text-sm transition-colors hover:border-line-3 hover:bg-s2"
            >
              {a.label}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-tt">
          {catalog.length} ta xizmat yo&apos;nalishi · {posts.length} ta jurnal yozuvi
        </p>
      </section>
    </>
  );
}
