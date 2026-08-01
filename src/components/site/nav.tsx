"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Availability } from "./availability";

const LINKS = [
  { href: "/work", label: "Ishlar" },
  { href: "/about", label: "Men haqimda" },
  { href: "/services", label: "Xizmatlar" },
  { href: "/journal", label: "Jurnal" },
] as const;

export function SiteNav({ status, label }: { status: string; label: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[rgb(5_6_7/0.35)] backdrop-blur-md">
        <nav
          aria-label="Asosiy"
          className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 md:h-18 md:px-10 lg:px-20"
        >
          <Link
            href="/"
            className="text-[13px] font-medium tracking-[0.2em] text-tp/75 transition-opacity hover:text-tp md:text-[17px]"
            aria-label="Bosh sahifa"
          >
            <span className="md:hidden">IS</span>
            <span className="hidden md:inline">ILYOS SALAYEV</span>
          </Link>

          <ul className="hidden gap-10 text-[15px] md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isOn(l.href) ? "page" : undefined}
                  className={`transition-colors hover:text-tp ${isOn(l.href) ? "text-tp/90" : "text-ts/55"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-5 md:flex">
            <Availability status={status} label={label} className="h-8 border-transparent bg-transparent text-xs opacity-70" />
            <Link
              href="/contact"
              className="inline-flex h-9.5 items-center rounded-lg border border-line-2/60 px-5 text-sm font-medium text-tp/80 transition-colors hover:border-line-3 hover:bg-s2 hover:text-tp"
            >
              Bog&apos;lanish
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menyuni ochish"
            aria-expanded={open}
            className="flex size-11 flex-col items-end justify-center gap-[5px] md:hidden"
          >
            <span aria-hidden className="block h-px w-5 bg-tp" />
            <span aria-hidden className="block h-px w-3.5 bg-tp" />
          </button>
        </nav>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[rgb(23_27_33/0.97)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menyu"
        >
          <div className="flex h-14 items-center justify-between px-5">
            <span className="text-[13px] font-medium tracking-[0.2em]">IS</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Menyuni yopish"
              className="flex size-11 items-center justify-center text-2xl"
              autoFocus
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-8 pb-10">
            <ul className="flex flex-col gap-1.5">
              {[...LINKS, { href: "/contact", label: "Bog'lanish" }].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-4xl font-medium tracking-[-0.02em]"
                    aria-current={isOn(l.href) ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <hr className="my-9 border-line" />
            <Availability status={status} label={label} />
          </div>
        </div>
      )}
    </>
  );
}
