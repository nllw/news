import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data/settings";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const settings = await getSettings();
  const letter = (settings.siteName.replace(/^the\s+/i, "").trim()[0] ?? "N").toUpperCase();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1A1A18",
        color: "#FAFAF7",
        fontFamily: "Georgia, serif",
        fontSize: 44,
        fontWeight: 900,
        borderRadius: 8,
      }}
    >
      {letter}
    </div>,
    { ...size }
  );
}
