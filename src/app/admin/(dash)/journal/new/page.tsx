import Link from "next/link";

import { PostForm } from "@/components/admin/post-form";

export default function NewPost() {
  return (
    <>
      <Link href="/admin/journal" className="label text-[10px] hover:text-tp">
        &larr; Jurnal
      </Link>
      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] md:text-5xl">Yangi yozuv</h1>
      <div className="mt-8">
        <PostForm />
      </div>
    </>
  );
}
