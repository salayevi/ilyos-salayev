import Link from "next/link";

import { ServiceForm } from "@/components/admin/service-form";

export default function NewService() {
  return (
    <>
      <Link href="/admin/services" className="label text-[10px] hover:text-tp">
        &larr; Xizmatlar
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">Yangi xizmat</h1>
      <div className="mt-8">
        <ServiceForm />
      </div>
    </>
  );
}
