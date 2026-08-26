import type { Metadata } from "next";

import { WorkFilter } from "@/components/site/work-filter";
import { getProjects } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Ishlangan ishlar",
  description:
    "Yakunlangan loyihalar — har birida saytning haqiqiy ekran surati va keys matni.",
  path: "/work",
});

export default async function WorkPage() {
  const projects = await getProjects({ onlyPublished: true });

  return (
    <section className="mx-auto max-w-[1440px] px-5 pt-9 pb-4 md:px-10 md:pt-28 lg:px-20">
      <p className="label text-[10px] md:text-xs">Arxiv</p>
      <h1 className="mt-3.5 font-display text-[52px] leading-none tracking-[-0.03em] md:mt-6 md:text-8xl">
        Ishlangan ishlar
      </h1>
      <p className="mt-3.5 max-w-[560px] text-base text-ts md:mt-5 md:text-lg">
        Har bir kartada saytning haqiqiy ekran surati — bezak emas, ishlab turgan
        sahifaning o&apos;zi.
      </p>

      <WorkFilter projects={projects} />
    </section>
  );
}
