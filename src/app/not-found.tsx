import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div aria-hidden className="shaft h-[600px] w-[420px]" />
      <p
        aria-hidden
        className="pointer-events-none absolute font-display text-[190px] leading-none opacity-[0.07] select-none md:text-[380px]"
      >
        404
      </p>

      <div className="relative">
        <h1 className="text-2xl font-medium md:text-4xl">Bu kadr mavjud emas</h1>
        <p className="mt-3 text-[15px] text-ts md:text-lg">
          Sahifa ko&apos;chirilgan yoki hech qachon bo&apos;lmagan.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 md:flex-row md:justify-center">
          <Link
            href="/"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-gold px-7 text-[15px] font-medium text-void transition-colors hover:bg-gold-300 md:w-auto"
          >
            Bosh sahifa
          </Link>
          <Link
            href="/work"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-lg border border-line-2 px-7 text-[15px] font-medium transition-colors hover:border-line-3 hover:bg-s2 md:w-auto"
          >
            Ishlarni ko&apos;rish
          </Link>
        </div>
      </div>
    </main>
  );
}
