import Image from "next/image";
import { cn } from "@/lib/utils";

export interface SafeImageMedia {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  thumbUrl?: string | null;
}

interface SafeImageProps {
  media?: SafeImageMedia | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  aspect?: "16/9" | "16/10" | "4/3" | "3/2" | "1/1" | "auto";
  useThumb?: boolean;
  /** Set when the image is purely decorative and the adjacent text describes it. */
  decorative?: boolean;
}

const ASPECT: Record<NonNullable<SafeImageProps["aspect"]>, string> = {
  "16/9": "aspect-[16/9]",
  "16/10": "aspect-[16/10]",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
  auto: "",
};

/**
 * Renders next/image with a fixed aspect box. Never throws when the media is
 * missing: it renders a neutral block so layout stays intact.
 */
export function SafeImage({
  media,
  sizes,
  priority,
  className,
  imgClassName,
  aspect = "16/9",
  useThumb = false,
  decorative = false,
}: SafeImageProps) {
  const src = media ? (useThumb && media.thumbUrl ? media.thumbUrl : media.url) : null;
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "relative overflow-hidden bg-rule/60",
          ASPECT[aspect],
          aspect === "auto" && "aspect-[16/9]",
          className
        )}
      />
    );
  }
  const alt = decorative ? "" : (media?.alt ?? "");
  if (aspect === "auto" && media?.width && media?.height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={media.width}
        height={media.height}
        sizes={sizes}
        priority={priority}
        className={cn("h-auto w-full", imgClassName, className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-rule/40",
        ASPECT[aspect] || "aspect-[16/9]",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", imgClassName)}
      />
    </div>
  );
}
