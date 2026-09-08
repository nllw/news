import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  href?: string;
  id?: string;
  level?: 2 | 3;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeading({
  title,
  href,
  id,
  level = 2,
  className,
  children,
}: SectionHeadingProps) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <div
      className={cn(
        "mb-4 flex items-baseline justify-between border-b-2 border-ink pb-2",
        className
      )}
    >
      <Tag id={id} className="font-ui text-sm font-bold uppercase tracking-[0.12em]">
        {href ? (
          <Link href={href} className="hover:text-wire-text">
            {title}
          </Link>
        ) : (
          title
        )}
      </Tag>
      {children ??
        (href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 font-ui text-xs text-muted hover:text-ink"
            prefetch={false}
          >
            More <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        ) : null)}
    </div>
  );
}
