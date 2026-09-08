import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { label: string; variant: "success" | "muted" | "warning" | "outline" }> =
  {
    PUBLISHED: { label: "Published", variant: "success" },
    DRAFT: { label: "Draft", variant: "muted" },
    SCHEDULED: { label: "Scheduled", variant: "warning" },
    ARCHIVED: { label: "Archived", variant: "outline" },
  };

export function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
