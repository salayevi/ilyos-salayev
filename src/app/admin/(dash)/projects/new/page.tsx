import Link from "next/link";

import { ProjectForm } from "@/components/admin/project-form";

// The screenshot provider renders asynchronously and is polled for up to ~15s,
// so the Server Actions on this page need more than the platform default.
export const maxDuration = 60;

export default function NewProject() {
  return (
    <>
      <Link href="/admin/projects" className="label text-[10px] hover:text-tp">
        &larr; Men qilgan va qila oladiganlar
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">Yangi loyiha</h1>
      <p className="mt-2 text-sm text-tt">
        Manba havolasini qo&apos;yib «Tortib olish»ni bosing — nom, tavsif va
        texnologiyalar o&apos;zi to&apos;ladi.
      </p>
      <div className="mt-8">
        <ProjectForm />
      </div>
    </>
  );
}
