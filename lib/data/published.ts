import type { Prisma } from "@prisma/client";

/**
 * The single definition of "visible to the public". Scheduled articles become
 * visible once their time passes, even before the cron job flips their status.
 */
export function publishedWhere(now = new Date()): Prisma.ArticleWhereInput {
  return {
    OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledFor: { lte: now } }],
  };
}

export const publishedOrder: Prisma.ArticleOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { createdAt: "desc" },
];

export function isPubliclyVisible(a: { status: string; scheduledFor: Date | null }): boolean {
  if (a.status === "PUBLISHED") return true;
  if (a.status === "SCHEDULED" && a.scheduledFor && a.scheduledFor.getTime() <= Date.now())
    return true;
  return false;
}

export function paginate(page: number, perPage: number) {
  const safePage = Math.max(1, Math.floor(page || 1));
  return { skip: (safePage - 1) * perPage, take: perPage, page: safePage };
}
