import { deleteMessage, setMessageArchived, setMessageRead } from "@/lib/actions/admin";
import { getMessages } from "@/lib/queries";

export default async function AdminMessages({
  searchParams,
}: {
  searchParams: Promise<{ arxiv?: string }>;
}) {
  const { arxiv } = await searchParams;
  const archived = arxiv === "1";
  const inbox = getMessages({ archived });

  const pill =
    "inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] transition-colors";

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Xabarlar</h1>
        <div className="flex gap-2">
          <a
            href="/admin/messages"
            className={`${pill} ${archived ? "border-line-2 text-ts hover:text-tp" : "border-gold bg-gold text-void"}`}
          >
            Kiruvchi
          </a>
          <a
            href="/admin/messages?arxiv=1"
            className={`${pill} ${archived ? "border-gold bg-gold text-void" : "border-line-2 text-ts hover:text-tp"}`}
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
          {inbox.map((m) => (
            <li
              key={m.id}
              className={`rounded-[12px] border bg-s1 p-4 md:p-5 ${
                m.read ? "border-line" : "border-gold/40"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="flex items-center gap-2 font-medium">
                  {m.name}
                  {!m.read && (
                    <span className="rounded-full bg-gold px-1.5 py-0.5 text-[10px] text-void">
                      yangi
                    </span>
                  )}
                </p>
                <p className="font-mono text-xs text-tt">
                  {new Date(m.createdAt * 1000).toLocaleString("uz-UZ")}
                </p>
              </div>

              <a href={`mailto:${m.email}`} className="mt-1 inline-block text-sm text-gold">
                {m.email}
              </a>

              <p className="mt-3 text-[15px] leading-[1.7] whitespace-pre-wrap text-ts">{m.body}</p>

              <div className="mt-4 flex flex-wrap gap-2">
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
          ))}
        </ul>
      )}
    </>
  );
}
