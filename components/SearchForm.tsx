import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  defaultValue?: string;
  size?: "sm" | "lg";
  autoFocus?: boolean;
  className?: string;
}

export function SearchForm({
  defaultValue = "",
  size = "sm",
  autoFocus,
  className,
}: SearchFormProps) {
  const id = size === "lg" ? "search-lg" : "search-sm";
  return (
    <form action="/search" method="get" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search articles
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search"
        autoFocus={autoFocus}
        autoComplete="off"
        className={cn(
          "w-full rounded-full border border-rule bg-surface font-ui text-ink placeholder:text-muted focus:border-ink",
          size === "lg" ? "h-12 pl-5 pr-12 text-base" : "h-9 pl-4 pr-10 text-sm"
        )}
      />
      <button
        type="submit"
        aria-label="Search"
        className={cn(
          "absolute right-1 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink",
          size === "lg" ? "h-10 w-10" : "h-7 w-7"
        )}
      >
        <Search className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
      </button>
    </form>
  );
}
