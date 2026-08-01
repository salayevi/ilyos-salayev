import Link from "next/link";

import type { SiteSettings } from "@/lib/queries";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const socials = [
    { label: "GitHub", href: settings.github },
    { label: "Telegram", href: settings.telegram ? `https://t.me/${settings.telegram.replace(/^@/, "")}` : "" },
    { label: "LinkedIn", href: settings.linkedin },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 border-t border-line md:mt-36">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 py-12 text-sm text-tt md:flex-row md:justify-between md:px-10 md:py-14 lg:px-20">
        <div>
          <p className="text-[15px] font-medium tracking-[0.2em] text-tp">ILYOS SALAYEV</p>
          <p className="mt-3.5">
            Sun&apos;iy intellekt muhandisi{settings.location ? ` · ${settings.location}` : ""}
          </p>
          <a href={`mailto:${settings.email}`} className="mt-1 inline-block hover:text-tp">
            {settings.email}
          </a>
        </div>

        <div className="flex gap-14">
          <div>
            <p className="label text-[11px]">Sayt</p>
            <ul className="mt-3 space-y-2 text-ts">
              <li>
                <Link href="/work" className="hover:text-tp">
                  Ishlangan ishlar
                </Link>
              </li>
              <li>
                <Link href="/tayyor-saytlar" className="hover:text-tp">
                  Tayyor saytlar
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-tp">
                  Xizmatlar
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-tp">
                  Men haqimda
                </Link>
              </li>
            </ul>
          </div>

          {socials.length > 0 && (
            <div>
              <p className="label text-[11px]">Aloqa</p>
              <ul className="mt-3 space-y-2 text-ts">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-tp"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="mx-auto max-w-[1440px] px-5 pb-10 text-xs text-td md:px-10 lg:px-20">
        © {new Date().getFullYear()} Ilyos Salayev
      </p>
    </footer>
  );
}
