import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/data/settings";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const session = await auth();
  if (session?.user) redirect("/admin");
  const settings = await getSettings();
  const next = searchParams.next?.startsWith("/admin") ? searchParams.next : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-ui text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-black tracking-tight">{settings.siteName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-ui-foreground">
            Newsroom sign in
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
