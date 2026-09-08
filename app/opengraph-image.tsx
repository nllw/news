import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data/settings";

export const runtime = "nodejs";
export const alt = "Site preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const settings = await getSettings();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAFAF7",
        color: "#1A1A18",
        fontFamily: "Georgia, serif",
        borderTop: "16px solid #1A1A18",
        borderBottom: "16px solid #1A1A18",
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>{settings.siteName}</div>
      {settings.tagline ? (
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#595959",
            fontFamily: "sans-serif",
          }}
        >
          {settings.tagline}
        </div>
      ) : null}
    </div>,
    { ...size }
  );
}
