import Link from "next/link";
import { cn } from "@/lib/utils";

interface KickerProps {
  section: { name: string; slug: string };
  className?: string;
  asLink?: boolean;
}

export function Kicker({ section, className, asLink = true }: KickerProps) {
  const classes = cn(
    "font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-wire-text",
    asLink && "hover:underline",
    className
  );
  if (!asLink) return <span className={classes}>{section.name}</span>;
  return (
    <Link href={`/section/${section.slug}`} className={cn(classes, "relative z-10")}>
      {section.name}
    </Link>
  );
}
