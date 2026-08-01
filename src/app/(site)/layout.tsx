import { OpeningSequence } from "@/components/intro/opening-sequence";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { VisitorTracker } from "@/components/site/visitor-tracker";
import { getAnalyticsConsent } from "@/lib/analytics";
import { getSettings } from "@/lib/queries";
import { readSession } from "@/lib/session";

// Content is editable from /admin, so pages must read the database per request
// rather than serving a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, consent, session] = await Promise.all([
    getSettings(),
    getAnalyticsConsent(),
    readSession(),
  ]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-void"
      >
        Asosiy qismga o&apos;tish
      </a>
      <OpeningSequence />
      <VisitorTracker consent={consent} />
      <SiteNav
        status={settings.availability}
        label={settings.availabilityLabel}
        hasAdminAccess={Boolean(session)}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
