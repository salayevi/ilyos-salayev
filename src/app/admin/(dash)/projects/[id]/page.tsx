import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/admin/project-form";
import { getProjectById } from "@/lib/queries";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(Number(id));
  if (!project) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/projects" className="label text-[10px] hover:text-tp">
          &larr; Loyihalar
        </Link>
        <Link
          href={`/work/${project.slug}`}
          target="_blank"
          className="text-[13px] text-gold hover:text-gold-300"
        >
          Saytda ko&apos;rish &rarr;
        </Link>
      </div>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">{project.title}</h1>
      <div className="mt-8">
        <ProjectForm project={project} />
      </div>
    </>
  );
}
