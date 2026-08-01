import { IntegrationForm } from "@/components/admin/integration-form";
import { SettingsForm } from "@/components/admin/settings-form";
import { getIntegrationStatus } from "@/lib/integrations";
import { getSettings } from "@/lib/queries";

export default async function AdminSettings() {
  const [settings, integrations] = await Promise.all([getSettings(), getIntegrationStatus()]);

  return (
    <>
      <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl">Sozlamalar</h1>
      <p className="mt-2 text-sm text-tt">Sayt matnlari, aloqa va ishlayotgan integratsiyalar.</p>
      <div className="mt-8">
        <SettingsForm settings={settings} />
      </div>
      <div className="mt-8">
        <IntegrationForm status={integrations} />
      </div>
    </>
  );
}
