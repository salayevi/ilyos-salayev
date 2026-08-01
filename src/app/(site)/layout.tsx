import { OpeningSequence } from "@/components/intro/opening-sequence";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { getSettings } from "@/lib/queries";

// Content is editable from /admin, so pages must read the database per request
// rather than serving a build-time snapshot.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-void"
      >
        Asosiy qismga o&apos;tish
      </a>
      <OpeningSequence />
      <SiteNav status={settings.availability} label={settings.availabilityLabel} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
