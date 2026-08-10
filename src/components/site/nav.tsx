"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { useCinemaFrame } from "@/components/cinema/use-cinema";
import { Availability } from "./availability";

const LINKS = [
  { href: "/work", label: "Ishlangan ishlar" },
  { href: "/tayyor-saytlar", label: "Tayyor saytlar" },
  { href: "/services", label: "Xizmatlar" },
  { href: "/about", label: "Men haqimda" },
  { href: "/journal", label: "Jurnal" },
] as const;

const OPENING_COPY: Record<string, string> = {
  "/work": "Ishlar arxivi ochilmoqda",
  "/tayyor-saytlar": "Tayyor saytlar vitrinasiga kiring",
  "/services": "Hamkorlik shakllari ochilmoqda",
  "/about": "Muhandis ortidagi hikoya",
  "/journal": "Yozuvlar va kuzatuvlar",
  "/contact": "Suhbat uchun joy ochilmoqda",
  "/admin": "Boshqaruv markazi ochilmoqda",
};

export function SiteNav({
  status,
  label,
  hasAdminAccess,
}: {
  status: string;
  label: string;
  hasAdminAccess: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Carries the route it announces, so it clears itself the moment that route
  // is the current one — no effect watching the pathname.
  const [routeCue, setRouteCue] = useState<{ text: string; to: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const cueText = routeCue && routeCue.to !== pathname ? routeCue.text : null;

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

  /*
    The bar rides the shared loop rather than a scroll listener of its own.
    One less `requestAnimationFrame` on the page, and — more to the point — it
    now reads the same scroll position as everything else on the same frame,
    so it cannot lag the scene by a tick.
  */
  const lastY = useRef(0);
  useCinemaFrame((frame) => {
    const y = frame.scrollY;
    const next = y < 28 ? false : Math.abs(y - lastY.current) > 10 ? y > lastY.current : hidden;
    lastY.current = y;
    // React state, but only on an actual change — a handful of times a page,
    // never per frame.
    if (next !== hidden) setHidden(next);
  });

  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const enter = (href: string, text: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setOpen(false);
    setHidden(false);
    setRouteCue({ text: OPENING_COPY[href] ?? text, to: href });
    window.setTimeout(() => router.push(href), 220);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-[rgb(5_6_7/0.35)] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <nav
          aria-label="Asosiy"
          className="relative mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 md:h-18 md:px-10 lg:px-20"
        >
          <Link
            href="/"
            onClick={enter("/", "Bosh sahifa ochilmoqda")}
            className="group absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 text-[11px] font-medium tracking-[0.16em] text-tp/90 transition-opacity hover:text-tp md:text-[13px]"
            aria-label="Bosh sahifa"
          >
            <Image
              src="/brand/logo-ilyos-salayev.webp"
              alt=""
              width={64}
              height={64}
              priority
              // The mark leans in a little under the pointer. Transform only,
              // so it costs a composite and nothing else.
              className="size-7 rounded-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08] md:size-8"
            />
            <span className="hidden sm:inline">ILYOS SALAYEV</span>
          </Link>

          {/* Five destinations no longer fit beside the wordmark at tablet
              widths, so the full bar starts at `lg` and md keeps the sheet. */}
          <ul className="hidden gap-5 text-[13px] whitespace-nowrap lg:flex xl:gap-7 xl:text-[14px]">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={enter(l.href, l.label)}
                  aria-current={isOn(l.href) ? "page" : undefined}
                  className={`nav-link transition-colors hover:text-tp ${isOn(l.href) ? "text-tp/90" : "text-ts/55"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 lg:flex">
            <Availability status={status} label={label} className="h-8 border-transparent bg-transparent text-xs opacity-70" />
            {hasAdminAccess && (
              <Link
                href="/admin"
                onClick={enter("/admin", "Boshqaruv markazi ochilmoqda")}
                className="inline-flex h-9.5 items-center rounded-lg border border-gold/40 px-4 text-sm font-medium text-gold transition-colors hover:bg-gold-900"
              >
                Panel
              </Link>
            )}
            <Link
              href="/contact"
              onClick={enter("/contact", "Suhbat uchun joy ochilmoqda")}
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
            className="flex size-11 flex-col items-end justify-center gap-[5px] lg:hidden"
          >
            <span aria-hidden className="block h-px w-5 bg-tp" />
            <span aria-hidden className="block h-px w-3.5 bg-tp" />
          </button>
        </nav>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[rgb(23_27_33/0.97)] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menyu"
        >
          <div className="flex h-14 items-center justify-between px-5">
            <span className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em]">
              <Image
                src="/brand/logo-ilyos-salayev.webp"
                alt=""
                width={48}
                height={48}
                className="size-6 rounded-full object-cover"
              />{" "}
              ILYOS SALAYEV
            </span>
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
                  onClick={enter(l.href, l.label)}
                    className="block py-3 text-4xl font-medium tracking-[-0.02em]"
                    aria-current={isOn(l.href) ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {hasAdminAccess && (
                <li>
                  <Link href="/admin" onClick={enter("/admin", "Boshqaruv markazi ochilmoqda")} className="block py-3 text-4xl font-medium tracking-[-0.02em] text-gold">
                    Panel
                  </Link>
                </li>
              )}
            </ul>
            <hr className="my-9 border-line" />
            <Availability status={status} label={label} />
          </div>
        </div>
      )}

      {cueText && (
        <div className="pointer-events-none fixed inset-0 z-80 flex items-center justify-center bg-void/92 px-6 text-center backdrop-blur-sm">
          <div className="max-w-lg">
            <span aria-hidden className="mx-auto mb-5 block h-px w-12 bg-gold" />
            <p className="label text-[10px]">Portfolio navigatsiyasi</p>
            <p className="mt-3 font-display text-4xl leading-none tracking-[-0.03em] text-tp md:text-6xl">{cueText}</p>
          </div>
        </div>
      )}
    </>
  );
}
