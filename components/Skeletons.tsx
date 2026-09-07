import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-rule/70", className)} aria-hidden="true" />;
}

export function CardSkeleton({ image = true }: { image?: boolean }) {
  return (
    <div className="space-y-2">
      {image ? <Bar className="aspect-[3/2] w-full" /> : null}
      <Bar className="h-3 w-16" />
      <Bar className="h-5 w-full" />
      <Bar className="h-5 w-4/5" />
      <Bar className="h-3 w-24" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="space-y-3">
      <Bar className="aspect-[16/10] w-full" />
      <Bar className="h-3 w-16" />
      <Bar className="h-9 w-full" />
      <Bar className="h-9 w-3/4" />
      <Bar className="h-5 w-2/3" />
    </div>
  );
}

export function FrontPageSkeleton() {
  return (
    <div className="container py-6" aria-busy="true" aria-label="Loading">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <HeroSkeleton />
        </div>
        <div className="space-y-6 lg:col-span-4">
          <CardSkeleton image={false} />
          <CardSkeleton image={false} />
          <CardSkeleton image={false} />
        </div>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="container max-w-3xl py-8" aria-busy="true" aria-label="Loading">
      <Bar className="h-3 w-20" />
      <Bar className="mt-4 h-10 w-full" />
      <Bar className="mt-2 h-10 w-5/6" />
      <Bar className="mt-4 h-6 w-3/4" />
      <Bar className="mt-6 aspect-[16/9] w-full" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Bar key={i} className={cn("h-4", i % 3 === 2 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="container py-8" aria-busy="true" aria-label="Loading">
      <Bar className="h-8 w-48" />
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
