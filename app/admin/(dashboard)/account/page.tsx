import { PageHeader } from "@/components/admin/PageHeader";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth-guards";

export default async function AccountPage() {
  const me = await requirePageUser();
  return (
    <>
      <PageHeader title="Account" description={me.email} />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your sign-in details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-ui-foreground">Name:</span> {me.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-ui-foreground">Email:</span> {me.email}
            </p>
            <p>
              <span className="text-muted-ui-foreground">Role:</span> {me.role}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Use at least 12 characters.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
