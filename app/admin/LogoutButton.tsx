"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-admin-ink"
    >
      Log out
    </button>
  );
}
