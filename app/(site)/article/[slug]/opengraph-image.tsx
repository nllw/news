import { ImageResponse } from "next/og";
import { getPublishedArticleBySlug } from "@/lib/data/articles";
import { getSettings } from "@/lib/data/settings";

export const runtime = "nodejs";
export const alt = "Article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: { slug: string } }) {
  const [article, settings] = await Promise.all([
    getPublishedArticleBySlug(params.slug),
    getSettings(),
  ]);
  const headline = article?.headline ?? settings.siteName;
  const kicker = article?.section.name ?? settings.tagline;
  const byline = article ? `By ${article.author.name}` : "";
  const image = article?.featuredImage?.url;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "#1A1A18",
        color: "#FAFAF7",
        fontFamily: "Georgia, serif",
        position: "relative",
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(26,26,24,0) 20%, rgba(26,26,24,0.95) 80%)",
        }}
      />
      <div
        style={{
          position: "relative",
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#FF6B6B",
            fontFamily: "sans-serif",
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontSize: headline.length > 80 ? 52 : 64,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: 1060,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "sans-serif",
            fontSize: 24,
            color: "#D6D6D2",
          }}
        >
          <span>{byline}</span>
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              fontSize: 30,
              color: "#FAFAF7",
            }}
          >
            {settings.siteName}
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
