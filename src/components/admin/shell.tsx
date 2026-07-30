"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Umumiy", exact: true },
  { href: "/admin/projects", label: "Loyihalar" },
  { href: "/admin/services", label: "Xizmatlar" },
  { href: "/admin/journal", label: "Jurnal" },
  { href: "/admin/messages", label: "Xabarlar" },
  { href: "/admin/settings", label: "Sozlamalar" },
] as const;

export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const isOn = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    // Sidebar on desktop; a horizontal scroll rail pinned under the header on
    // mobile, so the panel is usable one-handed rather than a shrunken desktop.
    <nav
      aria-label="Panel"
      className="rail sticky top-14 z-30 -mx-4 overflow-x-auto border-b border-line bg-void/95 px-4 backdrop-blur md:static md:mx-0 md:w-56 md:shrink-0 md:overflow-visible md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none"
    >
      <ul className="flex gap-1.5 py-3 whitespace-nowrap md:sticky md:top-24 md:flex-col md:py-0">
        {NAV.map((n) => {
          const on = isOn(n.href, "exact" in n ? n.exact : false);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                  on ? "bg-gold text-void" : "text-ts hover:bg-s2 hover:text-tp"
                }`}
              >
                {n.label}
                {n.href === "/admin/messages" && unread > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                      on ? "bg-void/20 text-void" : "bg-gold text-void"
                    }`}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
