import "../globals.css";
import { LogoutButton } from "./LogoutButton";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-admin-bg font-ui text-admin-ink">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/admin" className="font-semibold">
              Editor
            </a>
            <a href="/admin" className="text-sm text-gray-600 hover:text-admin-ink">
              Articles
            </a>
            <a
              href="/"
              target="_blank"
              className="text-sm text-gray-600 hover:text-admin-ink"
            >
              View front page &#8599;
            </a>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
