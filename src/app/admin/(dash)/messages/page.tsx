import {
  deleteMessage,
  saveLeadNotes,
  setLeadStatus,
  setMessageArchived,
  setMessageRead,
} from "@/lib/actions/admin";
import {
  budgetLabel,
  contactLabel,
  PIPELINE,
  serviceLabel,
  stageOf,
  tierLabel,
  timelineLabel,
} from "@/lib/leads";
import { getMessages } from "@/lib/queries";

/** Pipeline colour reuses the status tokens rather than inventing a palette. */
const TONE: Record<string, string> = {
  neutral: "border-line-2 text-ts",
  info: "border-info/40 bg-info-bg text-info",
  warn: "border-warn/40 bg-warn-bg text-warn",
  ok: "border-ok/40 bg-ok-bg text-ok",
  bad: "border-bad/40 bg-bad-bg text-bad",
};

/**
 * One piece of qualifying detail. Renders nothing when the sender skipped the
 * field, so a bare three-field enquiry looks exactly as it did before rather
 * than sprouting a row of empty labels.
 */
function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="label text-[9px]">{label}</span>
      <span className="text-[13px] text-ts">{value}</span>
    </div>
  );
}

export default async function AdminMessages({
  searchParams,
}: {
  searchParams: Promise<{ arxiv?: string }>;
}) {
  const { arxiv } = await searchParams;
  const archived = arxiv === "1";
  const inbox = await getMessages({ archived });

  const pill =
    "inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] transition-colors";

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Xabarlar</h1>
        <div className="flex gap-2">
          <a
            href="/admin/messages"
            className={`${pill} ${archived ? "border-line-2 text-ts hover:text-tp" : "border-accent bg-accent text-tp"}`}
          >
            Kiruvchi
          </a>
          <a
            href="/admin/messages?arxiv=1"
            className={`${pill} ${archived ? "border-accent bg-accent text-tp" : "border-line-2 text-ts hover:text-tp"}`}
          >
            Arxiv
          </a>
        </div>
      </header>

      {inbox.length === 0 ? (
        <p className="mt-10 text-sm text-tt">
          {archived ? "Arxiv bo'sh." : "Kiruvchi xabar yo'q."}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3 md:mt-8">
          {inbox.map((m) => {
            const stage = stageOf(m.status);
            const hasDetail =
              m.service || m.tier || m.budget || m.timeline || m.company || m.phone || m.preferredContact;

            return (
              <li
                key={m.id}
                className={`rounded-[12px] border bg-s1 p-4 md:p-5 ${
                  m.read ? "border-line" : "border-line-accent"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="flex items-center gap-2 font-medium">
                    {m.name}
                    {m.company && <span className="text-[13px] font-normal text-tt">· {m.company}</span>}
                    {!m.read && (
                      <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-tp">
                        yangi
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${TONE[stage.tone]}`}
                    >
                      {stage.label}
                    </span>
                    <p className="font-mono text-xs text-tt">
                      {m.createdAt.toLocaleString("uz-UZ")}
                    </p>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <a href={`mailto:${m.email}`} className="text-accent-text hover:text-crimson-100">
                    {m.email}
                  </a>
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="text-accent-text hover:text-crimson-100">
                      {m.phone}
                    </a>
                  )}
                </div>

                {hasDetail && (
                  <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-line bg-s2 p-3.5 md:grid-cols-4">
                    <Detail label="Ish" value={m.service ? serviceLabel(m.service) : ""} />
                    <Detail label="Tarif" value={m.tier ? tierLabel(m.tier) : ""} />
                    <Detail label="Byudjet" value={m.budget ? budgetLabel(m.budget) : ""} />
                    <Detail label="Muddat" value={m.timeline ? timelineLabel(m.timeline) : ""} />
                    <Detail
                      label="Aloqa"
                      value={m.preferredContact ? contactLabel(m.preferredContact) : ""}
                    />
                  </div>
                )}

                <p className="mt-3 text-[15px] leading-[1.7] whitespace-pre-wrap text-ts">{m.body}</p>

                {/*
                  Notes save on blur-then-submit rather than per keystroke: an
                  autosaving textarea inside a server action would post on every
                  character, and these are written once when the call ends.
                */}
                <form action={saveLeadNotes} className="mt-4">
                  <input type="hidden" name="id" value={m.id} />
                  <label htmlFor={`notes-${m.id}`} className="label text-[9px]">
                    Ichki eslatma
                  </label>
                  <textarea
                    id={`notes-${m.id}`}
                    name="notes"
                    rows={2}
                    defaultValue={m.notes}
                    placeholder="Suhbat natijasi, kelishilgan narx, keyingi qadam…"
                    className="mt-1.5 w-full rounded-lg border border-line-2 bg-s2 p-3 text-[14px] leading-[1.6] text-tp placeholder:text-tt focus:border-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className={`${pill} mt-2 border-line-2 text-ts hover:text-tp`}
                  >
                    Eslatmani saqlash
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <form action={setLeadStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <label htmlFor={`status-${m.id}`} className="label text-[9px]">
                      Bosqich
                    </label>
                    <select
                      id={`status-${m.id}`}
                      name="status"
                      defaultValue={m.status}
                      className="h-9 rounded-lg border border-line-2 bg-s2 px-2.5 text-[13px] text-tp focus:border-accent focus:outline-none"
                    >
                      {PIPELINE.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={`${pill} border-line-2 text-ts hover:text-tp`}>
                      O&apos;zgartirish
                    </button>
                  </form>

                  <form action={setMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="read" value={m.read ? "0" : "1"} />
                    <button type="submit" className={`${pill} border-line-2 text-ts hover:text-tp`}>
                      {m.read ? "O'qilmagan deb belgilash" : "O'qilgan deb belgilash"}
                    </button>
                  </form>
                  <form action={setMessageArchived}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="archived" value={archived ? "0" : "1"} />
                    <button type="submit" className={`${pill} border-line-2 text-ts hover:text-tp`}>
                      {archived ? "Arxivdan chiqarish" : "Arxivlash"}
                    </button>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className={`${pill} border-bad/40 text-bad hover:bg-bad-bg`}
                    >
                      O&apos;chirish
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
