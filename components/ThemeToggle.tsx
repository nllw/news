"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, SunMoon } from "lucide-react";
import { cn } from "@/lib/utils";

const ORDER = ["system", "light", "dark"] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (mounted ? theme : "system") ?? "system";
  const next = ORDER[(ORDER.indexOf(current as (typeof ORDER)[number]) + 1) % ORDER.length];
  const label = `Theme: ${current}. Switch to ${next}.`;
  const Icon = current === "dark" ? Moon : current === "light" ? Sun : SunMoon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-current transition-colors hover:bg-ink/10",
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
