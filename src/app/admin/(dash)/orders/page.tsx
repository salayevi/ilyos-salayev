import { deleteOrder, setOrderStatus } from "@/lib/actions/admin";
import { ORDER_STATUS_LABELS, formatMoney } from "@/lib/format";
import { getOrders } from "@/lib/queries";

const FLOW = ["new", "contacted", "scheduled", "paid", "done", "declined"] as const;

const STATUS_STYLES: Record<string, string> = {
  new: "bg-accent text-tp",
  contacted: "bg-info-bg text-info",
  scheduled: "bg-info-bg text-info",
  paid: "bg-ok-bg text-ok",
  done: "bg-s3 text-ts",
  declined: "bg-bad-bg text-bad",
};

export default async function AdminOrders() {
  const rows = await getOrders();
  const open = rows.filter((o) => o.status !== "done" && o.status !== "declined");
  const earned = rows
    .filter((o) => o.status === "paid" || o.status === "done")
    .reduce<Record<string, number>>((acc, o) => {
      acc[o.currency] = (acc[o.currency] ?? 0) + o.amount;
      return acc;
    }, {});

  const pill =
    "inline-flex h-9 items-center rounded-lg border px-3 text-[13px] transition-colors";

  return (
    <>
      <header>
        <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Buyurtmalar</h1>
        <p className="mt-2 text-sm text-tt">
          Xizmat tariflari va tayyor saytlar bo&apos;yicha kelgan so&apos;rovlar.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-3 md:gap-4">
        <div className="rounded-[12px] border border-line bg-s1 p-4 md:p-5">
          <p className="label text-[10px]">Ochiq</p>
          <p className="mt-2 font-display text-4xl text-accent-text md:text-5xl">{open.length}</p>
        </div>
        <div className="rounded-[12px] border border-line bg-s1 p-4 md:p-5">
          <p className="label text-[10px]">Jami so&apos;rov</p>
          <p className="mt-2 font-display text-4xl text-accent-text md:text-5xl">{rows.length}</p>
        </div>
        <div className="col-span-2 rounded-[12px] border border-line bg-s1 p-4 md:col-span-1 md:p-5">
          <p className="label text-[10px]">To&apos;langan va yakunlangan</p>
          <p className="mt-2 font-display text-3xl text-accent-text md:text-4xl">
            {Object.keys(earned).length === 0
              ? "—"
              : Object.entries(earned)
                  .map(([code, sum]) => formatMoney(sum, code) ?? `${sum} ${code}`)
                  .join(" · ")}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-tt">Hozircha buyurtma yo&apos;q.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {rows.map((o) => (
            <li
              key={o.id}
              className={`rounded-[12px] border bg-s1 p-4 md:p-5 ${
                o.status === "new" ? "border-line-accent" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {o.serviceTitle}
                  <span className="rounded border border-line-2 px-1.5 py-0.5 font-mono text-[10px] text-tt">
                    {o.kind === "product" ? "tayyor sayt" : "xizmat"}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      STATUS_STYLES[o.status] ?? STATUS_STYLES.new
                    }`}
                  >
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </p>
                <p className="font-mono text-xs text-tt">{o.createdAt.toLocaleString("uz-UZ")}</p>
              </div>

              <p className="mt-2 font-mono text-sm text-accent-text">
                {formatMoney(o.amount, o.currency) ?? "Narx kelishiladi"}
              </p>
              {o.telegramConfirmedAt && (
                <p className="mt-1 text-[11px] text-ok">
                  Xaridor Telegram xabarini {o.telegramConfirmedAt.toLocaleString("uz-UZ")} da tasdiqlagan
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span className="text-tp">{o.name}</span>
                <a href={`mailto:${o.email}`} className="text-accent-text hover:text-crimson-100">
                  {o.email}
                </a>
                {o.phone && (
                  <a href={`tel:${o.phone}`} className="text-ts hover:text-tp">
                    {o.phone}
                  </a>
                )}
                {o.preferredStart && <span className="text-tt">{o.preferredStart}</span>}
              </div>

              {o.brief && (
                <p className="mt-3 text-[15px] leading-[1.7] whitespace-pre-wrap text-ts">
                  {o.brief}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {FLOW.filter((s) => s !== o.status).map((s) => (
                  <form key={s} action={setOrderStatus}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" className={`${pill} border-line-2 text-ts hover:text-tp`}>
                      {ORDER_STATUS_LABELS[s]}
                    </button>
                  </form>
                ))}
                <form action={deleteOrder}>
                  <input type="hidden" name="id" value={o.id} />
                  <button type="submit" className={`${pill} border-bad/40 text-bad hover:bg-bad-bg`}>
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
