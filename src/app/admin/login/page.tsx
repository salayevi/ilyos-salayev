import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { readSession } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  if (await readSession()) redirect("/admin");
  const changed = (await searchParams).changed === "1";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div aria-hidden className="shaft h-[620px] w-[440px]" />
      <div className="relative w-full max-w-[400px]">
        <p className="label text-[10px]">Boshqaruv paneli</p>
        <h1 className="mt-3 font-display text-[44px] leading-none tracking-[-0.03em]">Kirish</h1>
        {changed && (
          <p className="mt-4 rounded-lg border border-ok/40 bg-ok-bg px-4 py-3 text-sm text-ok">
            Parol yangilandi. Yangi parol bilan qayta kiring.
          </p>
        )}
        <div className="mt-7">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
