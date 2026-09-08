import { AdminShell } from "@/components/admin/AdminShell";
import { requirePageUser } from "@/lib/auth-guards";
import { getSettings } from "@/lib/data/settings";
import { logoutAction } from "@/app/admin/actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([requirePageUser(), getSettings()]);
  return (
    <AdminShell user={user} siteName={settings.siteName} onLogout={logoutAction}>
      {children}
    </AdminShell>
  );
}
