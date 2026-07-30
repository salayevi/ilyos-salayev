import Link from "next/link";
import { notFound } from "next/navigation";

import { ServiceForm } from "@/components/admin/service-form";
import { getServiceById } from "@/lib/queries";

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = getServiceById(Number(id));
  if (!service) notFound();

  return (
    <>
      <Link href="/admin/services" className="label text-[10px] hover:text-tp">
        &larr; Xizmatlar
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">{service.title}</h1>
      <div className="mt-8">
        <ServiceForm service={service} />
      </div>
    </>
  );
}
