import { PageHeader } from "@/components/admin/PageHeader";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { listMedia } from "@/lib/data/media";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const q = searchParams.q ?? "";
  const result = await listMedia(page, 40, q);
  return (
    <>
      <PageHeader
        title="Media"
        description={`${result.total} image${result.total === 1 ? "" : "s"}`}
      />
      <MediaLibrary
        items={result.items.map((m) => ({
          id: m.id,
          url: m.url,
          thumbUrl: m.thumbUrl,
          alt: m.alt,
          credit: m.credit,
          caption: m.caption,
          width: m.width,
          height: m.height,
          sizeBytes: m.sizeBytes,
          createdAt: m.createdAt.toISOString(),
          uploadedBy: m.uploadedBy?.name ?? m.uploadedBy?.email ?? null,
        }))}
        page={result.page}
        totalPages={result.totalPages}
        q={q}
      />
    </>
  );
}
