import type { Metadata } from "next";

import { Availability } from "@/components/site/availability";
import { ContactForm } from "@/components/site/contact-form";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Bog'lanish",
  description: "Loyihangiz haqida yozing — bir ish kuni ichida javob beraman.",
};

export default async function ContactPage({
  searchParams,
}: {
  // A plan card on /pricing links here with `?tarif=dog|wolf|dragon`, so the
  // enquiry can open already knowing which conversation it is. Validated in
  // the action regardless — this only decides what the form shows.
  searchParams: Promise<{ tarif?: string }>;
}) {
  const { tarif } = await searchParams;
  const s = await getSettings();

  const rows = [
    { label: "Email", value: s.email, href: `mailto:${s.email}` },
    s.telegram
      ? { label: "Telegram", value: s.telegram, href: `https://t.me/${s.telegram.replace(/^@/, "")}` }
      : null,
    s.github ? { label: "GitHub", value: "salayevi", href: s.github } : null,
    { label: "Javob vaqti", value: "1 ish kuni", href: "" },
  ].filter((r): r is { label: string; value: string; href: string } => r !== null);

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pool hidden md:block"
        style={{ width: 800, height: 500, right: 0, top: 60 }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 pt-9 md:flex md:gap-20 md:px-10 md:pt-28 lg:px-20">
        <div className="min-w-0 flex-1">
          <p className="label text-[10px] md:text-xs">Bog&apos;lanish</p>
          <h1 className="mt-3.5 font-display text-[48px] leading-none tracking-[-0.03em] md:mt-6 md:text-8xl">
            Gaplashamiz
          </h1>
          <Availability status={s.availability} label={s.availabilityLabel} className="mt-5" />
          <p className="mt-4 max-w-[520px] text-base text-ts md:text-lg">
            Bir ish kuni ichida javob beraman. Toshkent vaqti, UTC+5.
          </p>

          <div className="mt-7 md:mt-11">
            <ContactForm defaultTier={tarif ?? ""} />
          </div>
        </div>

        <aside className="mt-10 md:mt-30 md:w-95 md:shrink-0">
          <dl>
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-baseline justify-between gap-4 border-b border-line py-4 text-[15px] md:py-4.5"
              >
                <dt className="text-tt">{r.label}</dt>
                <dd className="text-right">
                  {r.href ? (
                    <a
                      href={r.href}
                      target={r.href.startsWith("http") ? "_blank" : undefined}
                      rel={r.href.startsWith("http") ? "noreferrer noopener" : undefined}
                      className="hover:text-accent-text"
                    >
                      {r.value}
                    </a>
                  ) : (
                    r.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
