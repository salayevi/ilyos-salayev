import { LEVEL_MARK, PLAN_FEATURES, type Plan } from "@/lib/plans";

/**
 * The three tiers, feature by feature.
 *
 * On a phone this is 18 rows × 4 columns, which no amount of shrinking makes
 * readable — so the table scrolls sideways and the feature column stays pinned
 * to the left edge. Losing sight of *which* row you are reading is the failure
 * mode of every responsive pricing table, and a sticky label column is the
 * cheapest fix that keeps one source of markup for both layouts.
 */
export function PlanComparison({ plans }: { plans: Plan[] }) {
  return (
    <div className="mt-8 md:mt-12">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">
            Dog, Wolf va Dragon tariflarining imkoniyatlari bo&apos;yicha taqqoslanishi
          </caption>
          <thead>
            <tr className="border-b border-line-2">
              <th
                scope="col"
                className="label sticky left-0 z-10 bg-void py-4 pr-4 text-[10px] font-normal"
              >
                Imkoniyat
              </th>
              {plans.map((p) => (
                <th
                  key={p.tier}
                  scope="col"
                  className={`w-[18%] py-4 text-center font-display text-xl tracking-[-0.01em] md:text-2xl ${
                    p.tier === "dragon" ? "text-accent-text" : "text-tp"
                  }`}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURES.map((row) => (
              <tr key={row.label} className="border-b border-line">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-void py-3 pr-4 text-[13px] font-normal text-ts md:text-sm"
                >
                  {row.label}
                </th>
                {row.levels.map((level, i) => {
                  const mark = LEVEL_MARK[level];
                  return (
                    <td key={plans[i].tier} className="py-3 text-center">
                      {/*
                        The glyph alone means nothing to a screen reader, so the
                        word is what gets announced and the mark is decoration
                        beside it.
                      */}
                      <span className="sr-only">{mark.label}</span>
                      <span
                        aria-hidden
                        className={
                          level === "no"
                            ? "text-td"
                            : level === "optional"
                              ? "text-tt"
                              : "text-accent-text"
                        }
                      >
                        {mark.glyph}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        {(["yes", "optional", "custom", "no"] as const).map((level) => (
          <li key={level} className="flex items-center gap-2 text-xs text-tt">
            <span
              aria-hidden
              className={level === "no" ? "text-td" : level === "optional" ? "text-tt" : "text-accent-text"}
            >
              {LEVEL_MARK[level].glyph}
            </span>
            {LEVEL_MARK[level].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
