import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { UsersTable } from "@/components/admin/UsersTable";
import { requirePageUser } from "@/lib/auth-guards";
import { listUsers } from "@/lib/data/users";

export default async function UsersPage() {
  const me = await requirePageUser();
  if (me.role !== "ADMIN") notFound();
  const users = await listUsers();
  return (
    <>
      <PageHeader
        title="Users"
        description="Who can sign in to the newsroom, and what they can do."
      />
      <UsersTable
        meId={me.id}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role as "ADMIN" | "EDITOR",
          active: u.active,
          createdAt: u.createdAt.toISOString(),
          author: u.author?.name ?? null,
        }))}
      />
    </>
  );
}
