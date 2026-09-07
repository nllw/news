import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import type { MediaMetaInput } from "@/lib/validation/media";
import { paginate } from "./published";

export async function listMedia(page = 1, perPage = 40, q = "") {
  const { skip, take, page: safePage } = paginate(page, perPage);
  const where = q.trim()
    ? {
        OR: [
          { alt: { contains: q.trim() } },
          { caption: { contains: q.trim() } },
          { credit: { contains: q.trim() } },
        ],
      }
    : {};
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { uploadedBy: { select: { name: true, email: true } } },
    }),
    prisma.media.count({ where }),
  ]);
  return {
    items,
    page: safePage,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export const getMedia = (id: string) => prisma.media.findUnique({ where: { id } });

export async function updateMediaMeta(id: string, input: MediaMetaInput) {
  return prisma.media.update({
    where: { id },
    data: { alt: input.alt, credit: input.credit || null, caption: input.caption || null },
  });
}

export async function deleteMedia(id: string) {
  const media = await prisma.media.findUnique({
    where: { id },
    include: { _count: { select: { featuredIn: true, avatarOf: true } } },
  });
  if (!media) return null;
  const inUse = media._count.featuredIn + media._count.avatarOf;
  if (inUse > 0) {
    throw new Error(
      `This image is used by ${inUse} item${inUse === 1 ? "" : "s"}. Replace it there first.`
    );
  }
  await prisma.media.delete({ where: { id } });
  await Promise.allSettled([
    storage.delete(media.key),
    storage.delete(media.key.replace(/-full\.webp$/, "-thumb.webp")),
  ]);
  return media;
}
