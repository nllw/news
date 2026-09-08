import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requirePageUser } from "@/lib/auth-guards";
import { getSettingsUncached } from "@/lib/data/settings";

export default async function SettingsPage() {
  const me = await requirePageUser();
  if (me.role !== "ADMIN") notFound();
  const settings = await getSettingsUncached();
  return (
    <>
      <PageHeader
        title="Site settings"
        description="Name, tagline, and links shown across the public site."
      />
      <SettingsForm initial={settings} />
    </>
  );
}
