"use client";

import { useActionState } from "react";

import { deletePost, savePost, type FormState } from "@/lib/actions/admin";
import type { Post } from "@/db/schema";
import { DangerButton, Field, SaveBar, Toggle, areaCls, inputCls } from "./ui";

export function PostForm({ post }: { post?: Post }) {
  const [state, action] = useActionState<FormState, FormData>(savePost, {});

  return (
    <>
      <form action={action}>
        <input type="hidden" name="id" value={post?.id ?? ""} />
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Sarlavha" htmlFor="title" error={state.fieldErrors?.title}>
            <input id="title" name="title" defaultValue={post?.title} className={inputCls} />
          </Field>
          <Field
            label="Slug"
            htmlFor="slug"
            hint="URL manzili: /journal/slug"
            error={state.fieldErrors?.slug}
          >
            <input id="slug" name="slug" defaultValue={post?.slug} className={inputCls} />
          </Field>
        </div>

        <Field label="Qisqacha" htmlFor="excerpt" className="mt-5">
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={post?.excerpt}
            className={areaCls}
          />
        </Field>

        <Field
          label="Matn"
          htmlFor="body"
          className="mt-5"
          hint="Abzatslar bo'sh qator bilan ajratiladi"
        >
          <textarea id="body" name="body" rows={14} defaultValue={post?.body} className={areaCls} />
        </Field>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Mavzu" htmlFor="topic">
            <input
              id="topic"
              name="topic"
              defaultValue={post?.topic}
              placeholder="Ovoz · TTS"
              className={inputCls}
            />
          </Field>
          <Field
            label="O'qish vaqti (daqiqa)"
            htmlFor="readMinutes"
            error={state.fieldErrors?.readMinutes}
          >
            <input
              id="readMinutes"
              name="readMinutes"
              inputMode="numeric"
              defaultValue={post?.readMinutes ?? 5}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Toggle name="published" label="Saytda ko'rinsin" defaultChecked={post?.published ?? true} />
        </div>

        <SaveBar ok={state.ok} error={state.error} />
      </form>

      {post && (
        <form action={deletePost} className="mt-8 border-t border-line pt-6">
          <input type="hidden" name="id" value={post.id} />
          <DangerButton type="submit">Yozuvni o&apos;chirish</DangerButton>
        </form>
      )}
    </>
  );
}
