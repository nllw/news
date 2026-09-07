"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  Tags,
  UserCircle,
  Users,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Role } from "@/lib/types";

interface AdminShellProps {
  user: { name: string | null; email: string; role: Role };
  siteName: string;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/articles", label: "Articles", Icon: FileText },
  { href: "/admin/front-page", label: "Front page", Icon: LayoutTemplate },
  { href: "/admin/media", label: "Media", Icon: ImageIcon },
  { href: "/admin/taxonomy", label: "Sections & tags", Icon: Tags },
  { href: "/admin/users", label: "Users", Icon: Users, adminOnly: true },
  { href: "/admin/settings", label: "Settings", Icon: Settings, adminOnly: true },
];

export function AdminShell({ user, siteName, onLogout, children }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.adminOnly || user.role === "ADMIN");

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5 p-3">
      {items.map(({ href, label, Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-ui-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background font-ui text-foreground">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <Menu />
        </Button>
        <Link href="/admin" className="font-display text-lg font-black tracking-tight">
          {siteName}
        </Link>
        <span className="rounded bg-muted-ui px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-ui-foreground">
          Newsroom
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              View site <ExternalLink aria-hidden="true" />
            </a>
          </Button>
          <ThemeToggle className="text-foreground hover:bg-accent" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu">
                <UserCircle />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium text-foreground">{user.name ?? "Account"}</p>
                <p className="truncate text-xs">{user.email}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide">{user.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/account">
                  <UserCircle /> Account settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void onLogout()}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-30 w-60 border-r bg-background transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {nav}
        </aside>
        {open ? (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        ) : null}
        <main id="main" className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
