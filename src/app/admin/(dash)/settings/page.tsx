import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/queries";

export default async function AdminSettings() {
  const settings = await getSettings();

  return (
    <>
      <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Sozlamalar</h1>
      <p className="mt-2 text-sm text-tt">
        Bu yerdagi matnlar saytda bevosita ko&apos;rinadi.
      </p>
      <div className="mt-8">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
