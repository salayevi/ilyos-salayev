import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/shell";
import { logout } from "@/lib/actions/auth";
import { getUnreadCount } from "@/lib/queries";
import { readSession } from "@/lib/session";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/admin/login");

  const unread = await getUnreadCount();

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <div className="flex items-baseline gap-3">
            <span className="text-[13px] font-medium tracking-[0.2em]">IS</span>
            <span className="label text-[10px]">Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden h-9 items-center rounded-lg border border-line-2 px-3.5 text-[13px] text-ts transition-colors hover:border-line-3 hover:text-tp sm:inline-flex"
            >
              Saytni ko&apos;rish
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-lg border border-line-2 px-3.5 text-[13px] text-ts transition-colors hover:border-line-3 hover:text-tp"
              >
                Chiqish
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1280px] flex-col px-4 md:flex-row md:gap-10 md:px-8 md:py-10">
        <AdminNav unread={unread} />
        <main className="min-w-0 flex-1 py-6 md:py-0">
          <p className="sr-only">Kirgan: {session.name}</p>
          {children}
        </main>
      </div>
    </div>
  );
}
