import Link from "next/link";

import { ProjectForm } from "@/components/admin/project-form";

export default function NewProject() {
  return (
    <>
      <Link href="/admin/projects" className="label text-[10px] hover:text-tp">
        &larr; Loyihalar
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">Yangi loyiha</h1>
      <div className="mt-8">
        <ProjectForm />
      </div>
    </>
  );
}
